"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProjects } from "@/lib/projects-context";
import type { ReviewShare, BrandProject } from "@/lib/data";

export default function ClientEntryPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[#191918]/20 border-t-[#191918] rounded-full animate-spin" />
        </div>
      }
    >
      <ClientEntryContent />
    </React.Suspense>
  );
}

function ClientEntryContent() {
  const params = useParams();
  const router = useRouter();
  const token = (params?.token as string) || "";
  const { getShareByToken, getProject, projects } = useProjects();

  const [share, setShare] = useState<ReviewShare | null | undefined>(undefined);
  const [project, setProject] = useState<BrandProject | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      setProject(getProject(found.projectId));
    }

    const loadApi = async () => {
      try {
        const res = await fetch(`/api/reviews/${effectiveToken}`);
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

        setProject({
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
        });
      } catch (err) {
        if (!found) setShare(null);
      }
    };

    loadApi();
  }, [mounted, token, getShareByToken, getProject, projects]);

  // Loading state
  if (share === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#191918]/20 border-t-[#191918] rounded-full animate-spin" />
      </div>
    );
  }

  // Invalid / deactivated share
  if (share === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-8">
          <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#969690]">
            Opalite
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#191918] mb-3">
          Review not available
        </h1>
        <p className="text-sm text-[#6B6B66] max-w-sm leading-relaxed">
          This review link may have expired or been deactivated by the designer.
          Please contact your designer for an updated link.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Opalite wordmark */}
      <div className="mb-16 text-center">
        <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#969690]">
          Opalite
        </span>
      </div>

      {/* Project card */}
      <div className="w-full max-w-sm text-center space-y-6">
        {project ? (
          <>
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight text-[#191918] leading-none">
                {project.name}
              </h1>
              <p className="text-sm text-[#6B6B66]">{project.type}</p>
            </div>

            <div className="w-16 h-px bg-[#EBEBE7] mx-auto" />

            <div className="space-y-1">
              <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#969690]">
                Presented by
              </p>
              <p className="text-sm font-medium text-[#191918]">Studio Opalite</p>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-xs text-[#6B6B66]">
                Your designer has shared creative directions for your review.
              </p>
              <div className="inline-flex items-center gap-2 text-[11px] font-mono text-[#969690]">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    share.accessLevel === "VIEW"
                      ? "bg-[#969690]"
                      : share.accessLevel === "COMMENT"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                />
                {share.accessLevel === "VIEW"
                  ? "View access"
                  : share.accessLevel === "COMMENT"
                  ? "Comment access"
                  : "Edit access"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push(`/client/${token}/review`)}
              className="w-full py-3.5 rounded-full bg-[#191918] text-white text-sm font-medium hover:bg-[#2E2E2C] transition-colors cursor-pointer"
            >
              View Project
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold tracking-tight text-[#191918]">
              Creative Review
            </h1>
            <p className="text-sm text-[#6B6B66]">Loading project details…</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-20 text-[11px] text-[#BCBCB6] font-mono text-center">
        Opalite · Confidential Creative Review
      </div>
    </div>
  );
}
