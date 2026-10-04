"use client";

import React, { useState, useEffect } from "react";
import { X, Bookmark, Plus, Sliders } from "lucide-react";
import { FontItem } from "@/lib/typography/types";
import { loadGoogleFontPreview } from "@/lib/typography/font-service";

interface FontSpecimenModalProps {
  font: FontItem | null;
  onClose: () => void;
  isSaved?: boolean;
  onSave?: (font: FontItem) => void;
  onAddToCanvas?: (font: FontItem) => void;
  initialText?: string;
}

export function FontSpecimenModal({
  font,
  onClose,
  isSaved = false,
  onSave,
  onAddToCanvas,
  initialText = "ORBLINN",
}: FontSpecimenModalProps) {
  const [previewText, setPreviewText] = useState(initialText);
  const [fontSize, setFontSize] = useState<number>(36);

  useEffect(() => {
    if (font) {
      loadGoogleFontPreview(font.family, font.variants);
    }
  }, [font]);

  if (!font) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl rounded-[28px] bg-white border border-black/[0.08] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between gap-4 bg-[#FAF9F7]">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary block">
              Typeface Specimen
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-lg font-semibold text-ink tracking-tight font-sans">
                {font.family}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white border border-black/[0.06] font-mono text-ink-secondary">
                {font.category}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-black/[0.06] bg-white text-ink-tertiary hover:text-ink hover:bg-stone-100 flex items-center justify-center transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body: Interactive Specimen Controls */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Custom Specimen Input & Size Slider */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center p-3 rounded-2xl bg-[#F7F7F5] border border-black/[0.04]">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-mono uppercase text-ink-tertiary block px-1">
                Custom Specimen Text
              </label>
              <input
                type="text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Type brand name or text..."
                className="w-full h-8 px-3 rounded-full bg-white border border-black/[0.06] text-xs text-ink outline-none focus:border-ink/50"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between px-1 text-[10px] font-mono text-ink-tertiary">
                <span>SIZE</span>
                <span>{fontSize}px</span>
              </div>
              <input
                type="range"
                min={18}
                max={72}
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                className="w-full accent-ink cursor-pointer"
              />
            </div>
          </div>

          {/* Large Live Specimen Display */}
          <div className="p-8 rounded-2xl border border-black/[0.06] bg-white flex items-center justify-center min-h-[140px] text-center overflow-hidden">
            <div
              className="text-ink leading-tight break-words select-all transition-all"
              style={{
                fontFamily: font.family,
                fontSize: `${fontSize}px`,
              }}
            >
              {previewText.trim() || font.family}
            </div>
          </div>

          {/* Alphabet & Glyphs Set */}
          <div className="space-y-2 p-5 rounded-2xl bg-[#FBFBFA] border border-black/[0.04]">
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary block">
              Character Set
            </span>
            <div
              className="text-sm text-ink-secondary leading-relaxed tracking-wider select-all"
              style={{ fontFamily: font.family }}
            >
              ABCDEFGHIJKLMNOPQRSTUVWXYZ
              <br />
              abcdefghijklmnopqrstuvwxyz
              <br />
              0123456789 !@#$%^&*()_+-=[]{}|;:,.?
            </div>
          </div>

          {/* Style Variants Information */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary block">
              Available Styles ({font.variants.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {font.variants.map((variant) => (
                <span
                  key={variant}
                  className="px-2.5 py-1 rounded-full bg-stone-100 text-ink-secondary text-xs font-mono border border-black/[0.03]"
                >
                  {variant}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-black/[0.06] flex items-center justify-between gap-3 bg-[#FAF9F7]">
          <span className="text-[11px] font-mono text-ink-tertiary">
            Google Fonts · Normalized FontItem
          </span>

          <div className="flex items-center gap-2">
            {onSave && (
              <button
                type="button"
                onClick={() => onSave(font)}
                className={`h-8 px-3.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isSaved
                    ? "bg-stone-200 text-ink"
                    : "border border-black/[0.1] bg-white text-ink hover:bg-stone-50"
                }`}
              >
                <Bookmark size={12} fill={isSaved ? "currentColor" : "none"} />
                <span>{isSaved ? "Saved" : "Save to Library"}</span>
              </button>
            )}

            {onAddToCanvas && (
              <button
                type="button"
                onClick={() => {
                  onAddToCanvas(font);
                  onClose();
                }}
                className="h-8 px-4 rounded-full bg-ink hover:bg-black text-white text-xs font-medium transition-all shadow-xs flex items-center gap-1.5"
              >
                <Plus size={13} />
                <span>Add to Canvas</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
