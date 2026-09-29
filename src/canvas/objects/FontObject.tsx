"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Globe } from "lucide-react";
import { loadGoogleFontPreview, injectFontFaceFromFile } from "@/lib/typography/font-service";
import { GoogleFontPicker } from "@/components/typography/GoogleFontPicker";

export const CURATED_FONTS = [
  { name: "Satoshi", family: "Satoshi, system-ui, sans-serif", category: "sans-serif" },
  { name: "Inter", family: "'Inter', sans-serif", category: "sans-serif" },
  { name: "Playfair Display", family: "'Playfair Display', serif", category: "serif" },
  { name: "Libre Baskerville", family: "'Libre Baskerville', serif", category: "serif" },
  { name: "Space Grotesk", family: "'Space Grotesk', sans-serif", category: "sans-serif" },
  { name: "DM Serif Display", family: "'DM Serif Display', serif", category: "serif" },
  { name: "Fraunces", family: "'Fraunces', serif", category: "serif" },
  { name: "Cinzel", family: "'Cinzel', serif", category: "serif" },
  { name: "JetBrains Mono", family: "'JetBrains Mono', monospace", category: "monospace" },
];

function getEffectiveFontFamily(family: string, cat?: string) {
  let fallback = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const c = (cat || "").toLowerCase();
  if (c.includes("serif")) {
    fallback = "Georgia, 'Times New Roman', serif";
  } else if (c.includes("mono")) {
    fallback = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  } else if (c.includes("display")) {
    fallback = "Impact, -apple-system, sans-serif";
  } else if (c.includes("handwriting")) {
    fallback = "'Caveat', cursive, sans-serif";
  }

  if (!family || family === "Satoshi" || family.toLowerCase() === "system-ui") {
    return "Satoshi, -apple-system, sans-serif";
  }

  const cleaned = family.replace(/^['"]|['"]$/g, "");
  return `'${cleaned}', ${fallback}`;
}

function parseNumericWeight(v?: string | number): number {
  if (!v) return 500;
  if (typeof v === "number") return v;
  if (v === "regular" || v === "italic") return 400;
  const match = String(v).match(/\d+/);
  return match ? parseInt(match[0], 10) : 500;
}

interface FontObjectProps {
  content: {
    fontName?: string;
    fontFamily?: string;
    previewText?: string;
    provider?: string;
    category?: string;
    variant?: string;
    variants?: string[];
    files?: Record<string, string>;
    fontSize?: number;
    fontWeight?: string | number;
    metadata?: Record<string, any>;
    [key: string]: any;
  };
  onUpdate: (patch: Record<string, any>) => void;
}

export function FontObject({ content, onUpdate }: FontObjectProps) {
  const fontName = content.fontName ?? content.fontFamily ?? "Satoshi";
  const fontFamily = content.fontFamily ?? content.fontName ?? "Satoshi";
  const provider = content.provider ?? "google";
  const category = content.category ?? "sans-serif";
  const variant = content.variant ?? "regular";
  const variants = content.variants ?? ["400", "700"];
  const previewText = content.previewText ?? "ORBLINN";

  const [editingPreview, setEditingPreview] = useState(false);
  const [localText, setLocalText] = useState(previewText);

  // Dynamically load Google Font styles whenever family or variants change
  useEffect(() => {
    if (fontFamily && fontFamily.toLowerCase() !== "satoshi") {
      loadGoogleFontPreview(fontFamily, variants);

      // Also inject binary font file if available
      if (content.files) {
        const activeFile = content.files[variant] || content.files["regular"] || Object.values(content.files)[0];
        if (activeFile) {
          injectFontFaceFromFile(fontFamily, activeFile, String(parseNumericWeight(variant)));
        }
      }
    }
  }, [fontFamily, variants, variant, content.files]);

  // Sync previewText prop
  useEffect(() => {
    setLocalText(previewText);
  }, [previewText]);

  const cssFontFamily = useMemo(
    () => getEffectiveFontFamily(fontFamily, category),
    [fontFamily, category]
  );

  const numericWeight = useMemo(
    () => parseNumericWeight(content.fontWeight ?? variant),
    [content.fontWeight, variant]
  );

  const handleTextCommit = () => {
    setEditingPreview(false);
    if (localText !== previewText) {
      onUpdate({ previewText: localText });
    }
  };

  return (
    <div
      className="w-full h-full rounded-xl flex flex-col overflow-hidden select-none bg-white transition-shadow duration-200"
      style={{
        border: "1px solid #EAEAE6",
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.02)",
      }}
    >
      {/* ── Top Specimen Area ────────────────────────────────────────── */}
      <div
        className="flex-1 min-h-0 flex items-center justify-center p-4 relative cursor-text group/specimen overflow-hidden"
        style={{
          fontFamily: cssFontFamily,
          fontWeight: numericWeight,
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setEditingPreview(true);
        }}
      >
        {editingPreview ? (
          <input
            autoFocus
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            onBlur={handleTextCommit}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") {
                handleTextCommit();
              }
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            data-no-drag="true"
            className="w-full bg-transparent border-b border-ink/40 outline-none text-center text-ink tracking-tight"
            style={{
              fontFamily: cssFontFamily,
              fontWeight: numericWeight,
              fontSize: "clamp(24px, 14cqw, 42px)",
              lineHeight: 1.1,
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center max-w-full px-2">
            <span
              className="text-ink tracking-tight transition-transform duration-150 leading-[1.15] break-words line-clamp-2"
              style={{
                fontSize: "clamp(24px, 12cqw, 42px)",
                fontFamily: cssFontFamily,
                fontWeight: numericWeight,
              }}
              title="Double-click to edit preview text"
            >
              {localText}
            </span>
            <span className="text-[10px] text-ink-tertiary/60 opacity-0 group-hover/specimen:opacity-100 transition-opacity mt-1 font-mono">
              Double-click to edit
            </span>
          </div>
        )}
      </div>

      {/* ── Middle Alphabet & Numeral Strip ─────────────────────────── */}
      <div
        className="px-3.5 py-2 border-t border-black/[0.05] bg-[#FCFCFA]/80 overflow-hidden"
        style={{ fontFamily: cssFontFamily }}
      >
        <p className="text-[11px] text-ink-secondary/80 tracking-wider whitespace-nowrap overflow-hidden text-ellipsis select-none">
          Aa Bb Cc Dd Ee Ff Gg 0123456789 &amp;@!
        </p>
      </div>

      {/* ── Card Footer with Font Metadata & Controls ───────────────── */}
      <div className="px-3 py-2 border-t border-black/[0.06] bg-white flex items-center justify-between gap-2 relative">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="text-xs font-semibold text-ink tracking-tight truncate max-w-[140px]"
            title={fontName}
          >
            {fontName}
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-ink-secondary uppercase tracking-wider shrink-0">
            {category.replace("-", " ")}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className="flex items-center gap-1 text-[10px] text-ink-tertiary bg-stone-50 px-1.5 py-0.5 rounded border border-black/[0.04]"
            title={`Provider: ${provider === "google" ? "Google Fonts" : provider}`}
          >
            <Globe size={10} className="text-ink-tertiary" />
            <span className="capitalize">{provider === "google" ? "Google" : provider}</span>
          </div>

          <GoogleFontPicker
            value={fontName}
            category={category}
            triggerLabel="Change"
            direction="up"
            alignDropdown="right"
            onSelect={(font) => {
              onUpdate({
                fontName: font.family,
                fontFamily: font.family,
                category: font.category,
                provider: "google",
                variants: font.variants,
                variant: font.variants.includes("regular") ? "regular" : font.variants[0] || "400",
                files: font.files,
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}
