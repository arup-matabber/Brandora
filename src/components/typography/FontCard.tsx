"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, Bookmark, Check, Plus, Eye } from "lucide-react";
import { FontItem } from "@/lib/typography/types";
import { loadGoogleFontPreview } from "@/lib/typography/font-service";

interface FontCardProps {
  font: FontItem;
  previewText?: string;
  isSaved?: boolean;
  onSave?: (font: FontItem) => void;
  onAddToCanvas?: (font: FontItem) => void;
  onPreview?: (font: FontItem) => void;
}

function formatCategory(cat: string): string {
  switch (cat.toLowerCase()) {
    case "sans-serif":
      return "Sans Serif";
    case "serif":
      return "Serif";
    case "display":
      return "Display";
    case "handwriting":
      return "Handwriting";
    case "monospace":
      return "Monospace";
    default:
      return cat.charAt(0).toUpperCase() + cat.slice(1);
  }
}

export function FontCard({
  font,
  previewText = "ORBLINN",
  isSaved = false,
  onSave,
  onAddToCanvas,
  onPreview,
}: FontCardProps) {
  const [fontLoaded, setFontLoaded] = useState(false);

  // Dynamically load Google Font for live specimen preview
  useEffect(() => {
    loadGoogleFontPreview(font.family, ["400", "700"]);
    // Mark as loaded after short microtask to allow browser to register font face
    const timer = setTimeout(() => setFontLoaded(true), 60);
    return () => clearTimeout(timer);
  }, [font.family]);

  const styleCount = font.variants?.length || 1;
  const categoryLabel = formatCategory(font.category);

  return (
    <article className="group rounded-[24px] border border-black/[0.06] bg-white p-6 hover:border-black/[0.14] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-all duration-200 ease-out flex flex-col justify-between relative overflow-hidden">
      {/* ── Visual Specimen Area ───────────────────────────────────── */}
      <div
        className="cursor-pointer"
        onClick={() => onPreview?.(font)}
        title="Click to preview typeface details"
      >
        {/* Large Specimen */}
        <div
          className="text-2xl sm:text-3xl text-ink tracking-tight truncate select-all transition-opacity duration-200"
          style={{
            fontFamily: font.family,
            opacity: fontLoaded ? 1 : 0.85,
          }}
        >
          {previewText.trim() || "ORBLINN"}
        </div>

        {/* Secondary Specimen */}
        <div
          className="text-xs sm:text-sm text-ink-secondary mt-2.5 line-clamp-2 leading-relaxed"
          style={{ fontFamily: font.family }}
        >
          The quick brown fox jumps over the lazy dog.
        </div>
      </div>

      {/* ── Metadata & Subtle Actions ─────────────────────────────────── */}
      <div className="mt-8 pt-4 border-t border-black/[0.05] flex items-end justify-between gap-3">
        {/* Typeface Metadata (Satoshi UI font) */}
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-ink tracking-tight truncate font-sans">
            {font.family}
          </h3>
          <p className="text-[11px] font-mono text-ink-tertiary mt-0.5 truncate">
            {categoryLabel} · {styleCount} {styleCount === 1 ? "style" : "styles"}
          </p>
        </div>

        {/* Actions Suite */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Detail Preview Button */}
          {onPreview && (
            <button
              type="button"
              onClick={() => onPreview(font)}
              title="Full Specimen Preview"
              className="w-8 h-8 rounded-full border border-black/[0.06] bg-stone-50 text-ink-secondary hover:text-ink hover:bg-stone-100 hover:border-black/[0.12] transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
            >
              <Eye size={13} />
            </button>
          )}

          {/* Save to Library Button */}
          {onSave && (
            <button
              type="button"
              onClick={() => onSave(font)}
              title={isSaved ? "Saved to Library" : "Save to Library"}
              className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 ${
                isSaved
                  ? "bg-ink text-white border-ink shadow-xs"
                  : "bg-stone-50 text-ink-secondary border-black/[0.06] hover:text-ink hover:bg-stone-100 hover:border-black/[0.12]"
              }`}
            >
              <Bookmark size={13} fill={isSaved ? "currentColor" : "none"} />
            </button>
          )}

          {/* Add to Canvas Action */}
          {onAddToCanvas && (
            <button
              type="button"
              onClick={() => onAddToCanvas(font)}
              title="Add to Canvas"
              aria-label={`Add ${font.family} to Canvas`}
              className="h-8 px-2.5 sm:px-3 rounded-full bg-stone-100 hover:bg-ink hover:text-white text-ink text-xs font-medium transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 shrink-0"
            >
              <Plus size={13} />
              <span className="text-[11px]">Add to Canvas</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
