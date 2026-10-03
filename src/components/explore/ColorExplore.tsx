"use client";

import React, { useState } from "react";
import { Heart, Plus, FolderPlus, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NormalizedInspirationItem } from "@/lib/inspiration/types";

interface ColorExploreProps {
  items: NormalizedInspirationItem[];
  savedIds: Set<string>;
  onSave: (item: NormalizedInspirationItem) => void;
  onAddToProject: (item: NormalizedInspirationItem) => void;
  onAddToCanvas: (item: NormalizedInspirationItem) => void;
}

export function ColorExplore({
  items,
  savedIds,
  onSave,
  onAddToProject,
  onAddToCanvas,
}: ColorExploreProps) {
  const [filterType, setFilterType] = useState<"all" | "palettes" | "swatches">("all");
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const palettes = items.filter((i) => i.type === "palette");
  const swatches = items.filter((i) => i.type === "color");

  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1200);
  };

  return (
    <div className="space-y-7">
      {/* Type switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface border border-border-subtle text-xs">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-3 py-1 rounded-md transition-all ${
              filterType === "all" ? "bg-surface-subtle text-ink font-medium shadow-subtle" : "text-ink-secondary"
            }`}
          >
            All Colors
          </button>
          <button
            type="button"
            onClick={() => setFilterType("palettes")}
            className={`px-3 py-1 rounded-md transition-all ${
              filterType === "palettes" ? "bg-surface-subtle text-ink font-medium shadow-subtle" : "text-ink-secondary"
            }`}
          >
            Palettes ({palettes.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("swatches")}
            className={`px-3 py-1 rounded-md transition-all ${
              filterType === "swatches" ? "bg-surface-subtle text-ink font-medium shadow-subtle" : "text-ink-secondary"
            }`}
          >
            Individual Swatches ({swatches.length})
          </button>
        </div>

        <span className="text-xs text-ink-tertiary">
          Click any color strip to copy HEX
        </span>
      </div>

      {/* ── 1. Palettes Section ─────────────────────────────────────────── */}
      {(filterType === "all" || filterType === "palettes") && (
        <section className="space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-ink-tertiary">
            Curated Palette Systems
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {palettes.map((pal) => {
              const isSaved = savedIds.has(pal.id);
              const colors = pal.metadata?.colors || [];

              return (
                <article
                  key={pal.id}
                  className="p-4 rounded-xl border border-border-subtle bg-surface flex flex-col justify-between hover:border-border transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-ink">{pal.title}</h4>
                      <p className="text-[11px] text-ink-tertiary">{pal.creator}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSave(pal)}
                      className={`p-1.5 rounded-md border transition-colors ${
                        isSaved
                          ? "border-ink bg-ink text-white"
                          : "border-border-subtle text-ink-tertiary hover:text-ink hover:bg-surface-subtle"
                      }`}
                      title={isSaved ? "Saved" : "Save Palette"}
                    >
                      <Heart size={13} fill={isSaved ? "currentColor" : "none"} />
                    </button>
                  </div>

                  {/* Visual palette strip */}
                  <div className="h-28 rounded-lg overflow-hidden flex border border-black/5 mb-3 shadow-subtle">
                    {colors.map((c, i) => (
                      <div
                        key={i}
                        onClick={() => copyHex(c.hex)}
                        className="flex-1 h-full flex flex-col justify-end p-2 cursor-pointer hover:opacity-95 transition-opacity relative group"
                        style={{ background: c.hex }}
                        title={`Click to copy ${c.hex} (${c.label})`}
                      >
                        <span className="font-mono text-[9px] px-1 py-0.5 rounded bg-black/40 text-white backdrop-blur-sm self-start opacity-0 group-hover:opacity-100 transition-opacity">
                          {copiedHex === c.hex ? "Copied!" : c.hex}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Swatches breakdown labels */}
                  <div className="grid grid-cols-5 gap-1 text-[10px] font-mono text-ink-secondary text-center mb-4">
                    {colors.map((c, i) => (
                      <div key={i} className="truncate">
                        <div className="text-[9px] text-ink-tertiary truncate">{c.label}</div>
                        <div className="font-semibold text-ink truncate">{c.hex}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                    <span className="text-[10px] font-mono text-ink-tertiary">
                      5-Color System
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAddToProject(pal)}
                        className="flex items-center gap-1.5"
                      >
                        <FolderPlus size={12} />
                        <span>Project...</span>
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onAddToCanvas(pal)}
                        className="flex items-center gap-1.5"
                      >
                        <Plus size={12} />
                        <span>Add to Canvas</span>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 2. Individual Color Swatches ─────────────────────────────────── */}
      {(filterType === "all" || filterType === "swatches") && (
        <section className="space-y-4 pt-2">
          <h3 className="text-xs font-mono uppercase tracking-widest text-ink-tertiary">
            Individual Swatches
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {swatches.map((swatch) => {
              const isSaved = savedIds.has(swatch.id);
              const hex = swatch.metadata?.hex || "#191918";

              return (
                <article
                  key={swatch.id}
                  className="p-3 rounded-xl border border-border-subtle bg-surface flex flex-col justify-between hover:border-border transition-all group"
                >
                  <div
                    onClick={() => copyHex(hex)}
                    className="h-24 rounded-lg border border-black/10 mb-2.5 p-2 flex flex-col justify-between cursor-pointer"
                    style={{ background: hex }}
                  >
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSave(swatch);
                        }}
                        className={`p-1 rounded-md backdrop-blur-md transition-colors ${
                          isSaved ? "bg-white text-ink shadow-subtle" : "bg-black/30 text-white hover:bg-white hover:text-ink"
                        }`}
                        title={isSaved ? "Saved" : "Save swatch"}
                      >
                        <Heart size={11} fill={isSaved ? "currentColor" : "none"} />
                      </button>
                    </div>

                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-white backdrop-blur-sm self-start">
                      {copiedHex === hex ? "Copied!" : hex.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h5 className="text-xs font-semibold text-ink truncate">{swatch.title}</h5>
                    <p className="text-[10px] text-ink-tertiary font-mono">{hex}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAddToCanvas(swatch)}
                    className="mt-2.5 w-full py-1 rounded-md border border-border-subtle bg-surface hover:bg-surface-subtle text-[11px] font-medium text-ink flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus size={11} />
                    <span>Canvas</span>
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
