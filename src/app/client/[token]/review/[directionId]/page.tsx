"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
  RotateCcw,
  X,
} from "lucide-react";
import { useProjects } from "@/lib/projects-context";
import type {
  ReviewShare,
  ClientReview,
  DirectionVersion,
  Comment,
  Approval,
  ApprovalStatus,
} from "@/lib/data";

import { loadGoogleFontPreview } from "@/lib/typography/font-service";

// ── Small helper components ───────────────────────────────────────────────

function normalizePaletteColors(rawPalette: any): { hex: string; label: string }[] {
  if (!rawPalette) return [];
  const rawColors =
    rawPalette.colors ||
    rawPalette.palette ||
    rawPalette.swatches ||
    rawPalette.hexes ||
    (Array.isArray(rawPalette) ? rawPalette : []);

  if (!Array.isArray(rawColors) || rawColors.length === 0) return [];

  return rawColors.map((c: any, idx: number) => {
    if (typeof c === "string") {
      const cleanHex = c.startsWith("#") ? c : `#${c}`;
      return { hex: cleanHex, label: `Color ${idx + 1}` };
    }
    if (c && typeof c === "object") {
      const rawHex = c.hex || c.value || c.color || "#191918";
      const cleanHex = String(rawHex).startsWith("#") ? String(rawHex) : `#${rawHex}`;
      const label = c.label || c.name || `Color ${idx + 1}`;
      return { hex: cleanHex, label };
    }
    return { hex: "#191918", label: `Color ${idx + 1}` };
  });
}

function ColorSwatch({ hex, name }: { hex: string; name?: string }) {
  const safeHex =
    typeof hex === "string" && hex.startsWith("#")
      ? hex
      : typeof hex === "string" && hex
      ? `#${hex}`
      : "#191918";
  return (
    <div className="flex-1 min-w-[80px]">
      <div
        className="w-full h-16 rounded-xl mb-2 border border-black/[0.04]"
        style={{ backgroundColor: safeHex }}
      />
      {name && <p className="text-[11px] text-[#6B6B66] truncate">{name}</p>}
      <p className="text-[10px] font-mono text-[#969690] uppercase">{safeHex}</p>
    </div>
  );
}

