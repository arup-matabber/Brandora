"use client";

import React, { useState } from "react";
import { X, Calendar, Layers, Sparkles, CheckCircle2, History, Share2 } from "lucide-react";
import type { DirectionVersion, BrandProject } from "@/lib/data";
import { DesignerCommentViewer } from "./DesignerCommentViewer";

interface ClientReviewViewerProps {
  version: DirectionVersion;
  allVersions?: DirectionVersion[];
  project?: BrandProject;
  onClose: () => void;
  onSelectVersion?: (version: DirectionVersion) => void;
}

export function ClientReviewViewer({
  version: initialVersion,
  allVersions = [],
  project,
  onClose,
  onSelectVersion,
}: ClientReviewViewerProps) {
  const [selectedVersion, setSelectedVersion] = useState<DirectionVersion>(initialVersion);

  const active = selectedVersion;
  const snapshot = active.snapshot;
  const members = snapshot.members || [];

  const handleSwitch = (v: DirectionVersion) => {
    setSelectedVersion(v);
    onSelectVersion?.(v);
  };

  const formattedDate = active.createdAt
    ? new Date(active.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recently";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-[28px] border border-black/[0.08] bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between gap-4 bg-[#FBFBFA]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/60">
              <Sparkles size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-ink tracking-tight truncate">
                  {snapshot.name}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60">
                  v{active.version} · Published
                </span>
              </div>
              <p className="text-xs text-ink-secondary mt-0.5 truncate">
                {project ? project.name : "Brand Project"} · Client Review Presentation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Version Switcher if multiple versions exist */}
            {allVersions.length > 1 && (
              <div className="flex items-center gap-1 p-0.5 rounded-full bg-stone-100 border border-black/[0.06] text-xs">
                <History size={12} className="ml-2 text-ink-tertiary" />
                {allVersions.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSwitch(v)}
                    className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] transition-all ${
                      active.id === v.id
                        ? "bg-white text-ink font-semibold shadow-xs"
                        : "text-ink-secondary hover:text-ink"
                    }`}
                  >
                    v{v.version}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              title="Close review"
              className="h-8 w-8 rounded-full flex items-center justify-center text-ink-tertiary hover:text-ink hover:bg-black/[0.04] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata bar */}
          <div className="flex items-center gap-4 text-xs text-ink-tertiary border-b border-black/[0.04] pb-4">
            <span className="flex items-center gap-1.5 font-mono">
              <Calendar size={13} />
              Published {formattedDate}
            </span>
            <span className="text-black/20">·</span>
            <span className="flex items-center gap-1.5 font-mono">
              <Layers size={13} />
              {members.length} creative element{members.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Direction Narrative / Description */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary block mb-2">
              Creative Narrative
            </span>
            <div className="p-4 rounded-[20px] bg-[#FBFBFA] border border-black/[0.04] text-sm text-ink leading-relaxed">
              {snapshot.description || "No narrative description provided for this published direction."}
            </div>
          </div>

          {/* Members / Elements Showcase */}
          {members.length > 0 && (
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary block mb-3">
                Published Elements
              </span>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {members.map((member, idx) => {
                  if (member.type === "color") {
                    const hex = member.content?.hex || "#191918";
                    return (
                      <div
                        key={member.id || idx}
                        className="rounded-[20px] border border-black/[0.06] overflow-hidden bg-white shadow-xs p-3"
                      >
                        <div
                          className="w-full h-20 rounded-[14px] shadow-inner mb-2.5"
                          style={{ backgroundColor: hex }}
                        />
                        <p className="text-xs font-semibold text-ink truncate">
                          {member.content?.name || "Color Swatch"}
                        </p>
                        <p className="text-[11px] font-mono text-ink-tertiary uppercase mt-0.5">
                          {hex}
                        </p>
                      </div>
                    );
                  }

                  if (member.type === "palette") {
                    const colors: { hex: string; label?: string }[] = member.content?.colors || [];
                    return (
                      <div
                        key={member.id || idx}
                        className="rounded-[20px] border border-black/[0.06] bg-white shadow-xs p-3.5 sm:col-span-2"
                      >
                        <p className="text-xs font-semibold text-ink mb-2">
                          {member.content?.name || "Color Palette"}
                        </p>
                        <div className="flex h-14 rounded-[14px] overflow-hidden border border-black/[0.04]">
                          {colors.map((c, i) => (
                            <div
                              key={i}
                              className="flex-1 h-full relative group"
                              style={{ backgroundColor: c.hex }}
                              title={`${c.label || ""}: ${c.hex}`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (member.type === "font") {
                    const fontName = member.content?.fontName || "Satoshi";
                    const previewText = member.content?.previewText || "Aa";
                    return (
                      <div
                        key={member.id || idx}
                        className="rounded-[20px] border border-black/[0.06] bg-white shadow-xs p-4"
                      >
                        <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary block mb-1">
                          Typography Specimen
                        </span>
                        <p className="text-3xl font-serif text-ink my-2">{previewText}</p>
                        <p className="text-xs font-semibold text-ink">{fontName}</p>
                      </div>
                    );
                  }

                  if (member.type === "reference" || member.type === "image") {
                    const src = member.content?.url || member.content?.imageUrl || member.content?.src;
                    return (
                      <div
                        key={member.id || idx}
                        className="rounded-[20px] border border-black/[0.06] overflow-hidden bg-white shadow-xs p-3"
                      >
                        {src ? (
                          <img
                            src={src}
                            alt={member.content?.title || "Visual reference"}
                            referrerPolicy="no-referrer"
                            className="w-full h-24 object-cover rounded-[14px] mb-2"
                          />
                        ) : (
                          <div className="w-full h-24 bg-stone-100 rounded-[14px] mb-2 flex items-center justify-center text-ink-tertiary text-xs">
                            Visual Reference
                          </div>
                        )}
                        <p className="text-xs font-semibold text-ink truncate">
                          {member.content?.title || "Visual Reference"}
                        </p>
                        {member.content?.source && (
                          <p className="text-[10px] text-ink-tertiary truncate mt-0.5">
                            {member.content.source}
                          </p>
                        )}
                      </div>
                    );
                  }

                  if (member.type === "note" || member.type === "text") {
                    return (
                      <div
                        key={member.id || idx}
                        className="rounded-[20px] border border-black/[0.06] bg-[#FBFBFA] shadow-xs p-4"
                      >
                        <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary block mb-1">
                          Creative Note
                        </span>
                        <p className="text-xs text-ink leading-relaxed">
                          {member.content?.text || "—"}
                        </p>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          )}

          {/* Designer comments & approval */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary block mb-3">
              Client Feedback
            </span>
            <DesignerCommentViewer version={active} project={project} projectId={project?.id} />
          </div>

          {/* Client safety footer note */}
          <div className="pt-3 border-t border-black/[0.04] flex items-center justify-between text-[11px] text-ink-tertiary">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-600" />
              Verified client presentation snapshot
            </span>
            <span className="font-mono">Opalite Review v{active.version}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
