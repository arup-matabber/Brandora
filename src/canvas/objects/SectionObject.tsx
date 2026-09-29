"use client";
import React, { useState } from "react";
import { Send, Layers, ChevronDown, ExternalLink, Check } from "lucide-react";

export const SECTION_TYPES = [
  "direction",
  "moodboard",
  "typography",
  "colors",
  "references",
  "logo",
  "presentation",
  "section",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

interface SectionObjectProps {
  content: {
    label?: string;
    name?: string;
    title?: string;
    description?: string;
    sectionType?: string;
    published?: boolean;
    publishedVersion?: number;
    lastPublishedAt?: string;
    reviewStatus?: string;
    approvedBy?: string;
    approvedAt?: string;
    bg?: string;
    borderStyle?: "dashed" | "solid" | "none";
    borderColor?: string;
    borderWidth?: number;
    radius?: number;
  };
  memberCount?: number;
  onUpdate: (patch: Record<string, any>) => void;
  onPublish?: () => void;
  onViewClientPortal?: () => void;
}

export function SectionObject({
  content,
  memberCount = 0,
  onUpdate,
  onPublish,
  onViewClientPortal,
}: SectionObjectProps) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublishClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPublishing(true);
    onPublish?.();
    setTimeout(() => setIsPublishing(false), 2000);
  };

  const title = content.label ?? content.name ?? content.title ?? "Direction 01";
  const [label, setLabel] = useState(title);
  const [description, setDescription] = useState(content.description ?? "Minimal and tactile");
  const sectionType = (content.sectionType ?? "direction").toLowerCase();

  // Sync state when content prop updates externally
  React.useEffect(() => {
    const currentTitle = content.label ?? content.name ?? content.title ?? "Direction 01";
    if (currentTitle !== label) {
      setLabel(currentTitle);
    }
    if (content.description !== undefined && content.description !== description) {
      setDescription(content.description);
    }
  }, [content.label, content.name, content.title, content.description]);

  const commitLabel = () => {
    setEditingLabel(false);
    onUpdate({ label, name: label, title: label });
  };

  const commitDesc = () => {
    setEditingDesc(false);
    onUpdate({ description });
  };

  const setType = (type: string) => {
    setShowTypeMenu(false);
    onUpdate({ sectionType: type });
  };

  const bg = content.bg ?? "rgba(251,251,250,0.96)";
  const borderStyle = content.borderStyle ?? "solid";
  const borderColor = content.borderColor ?? "rgba(25,25,24,0.18)";
  const borderWidth = content.borderWidth ?? 1.5;
  const radius = content.radius ?? 14;

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden pointer-events-auto"
      style={{
        background: bg,
        border: borderStyle === "none" ? "none" : `${borderWidth}px ${borderStyle} ${borderColor}`,
        borderRadius: radius,
        boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 8px 24px -12px rgba(0,0,0,0.06)",
        position: "relative",
      }}
    >
      {/* Refined Opalite Header Band */}
      <div
        className="px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 select-none"
        style={{
          borderBottom: "1px solid rgba(25,25,24,0.08)",
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Section Type Badge with interactive dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTypeMenu((v) => !v);
              }}
              data-no-drag="true"
              className="flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded transition-all cursor-pointer shadow-xs"
              style={{
                background: "#191918",
                color: "#FFFFFF",
              }}
              title="Change Section Type"
            >
              <span>{sectionType}</span>
              <ChevronDown size={9} className="opacity-70" />
            </button>

            {showTypeMenu && (
              <div
                className="absolute top-full left-0 mt-1 py-1 bg-surface border border-border-subtle rounded-lg shadow-lifted z-50 min-w-[130px]"
                onClick={(e) => e.stopPropagation()}
                data-no-drag="true"
              >
                {SECTION_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`w-full text-left px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider hover:bg-surface-subtle transition-colors flex items-center justify-between ${
                      sectionType === t ? "text-ink font-bold bg-surface-subtle/60" : "text-ink-secondary"
                    }`}
                  >
                    <span>{t}</span>
                    {sectionType === t && <span className="w-1.5 h-1.5 rounded-full bg-ink" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Section Name / Title */}
          <div
            className="min-w-0 cursor-text"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingLabel(true);
            }}
          >
            {editingLabel ? (
              <input
                autoFocus
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onBlur={commitLabel}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Escape") commitLabel();
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
                data-no-drag="true"
                className="text-sm font-semibold text-ink bg-transparent border-b border-ink/40 outline-none px-0.5"
                style={{ width: 180 }}
              />
            ) : (
              <span
                className="text-sm font-semibold text-ink tracking-tight truncate block"
                title="Double click to rename"
              >
                {label}
              </span>
            )}
          </div>
        </div>

        {/* Right Header Controls: Status & Publish */}
        <div className="flex items-center gap-2 shrink-0">
          {content.published && content.publishedVersion ? (
            <div className="flex items-center gap-1.5">
              {content.reviewStatus === "APPROVED" ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold flex items-center gap-1">
                  ✓ Approved
                </span>
              ) : content.reviewStatus === "CHANGES_REQUESTED" ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-semibold flex items-center gap-1">
                  Revisions Requested
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium">
                  v{content.publishedVersion} Published
                </span>
              )}
              {onViewClientPortal && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewClientPortal();
                  }}
                  data-no-drag="true"
                  className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-black/[0.08] hover:border-black/20 bg-white text-ink hover:bg-stone-50 transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="Open in Client Portal"
                >
                  <ExternalLink size={9} />
                  <span>Portal</span>
                </button>
              )}
              {onPublish && (
                <button
                  type="button"
                  onClick={handlePublishClick}
                  data-no-drag="true"
                  className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-ink hover:bg-[#1E1B4B] text-white transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  {isPublishing ? <Check size={10} className="text-emerald-400" /> : <Send size={10} />}
                  <span>{isPublishing ? "Published!" : `Publish v${(content.publishedVersion || 1) + 1}`}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-ink-tertiary border border-black/[0.06]">
                Draft
              </span>
              {onPublish && (
                <button
                  type="button"
                  onClick={handlePublishClick}
                  data-no-drag="true"
                  className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-ink hover:bg-[#1E1B4B] text-white transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  {isPublishing ? <Check size={10} className="text-emerald-400" /> : <Send size={10} />}
                  <span>{isPublishing ? "Published!" : "Publish for Client"}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sub-bar: Child count badge if contains objects */}
      {memberCount > 0 && (
        <div
          className="px-4 py-1 flex items-center gap-1.5 select-none"
          style={{
            borderBottom: "1px solid rgba(25,25,24,0.05)",
            background: "rgba(249,249,247,0.7)",
          }}
        >
          <Layers size={10} style={{ color: "#9E9E98" }} />
          <span
            style={{
              fontSize: 10,
              color: "#9E9E98",
              fontFamily: "monospace",
            }}
          >
            {memberCount} creative element{memberCount !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Description line */}
      <div
        className="px-4 py-2 select-none"
        onDoubleClick={(e) => {
          e.stopPropagation();
          setEditingDesc(true);
        }}
      >
        {editingDesc ? (
          <input
            autoFocus
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={commitDesc}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") commitDesc();
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            data-no-drag="true"
            placeholder="Add description..."
            className="w-full text-xs text-ink-secondary bg-transparent border-b border-ink/20 outline-none pb-0.5"
          />
        ) : (
          <p
            className="text-xs text-ink-secondary leading-relaxed cursor-text"
            title="Double click to edit description"
          >
            {description || (
              <span className="text-ink-tertiary italic">Double-click to describe this container...</span>
            )}
          </p>
        )}
      </div>

      {/* Bounded creative area - children render here */}
      <div className="flex-1 w-full h-full" />
    </div>
  );
}
