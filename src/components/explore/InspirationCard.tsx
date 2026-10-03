"use client";

import React, { useState } from "react";
import { Heart, Plus, MoreHorizontal, ExternalLink, Sparkles } from "lucide-react";
import { NormalizedInspirationItem } from "@/lib/inspiration/types";

interface InspirationCardProps {
  item: NormalizedInspirationItem;
  isSaved: boolean;
  onSave: (item: NormalizedInspirationItem) => void;
  onAddToCanvas: (item: NormalizedInspirationItem) => void;
  onOpenDetail: (item: NormalizedInspirationItem) => void;
}

export function InspirationCard({
  item,
  isSaved,
  onSave,
  onAddToCanvas,
  onOpenDetail,
}: InspirationCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Render visual content based on item type
  const renderMedia = () => {
    if (item.type === "font") {
      const family = item.metadata?.fontFamily ?? "inherit";
      const sample = item.metadata?.previewText ?? "Sphinx of black quartz";
      return (
        <div
          onClick={() => onOpenDetail(item)}
          className="w-full bg-surface border border-border-subtle rounded-xl p-5 cursor-pointer hover:border-ink/40 transition-colors flex flex-col justify-between"
          style={{ minHeight: 180 }}
        >
          <div className="flex items-center justify-between text-xs text-ink-tertiary">
            <span className="font-mono text-[10px] uppercase tracking-wider">Typography</span>
            <span>{item.creator}</span>
          </div>
          <div
            className="my-3 text-2xl font-normal text-ink leading-snug tracking-tight"
            style={{ fontFamily: family }}
          >
            {sample}
          </div>
          <div className="text-xs font-semibold text-ink">{item.title}</div>
        </div>
      );
    }

    if (item.type === "palette") {
      const colors = item.metadata?.colors ?? [
        { hex: "#191918", label: "Primary" },
        { hex: "#5A5A55", label: "Secondary" },
        { hex: "#BCBCB6", label: "Accent" },
        { hex: "#FBFBFA", label: "Background" },
      ];
      return (
        <div
          onClick={() => onOpenDetail(item)}
          className="w-full bg-surface border border-border-subtle rounded-xl p-3 cursor-pointer hover:border-ink/40 transition-colors"
        >
          <div className="h-28 rounded-lg overflow-hidden flex border border-black/5 mb-3">
            {colors.map((c, i) => (
              <div key={i} className="flex-1 h-full" style={{ background: c.hex }} />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink">{item.title}</span>
            <span className="text-[10px] font-mono text-ink-tertiary">{colors.length} swatches</span>
          </div>
        </div>
      );
    }

    if (item.type === "color") {
      const hex = item.metadata?.hex ?? "#191918";
      return (
        <div
          onClick={() => onOpenDetail(item)}
          className="w-full bg-surface border border-border-subtle rounded-xl p-3 cursor-pointer hover:border-ink/40 transition-colors"
        >
          <div
            className="h-32 rounded-lg border border-black/10 mb-3 flex items-end p-2.5"
            style={{ background: hex }}
          >
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-white backdrop-blur-sm">
              {hex.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink">{item.title}</span>
            <span className="text-[10px] font-mono text-ink-tertiary">{hex}</span>
          </div>
        </div>
      );
    }

    // Default: Image / Reference
    return (
      <div
        className="relative overflow-hidden rounded-xl bg-surface-subtle border border-border-subtle/80 cursor-pointer group"
        onClick={() => onOpenDetail(item)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
          />
        ) : (
          <div className="w-full h-48 bg-surface-muted flex items-center justify-center text-ink-tertiary">
            <Sparkles size={20} />
          </div>
        )}

        {/* Hover contextual overlay (Notion/Milanote minimal style) */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 p-3 flex flex-col justify-between transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Top row actions */}
          <div className="flex items-center justify-between gap-1.5" onClick={(e) => e.stopPropagation()}>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/90 text-ink shadow-subtle">
              {item.category}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onSave(item)}
                title={isSaved ? "Saved to Library" : "Save to Library"}
                className={`p-1.5 rounded-full backdrop-blur-md transition-all ${
                  isSaved
                    ? "bg-white text-ink shadow-subtle"
                    : "bg-black/40 text-white hover:bg-white hover:text-ink"
                }`}
              >
                <Heart size={13} fill={isSaved ? "currentColor" : "none"} />
              </button>

              <button
                type="button"
                onClick={() => onAddToCanvas(item)}
                title="Add directly to Project Canvas"
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white text-ink shadow-subtle hover:bg-paper active:scale-95 transition-all"
              >
                <Plus size={12} />
                <span>Canvas</span>
              </button>
            </div>
          </div>

          {/* Bottom row metadata */}
          <div className="text-white drop-shadow-sm">
            <h3 className="text-xs font-semibold leading-snug line-clamp-1">{item.title}</h3>
            {item.creator && (
              <p className="text-[11px] text-white/80 line-clamp-1">{item.creator}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <article className="mb-4 break-inside-avoid">
      {renderMedia()}

      {/* Under-card metadata for non-hover states or text/color types */}
      {item.type === "reference" && (
        <div className="pt-2 px-1 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4
              onClick={() => onOpenDetail(item)}
              className="text-xs font-medium text-ink truncate cursor-pointer hover:underline"
            >
              {item.title}
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] text-ink-tertiary">
              {item.creator && <span className="truncate">{item.creator}</span>}
              {item.creator && <span>·</span>}
              <span>{item.category}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(item);
            }}
            className="text-ink-tertiary hover:text-ink p-1 rounded transition-colors"
            title="View Details"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      )}
    </article>
  );
}