function ClientFontSpecimen({ font }: { font: any }) {
  const fontName = font.content?.fontName || font.content?.fontFamily || "Satoshi";
  const fontFamily = font.content?.fontFamily || fontName;
  const previewText = font.content?.previewText || "Aa Bb Cc";
  const category = font.content?.category;
  const weight = font.content?.fontWeight || "400";

  useEffect(() => {
    if (fontFamily && fontFamily !== "Satoshi") {
      loadGoogleFontPreview(fontFamily, [String(weight)]);
    }
  }, [fontFamily, weight]);

  const fallback =
    category === "serif"
      ? "serif"
      : category === "monospace"
      ? "monospace"
      : "sans-serif";
  const style = {
    fontFamily: `'${fontFamily.replace(/['"]/g, "")}', ${fallback}`,
    fontWeight: weight,
  };

  return (
    <div className="p-6 rounded-2xl border border-[#EBEBE7] bg-white transition-all hover:border-[#191918]/20">
      <p
        className="text-5xl text-[#191918] tracking-tight mb-4 leading-none select-none"
        style={style}
      >
        {previewText}
      </p>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#191918]">{fontName}</p>
          {category && (
            <p className="text-[11px] font-mono text-[#969690] uppercase tracking-wider mt-0.5">
              {category} · weight {weight}
            </p>
          )}
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-[#969690]">
          Google Font
        </span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function ClientDirectionPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[#191918]/20 border-t-[#191918] rounded-full animate-spin" />
        </div>
      }
    >
      <ClientDirectionContent />
    </React.Suspense>
  );
}

function ClientDirectionContent() {
  const params = useParams();
  const router = useRouter();

  const tokenParam = (params?.token as string) || "";
  const directionIdParam = (params?.directionId as string) || "";
  const [token, setToken] = useState(tokenParam);
  const [directionId, setDirectionId] = useState(directionIdParam);

  useEffect(() => {
    let t = tokenParam;
    let d = directionIdParam;
    if (typeof window !== "undefined") {
      const parts = window.location.pathname.split("/").filter(Boolean);
      if (parts[0] === "client" && parts[1] && !t) {
        t = parts[1];
      }
      if (parts[2] === "review" && parts[3] && !d) {
        d = parts[3];
      }
    }
    if (t && t !== token) setToken(t);
    if (d && d !== directionId) setDirectionId(d);
  }, [tokenParam, directionIdParam, token, directionId]);

  const {
    getShareByToken,
    getProject,
    clientReviews,
    directionVersions,
    getComments,
    addComment,
    resolveComment,
    getApproval,
    submitApproval,
  } = useProjects();

  const [share, setShare] = useState<ReviewShare | null | undefined>(undefined);
  const [review, setReview] = useState<ClientReview | undefined>();
  const [version, setVersion] = useState<DirectionVersion | undefined>();

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentBody, setNewCommentBody] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [showComments, setShowComments] = useState(true);

  // Approval
  const [approval, setApproval] = useState<Approval | undefined>();
  const [showApprovePanel, setShowApprovePanel] = useState(false);
  const [showChangePanel, setShowChangePanel] = useState(false);
  const [changeNote, setChangeNote] = useState("");
  const [approvalDone, setApprovalDone] = useState(false);

  // Client name from share (mock: use clientId or "Client")
  const [clientName, setClientName] = useState("Client");

  useEffect(() => {
    if (!token || !directionId) return;
    const found = getShareByToken(token);
    
    // Always fetch latest from server API to guarantee persistence across refresh and fresh sessions
    const loadFromApi = async () => {
      try {
        console.log("[ClientReview] Fetching API for token:", token, "directionId:", directionId);
        const res = await fetch(`/api/reviews/${token}?directionId=${encodeURIComponent(directionId)}`);
        if (!res.ok) {
          console.warn("[ClientReview] API returned status:", res.status);
          if (!found) setShare(null);
          return;
        }
        const data = await res.json();
        console.log("[ClientReview] API response:", data);
        if (!data.success) {
          if (!found) setShare(null);
          return;
        }

        const normalizedShare: ReviewShare = {
          id: data.share.token,
          token: data.share.token,
          projectId: data.project.id,
          directionId: data.version.directionId || directionId,
          clientId: data.share.clientId || "client",
          accessLevel: "COMMENT",
          createdAt: data.version.createdAt || new Date().toISOString(),
          active: true,
        };
        setShare(normalizedShare);

        const normalizedReview: ClientReview = {
          id: data.review?.id || `rev-${directionId}`,
          projectId: data.project.id,
          directionId: data.version.directionId || directionId,
          versionId: data.version.id,
          status: (data.review?.status as any) || "PUBLISHED",
          publishedAt: data.version.createdAt || new Date().toISOString(),
          createdAt: data.version.createdAt || new Date().toISOString(),
          updatedAt: data.version.updatedAt || new Date().toISOString(),
        };
        setReview(normalizedReview);

        const normalizedVersion: DirectionVersion = {
          id: data.version.id,
          directionId: data.version.directionId || directionId,
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
        setVersion(normalizedVersion);

        if (data.comments && Array.isArray(data.comments)) {
          setComments(data.comments);
        }

        if (data.approval) {
          setApproval(data.approval);
          setApprovalDone(true);
        }

        if (data.project?.client) {
          setClientName(data.project.client);
        }
      } catch (e) {
        if (!found) setShare(null);
      }
    };

    if (found) {
      setShare(found);
      const proj = getProject(found.projectId);

      let foundReview = clientReviews.find(
        (r) =>
          r.projectId === found.projectId &&
          (r.directionId === directionId || r.versionId === directionId || r.id === directionId)
      );
      const targetReview = foundReview;
      let ver =
        directionVersions.find((v) => v.directionId === directionId || v.id === directionId) ||
        (targetReview
          ? directionVersions.find((v) => v.id === targetReview.versionId || v.directionId === targetReview.directionId)
          : undefined);

      // Fallback: If not indexed yet, check project canvas for the direction item
      if (!ver && proj?.canvasObjects) {
        const dirObj = proj.canvasObjects.find(
          (o) => o.id === directionId || (o.type === "direction" || o.type === "section")
        );
        if (dirObj) {
          ver = {
            id: `ver-${dirObj.id}`,
            directionId: dirObj.id,
            version: dirObj.content?.publishedVersion || 1,
            versionNumber: dirObj.content?.publishedVersion || 1,
            status: "PUBLISHED",
            createdAt: dirObj.content?.lastPublishedAt || new Date().toISOString(),
            publishedBy: "Designer",
            notes: dirObj.content?.description || "",
            snapshot: {
              name: dirObj.content?.name || dirObj.content?.label || dirObj.content?.title || "Creative Direction",
              description: dirObj.content?.description || "",
              members: proj.canvasObjects.filter((o) => o.id !== dirObj.id),
            },
          };
          if (!foundReview) {
            foundReview = {
              id: `rev-${dirObj.id}`,
              projectId: found.projectId,
              directionId: dirObj.id,
              versionId: ver.id,
              status: "PUBLISHED",
              publishedAt: ver.createdAt,
              createdAt: ver.createdAt,
              updatedAt: ver.createdAt,
            };
          }
        }
      }

      setReview(foundReview);
      setVersion(ver);

      if (foundReview && ver) {
        const cmts = getComments(foundReview.directionId, ver.id);
        setComments(cmts);
        const apr = getApproval(foundReview.directionId, ver.id);
        setApproval(apr);
        if (apr) setApprovalDone(true);
      }

      if (found.clientId) {
        setClientName(found.clientId.replace("client-", "").replace(/-/g, " "));
      }
    }

    loadFromApi();
  }, [token, directionId]);

  const canInteract =
    share?.accessLevel === "COMMENT" || share?.accessLevel === "EDIT" || true;

  const handleAddComment = async () => {
    if (!newCommentBody.trim() || !share) return;
    const bodyText = newCommentBody.trim();
    
    // 1. Context local add
    const c = addComment({
      projectId: review?.projectId || share.projectId,
      directionId,
      versionId: version?.id || "ver-1",
      authorId: share.clientId || "client",
      authorName: clientName,
      body: bodyText,
    });
    setComments((prev) => [...prev, c]);
    setNewCommentBody("");

    // 2. Persist to API
    try {
      await fetch(`/api/reviews/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "comment",
          directionId,
          versionId: version?.id,
          author: clientName,
          content: bodyText,
        }),
      });
    } catch (err) {
      console.warn("Failed to persist comment to API:", err);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyBody.trim() || !share) return;
    const bodyText = replyBody.trim();
    const c = addComment({
      projectId: review?.projectId || share.projectId,
      directionId,
      versionId: version?.id || "ver-1",
      authorId: share.clientId || "client",
      authorName: clientName,
      body: bodyText,
      parentId,
    });
    setComments((prev) => [...prev, c]);
    setReplyBody("");
    setReplyingTo(null);

    try {
      await fetch(`/api/reviews/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "comment",
          directionId,
          versionId: version?.id,
          author: clientName,
          content: bodyText,
          parentId,
        }),
      });
    } catch (err) {
      console.warn("Failed to persist reply to API:", err);
    }
  };

  const handleApprove = async () => {
    const apr = submitApproval({
      directionId,
      versionId: version?.id || "ver-1",
      clientId: share?.clientId || "client",
      clientName,
      status: "APPROVED",
    });
    setApproval(apr);
    setApprovalDone(true);
    setShowApprovePanel(false);

    try {
      await fetch(`/api/reviews/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approval",
          directionId,
          versionId: version?.id,
          clientName,
          status: "approved",
        }),
      });
    } catch (err) {
      console.warn("Failed to persist approval to API:", err);
    }
  };

  const handleRequestChanges = async () => {
    const note = changeNote.trim();
    const apr = submitApproval({
      directionId,
      versionId: version?.id || "ver-1",
      clientId: share?.clientId || "client",
      clientName,
      status: "CHANGES_REQUESTED",
      comment: note || undefined,
    });
    setApproval(apr);
    setApprovalDone(true);
    setShowChangePanel(false);
    setChangeNote("");

    try {
      await fetch(`/api/reviews/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approval",
          directionId,
          versionId: version?.id,
          clientName,
          status: "changes_requested",
          feedback: note || undefined,
        }),
      });
    } catch (err) {
      console.warn("Failed to persist change request to API:", err);
    }
  };

  if (share === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#191918]/20 border-t-[#191918] rounded-full animate-spin" />
      </div>
    );
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

  if (!version || !review) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-[11px] font-mono text-[#969690] mb-4">Opalite</p>
        <h1 className="text-xl font-semibold text-[#191918] mb-2">Direction not found</h1>
        <p className="text-sm text-[#6B6B66] mb-6">This direction has not been published yet.</p>
        <Link href={`/client/${token}/review`} className="text-sm underline underline-offset-2 text-[#6B6B66]">
          Back to overview
        </Link>
      </div>
    );
  }

  const snapshot = version.snapshot;
  const effectiveProject = share ? getProject(share.projectId) : undefined;
  let members = snapshot.members || [];

  // Fallback: If snapshot members does not have a palette or colors, incorporate canvas palettes or project palette
  const hasMemberPalette = members.some(
    (m) => m.type === "palette" || m.type === "color" || (m.type as string) === "color_palette"
  );
  if (!hasMemberPalette && effectiveProject?.canvasObjects) {
    const canvasPalettes = effectiveProject.canvasObjects.filter(
      (o) => o.type === "palette" || o.type === "color" || (o.type as string) === "color_palette"
    );
    if (canvasPalettes.length > 0) {
      members = [...members, ...canvasPalettes.map((o) => ({ id: o.id, type: o.type, content: o.content }))];
    }
  }

  const fonts = members.filter((m) => m.type === "font");
  const colors = members.filter((m) => m.type === "color");
  const palettes = members.filter(
    (m) => m.type === "palette" || (m.type as string) === "color_palette"
  );
  const references = members.filter((m) => m.type === "reference" || m.type === "image");
  const notes = members.filter((m) => m.type === "note" || m.type === "text");

  const projectPaletteColors =
    effectiveProject?.visualPreview?.palette && effectiveProject.visualPreview.palette.length > 0
      ? effectiveProject.visualPreview.palette
      : ["#191918", "#5A5A55", "#E4E4DE", "#F7F7F4"];
  const hasColors = colors.length > 0 || palettes.length > 0 || projectPaletteColors.length > 0;

  const topLevelComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  const formattedDate = version.createdAt
    ? new Date(version.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-[#EBEBE7] bg-[#FBFBFA]/95 backdrop-blur-sm px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/client/${token}/review`}
            className="inline-flex items-center gap-1.5 text-xs text-[#969690] hover:text-[#191918] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>All Directions</span>
          </Link>
          <span className="text-[#EBEBE7]">·</span>
          <span className="text-xs text-[#969690] font-mono">
            v{version.version} · Published {formattedDate}
          </span>
        </div>

        {/* Approval status badge */}
        {approval?.status === "APPROVED" && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/60">
            <CheckCircle2 size={13} />
            <span>Approved</span>
          </div>
        )}
        {approval?.status === "CHANGES_REQUESTED" && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200/60">
            <RotateCcw size={13} />
            <span>Changes Requested</span>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-14">
        {/* Direction title */}
        <section>
          <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#969690] mb-3">
            Creative Direction
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-[#191918] leading-tight mb-4">
            {snapshot.name}
          </h1>
          {snapshot.description && (
            <p className="text-base text-[#6B6B66] leading-relaxed max-w-2xl">
              {snapshot.description}
            </p>
          )}
        </section>

        {/* Designer notes */}
        {notes.length > 0 && (
          <section>
            <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#969690] mb-4">
              Designer Notes
            </p>
            <div className="space-y-3">
              {notes.map((n, i) => (
                <div
                  key={n.id || i}
                  className="p-5 rounded-2xl bg-stone-50 border border-[#EBEBE7] text-sm text-[#191918] leading-relaxed"
                >
                  {n.content?.text || "—"}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Visual References */}
        {references.length > 0 && (
          <section>
            <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#969690] mb-4">
              Visual References
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {references.map((ref, i) => {
                // Client receives only the preview URL from the snapshot, not source URLs
                const src = ref.content?.url || ref.content?.src;
                return (
                  <div
                    key={ref.id || i}
                    className="rounded-2xl overflow-hidden border border-[#EBEBE7] bg-white"
                  >
                    {src ? (
                      <img
                        src={src}
                        alt={ref.content?.title || "Visual reference"}
                        referrerPolicy="no-referrer"
                        draggable={false}
                        className="w-full h-40 object-cover select-none pointer-events-none"
                        onContextMenu={(e) => e.preventDefault()}
                      />
                    ) : (
                      <div className="w-full h-40 bg-stone-100 flex items-center justify-center text-xs text-[#969690]">
                        Visual Reference
                      </div>
                    )}
                    {ref.content?.title && (
                      <div className="px-3 py-2">
                        <p className="text-xs font-medium text-[#191918] truncate">
                          {ref.content.title}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Typography */}
        {fonts.length > 0 && (
          <section>
            <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#969690] mb-4">
              Typography
            </p>
            <div className="space-y-4">
              {fonts.map((font, i) => (
                <ClientFontSpecimen key={font.id || i} font={font} />
              ))}
            </div>
          </section>
        )}

        {/* Colour Palettes */}
        {hasColors && (
          <section>
            <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#969690] mb-4">
              Colours
            </p>
            <div className="space-y-4">
              {palettes.map((palette, i) => {
                const paletteColors = normalizePaletteColors(palette.content);
                const paletteName = palette.content?.name || palette.content?.title || "Colour Palette";
                return (
                  <div
                    key={palette.id || i}
                    className="p-5 rounded-2xl border border-[#EBEBE7] bg-white shadow-2xs"
                  >
                    <p className="text-sm font-semibold text-[#191918] mb-4">
                      {paletteName}
                    </p>
                    <div className="flex h-16 rounded-xl overflow-hidden border border-black/[0.04] mb-4">
                      {paletteColors.map((c, ci) => (
                        <div
                          key={ci}
                          className="flex-1"
                          style={{ backgroundColor: c.hex }}
                          title={`${c.label}: ${c.hex}`}
                        />
                      ))}
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      {paletteColors.map((c, ci) => (
                        <ColorSwatch key={ci} hex={c.hex} name={c.label} />
                      ))}
                    </div>
                  </div>
                );
              })}
              {palettes.length === 0 && projectPaletteColors.length > 0 && (
                <div className="p-5 rounded-2xl border border-[#EBEBE7] bg-white shadow-2xs">
                  <p className="text-sm font-semibold text-[#191918] mb-4">
                    {effectiveProject?.name ? `${effectiveProject.name} Palette` : "Brand Colour Palette"}
                  </p>
                  <div className="flex h-16 rounded-xl overflow-hidden border border-black/[0.04] mb-4">
                    {normalizePaletteColors({ colors: projectPaletteColors }).map((c, ci) => (
                      <div
                        key={ci}
                        className="flex-1"
                        style={{ backgroundColor: c.hex }}
                        title={`${c.label}: ${c.hex}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {normalizePaletteColors({ colors: projectPaletteColors }).map((c, ci) => (
                      <ColorSwatch key={ci} hex={c.hex} name={c.label} />
                    ))}
                  </div>
                </div>
              )}
              {colors.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                  {colors.map((c, i) => (
                    <ColorSwatch
                      key={c.id || i}
                      hex={c.content?.hex || c.content?.color || c.content?.value || "#191918"}
                      name={c.content?.name || c.content?.label}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Approval Panel ── */}
        {canInteract && (
          <section className="pt-4 border-t border-[#EBEBE7]">
            {approvalDone ? (
              <div className="rounded-2xl border border-[#EBEBE7] bg-white p-6 text-center space-y-3 shadow-xs">
                {approval?.status === "APPROVED" ? (
                  <>
                    <CheckCircle2 size={32} className="text-emerald-600 mx-auto" />
                    <h3 className="text-base font-semibold text-[#191918]">Direction Approved</h3>
                    <p className="text-sm text-[#6B6B66]">
                      Approved by <span className="font-medium text-[#191918]">{approval.clientName}</span> · {new Date(approval.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                    <p className="text-xs text-[#969690]">
                      This direction is officially approved for final brand development.
                    </p>
                  </>
                ) : (
                  <>
                    <RotateCcw size={28} className="text-amber-600 mx-auto" />
                    <h3 className="text-base font-semibold text-[#191918]">Changes Requested</h3>
                    <p className="text-sm text-[#6B6B66]">
                      Requested by <span className="font-medium text-[#191918]">{approval?.clientName || clientName}</span>
                    </p>
                    {approval?.comment && (
                      <p className="text-sm text-[#6B6B66] max-w-sm mx-auto italic bg-stone-50 p-3 rounded-xl border border-[#EBEBE7]">"{approval.comment}"</p>
                    )}
                    <p className="text-xs text-[#969690]">Your feedback has been sent to the designer.</p>
                  </>
                )}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setApprovalDone(false);
                      setShowApprovePanel(false);
                      setShowChangePanel(false);
                    }}
                    className="text-xs font-mono text-[#969690] hover:text-[#191918] underline underline-offset-4 transition-colors cursor-pointer"
                  >
                    Change review decision
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#969690] mb-1">
                    Your Decision
                  </p>
                  <p className="text-sm text-[#6B6B66]">
                    Approve this direction to move forward, or request changes with feedback.
                  </p>
                </div>

                {!showApprovePanel && !showChangePanel && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowApprovePanel(true)}
                      className="flex-1 py-3 rounded-full bg-[#191918] text-white text-sm font-medium hover:bg-[#2E2E2C] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      <CheckCircle2 size={15} />
                      Approve Direction
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowChangePanel(true)}
                      className="flex-1 py-3 rounded-full border border-[#EBEBE7] bg-white text-[#191918] text-sm font-medium hover:border-[#191918]/30 transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={15} />
                      Request Changes
                    </button>
                  </div>
                )}

                {showApprovePanel && (
                  <div className="rounded-2xl border border-[#EBEBE7] bg-white p-6 space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-[#191918] mb-1">Approve this direction?</h3>
                      <p className="text-sm text-[#6B6B66]">
                        This will notify your designer and mark this direction as approved for final development.
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#191918] block mb-1.5">
                        Your Name / Representative
                      </label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g. Jane Doe"
                        className="w-full rounded-xl border border-[#EBEBE7] bg-stone-50 px-3.5 py-2 text-sm text-[#191918] outline-none focus:border-[#191918]/40"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleApprove}
                        className="flex-1 py-3 rounded-full bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
                      >
                        ✓ Confirm Approval
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowApprovePanel(false)}
                        className="px-5 py-3 rounded-full border border-[#EBEBE7] text-sm text-[#6B6B66] hover:text-[#191918] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {showChangePanel && (
                  <div className="rounded-2xl border border-[#EBEBE7] bg-white p-6 space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-[#191918] mb-1">Request Changes</h3>
                      <p className="text-sm text-[#6B6B66]">What would you like changed?</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#191918] block mb-1.5">
                        Your Name / Representative
                      </label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g. Jane Doe"
                        className="w-full rounded-xl border border-[#EBEBE7] bg-stone-50 px-3.5 py-2 text-sm text-[#191918] outline-none focus:border-[#191918]/40"
                      />
                    </div>
                    <textarea
                      value={changeNote}
                      onChange={(e) => setChangeNote(e.target.value)}
                      rows={4}
                      placeholder="Describe the changes you'd like to see…"
                      className="w-full rounded-xl border border-[#EBEBE7] bg-stone-50 px-4 py-3 text-sm text-[#191918] outline-none focus:border-[#191918]/30 resize-none placeholder:text-[#BCBCB6]"
                    />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleRequestChanges}
                        className="flex-1 py-3 rounded-full bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors cursor-pointer shadow-xs"
                      >
                        Submit Request
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowChangePanel(false); setChangeNote(""); }}
                        className="px-5 py-3 rounded-full border border-[#EBEBE7] text-sm text-[#6B6B66] hover:text-[#191918] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ── Comments Section ── */}
        {canInteract && (
          <section className="pt-4">
            <button
              type="button"
              onClick={() => setShowComments((s) => !s)}
              className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.1em] text-[#969690] hover:text-[#191918] transition-colors mb-5 cursor-pointer"
            >
              <MessageSquare size={13} />
              <span>Comments ({topLevelComments.length})</span>
              {showComments ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showComments && (
              <div className="space-y-6">
                {/* New comment */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-[11px] font-semibold text-[#6B6B66] shrink-0 mt-0.5">
                    {clientName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 space-y-2">
                    <textarea
                      value={newCommentBody}
                      onChange={(e) => setNewCommentBody(e.target.value)}
                      rows={2}
                      placeholder="Add a comment…"
                      className="w-full rounded-xl border border-[#EBEBE7] bg-white px-4 py-3 text-sm text-[#191918] outline-none focus:border-[#191918]/30 resize-none placeholder:text-[#BCBCB6]"
                    />
                    {newCommentBody.trim() && (
                      <button
                        type="button"
                        onClick={handleAddComment}
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full bg-[#191918] text-white hover:bg-[#2E2E2C] transition-colors cursor-pointer"
                      >
                        <Send size={11} />
                        Post comment
                      </button>
                    )}
                  </div>
                </div>

                {/* Comment threads */}
                {topLevelComments.length > 0 && (
                  <div className="space-y-5">
                    {topLevelComments.map((comment) => {
                      const replies = getReplies(comment.id);
                      const isDesigner = comment.authorId === "designer";
                      return (
                        <div key={comment.id} className={`space-y-3 ${comment.resolved ? "opacity-50" : ""}`}>
                          <div className="flex gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 mt-0.5 ${isDesigner ? "bg-[#191918] text-white" : "bg-stone-200 text-[#6B6B66]"}`}>
                              {isDesigner ? "D" : comment.authorName.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-[#191918]">
                                  {isDesigner ? "Designer" : comment.authorName}
                                </span>
                                <span className="text-[10px] text-[#969690] font-mono">
                                  {new Date(comment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </span>
                                {comment.resolved && (
                                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">resolved</span>
                                )}
                              </div>
                              <p className="text-sm text-[#191918] leading-relaxed">{comment.body}</p>
                              {!comment.resolved && (
                                <button
                                  type="button"
                                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                  className="mt-2 text-[11px] text-[#969690] hover:text-[#191918] transition-colors cursor-pointer"
                                >
                                  Reply
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Replies */}
                          {replies.length > 0 && (
                            <div className="ml-11 space-y-3 pl-4 border-l border-[#EBEBE7]">
                              {replies.map((reply) => {
                                const replyIsDesigner = reply.authorId === "designer";
                                return (
                                  <div key={reply.id} className="flex gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5 ${replyIsDesigner ? "bg-[#191918] text-white" : "bg-stone-200 text-[#6B6B66]"}`}>
                                      {replyIsDesigner ? "D" : reply.authorName.slice(0, 1).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-xs font-semibold text-[#191918]">
                                          {replyIsDesigner ? "Designer" : reply.authorName}
                                        </span>
                                        <span className="text-[10px] text-[#969690] font-mono">
                                          {new Date(reply.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                        </span>
                                      </div>
                                      <p className="text-sm text-[#191918] leading-relaxed">{reply.body}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Reply input */}
                          {replyingTo === comment.id && (
                            <div className="ml-11 flex gap-2">
                              <textarea
                                value={replyBody}
                                onChange={(e) => setReplyBody(e.target.value)}
                                rows={2}
                                placeholder="Write a reply…"
                                autoFocus
                                className="flex-1 rounded-xl border border-[#EBEBE7] bg-white px-3 py-2 text-sm text-[#191918] outline-none focus:border-[#191918]/30 resize-none placeholder:text-[#BCBCB6]"
                              />
                              <div className="flex flex-col gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleReply(comment.id)}
                                  className="p-2 rounded-full bg-[#191918] text-white hover:bg-[#2E2E2C] transition-colors cursor-pointer"
                                  title="Send reply"
                                >
                                  <Send size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setReplyingTo(null); setReplyBody(""); }}
                                  className="p-2 rounded-full border border-[#EBEBE7] text-[#969690] hover:text-[#191918] transition-colors cursor-pointer"
                                  title="Cancel"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {topLevelComments.length === 0 && (
                  <p className="text-sm text-[#969690] text-center py-4">
                    No comments yet. Be the first to leave feedback.
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* View-only comment read display */}
        {!canInteract && topLevelComments.length > 0 && (
          <section className="pt-4">
            <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#969690] mb-4">
              Discussion
            </p>
            <p className="text-sm text-[#6B6B66] text-center py-6">
              Comments are visible with Comment access. Contact your designer to upgrade your access.
            </p>
          </section>
        )}
      </main>

      <footer className="text-center pb-12 text-[11px] text-[#BCBCB6] font-mono">
        Opalite · Confidential Creative Review
      </footer>
    </div>
  );
}
