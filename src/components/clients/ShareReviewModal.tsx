"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  Link2,
  Eye,
  MessageSquare,
  Edit3,
  Power,
  Trash2,
  ExternalLink,
} from "lucide-react";
import type { ReviewShare, AccessLevel } from "@/lib/data";
import { useProjects } from "@/lib/projects-context";

interface ShareReviewModalProps {
  projectId: string;
  projectName: string;
  clientId?: string;
  directionId?: string;
  directionName?: string;
  publishedVersion?: number;
  justPublished?: boolean;
  shareToken?: string;
  onClose: () => void;
}

const ACCESS_OPTIONS: { level: AccessLevel; label: string; description: string; icon: React.ReactNode }[] = [
  {
    level: "VIEW",
    label: "View",
    description: "Client can view published directions only",
    icon: <Eye size={14} />,
  },
  {
    level: "COMMENT",
    label: "Comment",
    description: "Client can view, comment, and approve",
    icon: <MessageSquare size={14} />,
  },
  {
    level: "EDIT",
    label: "Edit",
    description: "Client can comment, approve, and edit permitted fields",
    icon: <Edit3 size={14} />,
  },
];

export function ShareReviewModal({
  projectId,
  projectName,
  clientId,
  directionId,
  directionName,
  publishedVersion,
  justPublished,
  shareToken,
  onClose,
}: ShareReviewModalProps) {
  const {
    createReviewShare,
    getSharesForProject,
    deactivateShare,
    updateShareAccess,
    reviewShares,
  } = useProjects();

  const [selectedAccess, setSelectedAccess] = useState<AccessLevel>("COMMENT");
  const [createdShare, setCreatedShare] = useState<ReviewShare | null>(() => {
    if (shareToken) {
      return {
        id: `share-${shareToken}`,
        token: shareToken,
        projectId,
        directionId,
        accessLevel: "COMMENT",
        createdAt: new Date().toISOString(),
        active: true,
      };
    }
    return null;
  });
  const [copied, setCopied] = useState(false);
  const [linkMode, setLinkMode] = useState<"direction" | "project">(
    directionId ? "direction" : "project"
  );
  const [existingShares, setExistingShares] = useState<ReviewShare[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const active = getSharesForProject(projectId).filter((s) => s.active);
      setExistingShares(active);
      if (shareToken) {
        const found = active.find((s) => s.token === shareToken);
        if (found) {
          setCreatedShare(found);
          setSelectedAccess(found.accessLevel);
        }
      } else if (!createdShare && active.length > 0) {
        setCreatedShare(active[0]);
        setSelectedAccess(active[0].accessLevel);
      }
    }
  }, [mounted, projectId, shareToken, getSharesForProject, reviewShares, createdShare]);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://opalite.app";

  const buildLink = (token: string, forDirection = linkMode === "direction") => {
    if (forDirection && directionId) {
      return `${origin}/client/${token}/review/${directionId}`;
    }
    return `${origin}/client/${token}/review`;
  };

  const handleCreate = () => {
    const share = createReviewShare({
      projectId,
      clientId,
      accessLevel: selectedAccess,
    });
    setCreatedShare(share);
  };

  const handleAccessChange = (level: AccessLevel) => {
    setSelectedAccess(level);
    if (createdShare) {
      updateShareAccess(createdShare.id, level);
      setCreatedShare((prev) => (prev ? { ...prev, accessLevel: level } : prev));
    }
  };

  const handleCopy = (token: string, forDirection?: boolean) => {
    navigator.clipboard.writeText(buildLink(token, forDirection)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDeactivate = (id: string) => {
    deactivateShare(id);
    if (createdShare?.id === id) {
      const remaining = existingShares.filter((s) => s.id !== id);
      setCreatedShare(remaining[0] || null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[28px] border border-black/[0.08] bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-black/[0.06] bg-[#FBFBFA] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary mb-0.5">
              Client Review
            </p>
            <h2 className="text-base font-semibold text-ink tracking-tight">{projectName}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-ink-tertiary hover:text-ink hover:bg-black/[0.04] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Published Banner if just published or direction provided */}
          {(justPublished || directionName) && (
            <div className="rounded-[20px] border border-emerald-200/80 bg-emerald-50/70 p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-800 font-semibold">
                  Direction Published for Client
                </span>
              </div>
              <h3 className="text-sm font-semibold text-emerald-950">
                {directionName || "Creative Direction"}
                {publishedVersion ? ` (v${publishedVersion})` : ""}
              </h3>
              <p className="text-xs text-emerald-800/80 leading-relaxed">
                This version is live and client-safe. Send the link below or open the portal to preview.
              </p>
            </div>
          )}

          {/* Active share card / quick actions */}
          {createdShare && (
            <div className="rounded-[20px] border border-black/[0.08] bg-[#FBFBFA] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <p className="text-xs font-semibold text-ink">
                    {justPublished ? "Ready to Share" : "Active Review Link"}
                  </p>
                </div>
                {directionId && (
                  <div className="flex items-center gap-1 bg-surface rounded-full p-0.5 border border-border-subtle text-[10px] font-medium">
                    <button
                      type="button"
                      onClick={() => setLinkMode("direction")}
                      className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                        linkMode === "direction"
                          ? "bg-ink text-white shadow-xs"
                          : "text-ink-tertiary hover:text-ink"
                      }`}
                    >
                      Direction Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setLinkMode("project")}
                      className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                        linkMode === "project"
                          ? "bg-ink text-white shadow-xs"
                          : "text-ink-tertiary hover:text-ink"
                      }`}
                    >
                      Project Portal
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-black/[0.06] px-3 py-2.5 flex items-center gap-2">
                <span className="flex-1 text-xs text-ink-secondary font-mono truncate select-all">
                  {buildLink(createdShare.token)}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(createdShare.token)}
                  className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full bg-ink text-white hover:bg-[#2E2E2C] transition-colors cursor-pointer shadow-xs"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copied ? "Copied!" : "Copy Link"}</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <a
                  href={buildLink(createdShare.token)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-ink hover:bg-[#2E2E2C] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <ExternalLink size={13} />
                  <span>Open Client Review Page</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleDeactivate(createdShare.id)}
                  className="inline-flex items-center justify-center gap-1 py-2 px-3 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                >
                  <Power size={11} />
                  <span>Deactivate Link</span>
                </button>
              </div>
            </div>
          )}

          {/* Access Level Selector */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary mb-3">
              Client Permissions
            </p>
            <div className="space-y-2">
              {ACCESS_OPTIONS.map((opt) => (
                <button
                  key={opt.level}
                  type="button"
                  onClick={() => handleAccessChange(opt.level)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] border text-left transition-all cursor-pointer ${
                    selectedAccess === opt.level
                      ? "border-ink bg-stone-50"
                      : "border-black/[0.06] hover:border-black/[0.12] hover:bg-stone-50/50"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      selectedAccess === opt.level
                        ? "bg-ink text-white"
                        : "bg-stone-100 text-ink-tertiary"
                    }`}
                  >
                    {opt.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{opt.label}</p>
                    <p className="text-xs text-ink-secondary">{opt.description}</p>
                  </div>
                  <div
                    className={`h-4 w-4 rounded-full border-2 shrink-0 transition-all ${
                      selectedAccess === opt.level
                        ? "border-ink bg-ink"
                        : "border-black/[0.15]"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Create Button if no active share exists */}
          {!createdShare && (
            <button
              type="button"
              onClick={handleCreate}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-ink text-white text-sm font-medium hover:bg-[#2E2E2C] transition-colors cursor-pointer shadow-sm"
            >
              <Link2 size={15} />
              <span>Generate Client Review Link</span>
            </button>
          )}

          {/* Existing active shares */}
          {existingShares.filter((s) => s.id !== createdShare?.id).length > 0 && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary mb-3">
                Active Links
              </p>
              <div className="space-y-2">
                {existingShares
                  .filter((s) => s.id !== createdShare?.id)
                  .map((share) => (
                    <div
                      key={share.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-[14px] border border-black/[0.06] bg-stone-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-ink-secondary truncate">
                          …{share.token.slice(-8)}
                        </p>
                        <p className="text-[11px] text-ink-tertiary">{share.accessLevel} access</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopy(share.token)}
                          title="Copy link"
                          className="p-1.5 rounded-full text-ink-tertiary hover:text-ink hover:bg-white transition-all cursor-pointer"
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeactivate(share.id)}
                          title="Deactivate"
                          className="p-1.5 rounded-full text-ink-tertiary hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="px-6 pb-5">
          <p className="text-[11px] text-ink-tertiary leading-relaxed">
            Clients see only published directions. They cannot access your canvas, library, or internal notes.
          </p>
        </div>
      </div>
    </div>
  );
}
