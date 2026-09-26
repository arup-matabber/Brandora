"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, CheckCircle2, Clock, MessageSquare } from "lucide-react";
import { useProjects } from "@/lib/projects-context";
import type { ReviewShare, BrandProject, ClientReview, DirectionVersion } from "@/lib/data";

interface ReviewItem {
  review: ClientReview;
  version: DirectionVersion;
  project?: BrandProject;
}

export default function ClientReviewOverviewPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-5 h-5 border-2 border-[#191918]/20 border-t-[#191918] rounded-full animate-spin" /></div>}>
      <ClientReviewOverviewContent />
    </React.Suspense>
  );
}

function ClientReviewOverviewContent() {
  const params = useParams();
  const router = useRouter();
  const token = (params?.token as string) || "";

  const { getShareByToken, getProject, clientReviews, directionVersions, getApproval, getComments } = useProjects();

  const [share, setShare] = useState<ReviewShare | null | undefined>(undefined);
  const [project, setProject] = useState<BrandProject | undefined>(undefined);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    let effectiveToken = token;
    if (!effectiveToken && typeof window !== "undefined") {
      const parts = window.location.pathname.split("/").filter(Boolean);
      if (parts[0] === "client" && parts[1]) {
        effectiveToken = parts[1];
      }
    }
    if (!effectiveToken) return;

    const found = getShareByToken(effectiveToken);
    if (found) {
      setShare(found);
      const proj = getProject(found.projectId);
      setProject(proj);

      const published = clientReviews.filter(
        (r) =>
          r.projectId === found.projectId &&
          (!r.status ||
            r.status.toUpperCase() === "PUBLISHED" ||
            r.status.toUpperCase() === "APPROVED" ||
            r.status.toUpperCase() === "CHANGES_REQUESTED" ||
            r.status.toLowerCase().includes("pending"))
      );

      let items: ReviewItem[] = published
        .map((review) => {
          const version =
            directionVersions.find((v) => v.id === review.versionId) ||
            directionVersions.find((v) => v.directionId === review.directionId);
          if (!version) return null;
          return { review, version, project: proj } as ReviewItem;
        })
        .filter((x): x is ReviewItem => x !== null);

      // Fallback: If no items in clientReviews, check directionVersions directly
      if (items.length === 0) {
        const matchingVersions = directionVersions.filter((v) => {
          return (v as any).projectId === found.projectId || (proj?.canvasObjects || []).some((o) => o.id === v.directionId);
        });
        if (matchingVersions.length > 0) {
          items = matchingVersions.map((v) => ({
            review: {
              id: `rev-${v.directionId}`,
              projectId: found.projectId,
              directionId: v.directionId,
              versionId: v.id,
              status: "PUBLISHED",
              publishedAt: v.createdAt,
              createdAt: v.createdAt,
              updatedAt: v.createdAt,
            },
            version: v,
            project: proj,
          }));
        }
      }

      // Secondary Fallback: If still empty, check project's canvas for published directions
      if (items.length === 0 && proj?.canvasObjects) {
        const publishedCanvasDirs = proj.canvasObjects.filter(
          (o) => (o.type === "direction" || o.type === "section") && o.content?.published
        );
        if (publishedCanvasDirs.length > 0) {
          items = publishedCanvasDirs.map((d) => ({
            review: {
              id: `rev-${d.id}`,
              projectId: found.projectId,
              directionId: d.id,
              versionId: `ver-${d.id}`,
              status: "PUBLISHED",
              publishedAt: d.content?.lastPublishedAt || new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            version: {
              id: `ver-${d.id}`,
              directionId: d.id,
              version: d.content?.publishedVersion || 1,
              versionNumber: d.content?.publishedVersion || 1,
              status: "PUBLISHED",
              createdAt: d.content?.lastPublishedAt || new Date().toISOString(),
              publishedBy: "Designer",
              notes: d.content?.description || "",
              snapshot: {
                name: d.content?.name || d.content?.label || d.content?.title || "Creative Direction",
                description: d.content?.description || "",
                members: (proj.canvasObjects || []).filter((o) => o.id !== d.id),
              },
            },
            project: proj,
          }));
        }
      }

      setReviewItems(items);
    }

    const loadApi = async () => {
      try {
        const res = await fetch(`/api/reviews/${token}`);
        if (!res.ok) {
          if (!found) setShare(null);
          return;
        }
        const data = await res.json();
        if (!data.success) {
          if (!found) setShare(null);
          return;
        }

        const normalizedShare: ReviewShare = {
          id: data.share.token,
          token: data.share.token,
          projectId: data.project.id,
          directionId: data.version.directionId || "",
          clientId: data.share.clientId || "client",
          accessLevel: "COMMENT",
          createdAt: data.version.createdAt || new Date().toISOString(),
          active: true,
        };
        setShare(normalizedShare);

        const projectData: BrandProject = {
          id: data.project.id,
          name: data.project.name,
          client: data.project.client,
          type: data.project.type || "Brand Identity",
          status: "Active",
          lastEdited: "Just now",
          currentFocus: "Creative Direction Review",
          tagline: data.project.name,
          visualPreview: {
            fontSpecimen: "Satoshi",
            secondaryFont: "Inter",
            monogram: (data.project.name || "OP").slice(0, 2).toUpperCase(),
            palette: ["#191918", "#EBEBE7", "#F7F7F5"],
            gridAccent: "#191918",
          },
        };
        setProject(projectData);

        const normalizedReview: ClientReview = {
          id: data.review?.id || `rev-${data.version.directionId || "1"}`,
          projectId: data.project.id,
          directionId: data.version.directionId || "",
          versionId: data.version.id,
          status: (data.review?.status as any) || "PUBLISHED",
          publishedAt: data.version.createdAt || new Date().toISOString(),
          createdAt: data.version.createdAt || new Date().toISOString(),
          updatedAt: data.version.updatedAt || new Date().toISOString(),
        };

        const normalizedVersion: DirectionVersion = {
          id: data.version.id,
          directionId: data.version.directionId || "",
          version: data.version.versionNumber || data.version.version || 1,
          versionNumber: data.version.versionNumber || data.version.version || 1,
          status: "PUBLISHED",
          createdAt: data.version.createdAt || new Date().toISOString(),
          publishedBy: data.version.publishedBy || "designer",
          notes: data.version.notes || "",
          snapshot: data.version.snapshot || {
            name: data.version.name,
            description: data.version.description,
            members: data.version.canvasItems || [],
          },
        };

        if (data.versions && Array.isArray(data.versions) && data.versions.length > 0) {
          const items: ReviewItem[] = data.versions.map((v: any) => ({
            review: {
              id: `rev-${v.directionId}`,
              projectId: data.project.id,
              directionId: v.directionId,
              versionId: v.id,
              status: v.approval?.status === "APPROVED" ? "APPROVED" : v.approval?.status === "CHANGES_REQUESTED" ? "CHANGES_REQUESTED" : "PUBLISHED",
              publishedAt: v.publishedAt,
              createdAt: v.publishedAt,
              updatedAt: v.publishedAt,
            },
            version: {
              id: v.id,
              directionId: v.directionId,
              version: v.versionNumber || 1,
              versionNumber: v.versionNumber || 1,
              status: "PUBLISHED",
              createdAt: v.publishedAt,
              publishedBy: "designer",
              notes: v.description || "",
              snapshot: {
                name: v.name,
                description: v.description,
                members: v.canvasItems || [],
              },
            },
            project: projectData,
          }));
          setReviewItems(items);
        } else {
          setReviewItems([
            {
              review: normalizedReview,
              version: normalizedVersion,
              project: projectData,
            },
          ]);
        }
      } catch (err) {
        if (!found) setShare(null);
      }
    };

    loadApi();
  }, [mounted, token, getShareByToken, getProject, clientReviews, directionVersions]);

  if (share === undefined) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-5 h-5 border-2 border-[#191918]/20 border-t-[#191918] rounded-full animate-spin" /></div>;
  }

  if (share === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-[11px] font-mono text-[#969690] mb-4">Opalite</p>
        <h1 className="text-xl font-semibold text-[#191918] mb-2">Review not available</h1>
        <p className="text-sm text-[#6B6B66]">This link has expired or been deactivated.</p>
      </div>
    );
  }

  const statusLabel = (review: ClientReview) => {
    if (review.status === "APPROVED") return { text: "Approved", color: "text-emerald-700 bg-emerald-50 border-emerald-200/60" };
    if (review.status === "CHANGES_REQUESTED") return { text: "Changes Requested", color: "text-amber-700 bg-amber-50 border-amber-200/60" };
    return { text: "Awaiting Review", color: "text-[#6B6B66] bg-stone-100 border-black/[0.06]" };
  };

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="border-b border-[#EBEBE7] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/client/${token}`} className="inline-flex items-center gap-1.5 text-xs text-[#969690] hover:text-[#191918] transition-colors">
            <ArrowLeft size={14} />
            <span>Back</span>
          </Link>
          <span className="text-[#EBEBE7]">·</span>
          <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#969690]">Opalite</span>
        </div>
        <div className="text-[11px] font-mono text-[#BCBCB6]">
          {share.accessLevel === "VIEW" ? "View only" : share.accessLevel === "COMMENT" ? "Comment enabled" : "Edit enabled"}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-6 py-16">
        {project && (
          <div className="mb-12">
            <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#969690] mb-3">Project Review</p>
            <h1 className="text-3xl font-semibold tracking-tight text-[#191918] mb-1">{project.name}</h1>
            <p className="text-base text-[#6B6B66]">{project.type}</p>
          </div>
        )}

        {reviewItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <Clock size={20} className="text-[#969690]" />
            </div>
            <h2 className="text-base font-medium text-[#191918] mb-2">No directions published yet</h2>
            <p className="text-sm text-[#6B6B66] max-w-xs mx-auto leading-relaxed">
              Your designer is preparing the creative directions. You'll see them here when they're ready.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[#6B6B66] mb-8 leading-relaxed">
              Your feedback is requested on the following creative directions.
            </p>

            {reviewItems.map(({ review, version }, idx) => {
              const status = statusLabel(review);
              const approval = getApproval(review.directionId, review.versionId);
              const threadComments = getComments(review.directionId, review.versionId);
              const commentCount = threadComments.length;

              return (
                <button
                  key={review.id}
                  type="button"
                  onClick={() => router.push(`/client/${token}/review/${review.directionId}`)}
                  className="w-full text-left group"
                >
                  <div className="rounded-2xl border border-[#EBEBE7] bg-white p-6 hover:border-[#191918]/20 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-[10px] font-mono text-[#969690]">
                            Direction {String(idx + 1).padStart(2, "0")}
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-medium ${status.color}`}>
                            {status.text}
                          </span>
                          {approval?.status === "APPROVED" && (
                            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                          )}
                        </div>
                        <h2 className="text-lg font-semibold text-[#191918] tracking-tight group-hover:underline underline-offset-2">
                          {version.snapshot.name}
                        </h2>
                        {version.snapshot.description && (
                          <p className="text-sm text-[#6B6B66] mt-1.5 line-clamp-2 leading-relaxed">
                            {version.snapshot.description}
                          </p>
                        )}
                        {commentCount > 0 && (
                          <div className="flex items-center gap-1 mt-3 text-[11px] text-[#969690]">
                            <MessageSquare size={12} />
                            <span>{commentCount} comment{commentCount !== 1 ? "s" : ""}</span>
                          </div>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-[#969690] shrink-0 mt-1 group-hover:text-[#191918] transition-colors" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      <footer className="text-center pb-12 text-[11px] text-[#BCBCB6] font-mono">
        Opalite · Confidential Creative Review
      </footer>
    </div>
  );
}
