"use client";

import React, { useState } from "react";
import { X, Heart, Plus, ExternalLink, Sparkles, FolderPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NormalizedInspirationItem } from "@/lib/inspiration/types";

interface InspirationDetailModalProps {
  item: NormalizedInspirationItem | null;
  onClose: () => void;
  isSaved: boolean;
  onSave: (item: NormalizedInspirationItem, note?: string) => void;
  onAddToProject: (item: NormalizedInspirationItem) => void;
  onAddToCanvas: (item: NormalizedInspirationItem) => void;
}

export function InspirationDetailModal({
  item,
  onClose,
  isSaved,
  onSave,
  onAddToProject,
  onAddToCanvas,
}: InspirationDetailModalProps) {
  const [note, setNote] = useState("");

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-surface border border-border-subtle rounded-2xl shadow-lifted overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle bg-surface">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-surface-subtle text-ink-secondary border border-border-subtle">
              {item.category}
            </span>
            <span className="text-xs text-ink-tertiary">·</span>
            <span className="text-xs text-ink-secondary">{item.provider.replace("_", " ")}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-tertiary hover:text-ink hover:bg-surface-subtle transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal body */}
        <div className="overflow-y-auto p-5 space-y-5">
          {/* Main Visual Preview */}
          {item.imageUrl && (
            <div className="rounded-xl overflow-hidden bg-surface-subtle border border-border-subtle max-h-[420px] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain max-h-[420px]"
              />
            </div>
          )}

          {/* Typography Specimen if font */}
          {item.type === "font" && (
            <div className="rounded-xl p-8 bg-surface-subtle border border-border-subtle text-center space-y-3">
              <div
                className="text-4xl text-ink leading-tight"
                style={{ fontFamily: item.metadata?.fontFamily ?? "inherit" }}
              >
                {item.metadata?.previewText ?? "Sphinx of black quartz, judge my vow."}
              </div>
              <div className="font-mono text-xs text-ink-tertiary">
                {item.metadata?.fontName} · {item.creator}
              </div>
            </div>
          )}

          {/* Palette Swatches if palette */}
          {item.type === "palette" && (
            <div className="rounded-xl overflow-hidden border border-border-subtle space-y-2">
              <div className="h-32 flex">
                {(item.metadata?.colors || []).map((c, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end p-2" style={{ background: c.hex }}>
                    <span className="font-mono text-[10px] px-1 py-0.5 rounded bg-black/40 text-white backdrop-blur-sm self-start">
                      {c.hex}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual Color if color */}
          {item.type === "color" && (
            <div
              className="h-36 rounded-xl border border-border-subtle flex items-end p-4"
              style={{ background: item.metadata?.hex ?? "#191918" }}
            >
              <span className="font-mono text-xs px-2 py-1 rounded bg-black/40 text-white backdrop-blur-sm">
                {item.metadata?.hex} · {item.metadata?.colorName}
              </span>
            </div>
          )}

          {/* Title & Creator */}
          <div>
            <h2 className="text-xl font-semibold text-ink tracking-tight">{item.title}</h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-ink-secondary">
              {item.creator && <span>By {item.creator}</span>}
              {item.sourceUrl && (
                <>
                  <span>·</span>
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-ink-tertiary hover:text-ink underline underline-offset-2"
                  >
                    <span>View original source</span>
                    <ExternalLink size={11} />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {Array.from(new Set(item.tags)).map((tag, idx) => (
                <span
                  key={`${tag}-${idx}`}
                  className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface-subtle text-ink-secondary border border-border-subtle"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Designer Note */}
          <div className="pt-2 border-t border-border-subtle space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-ink-tertiary block">
              Add Creative Note (optional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why this inspires the project direction..."
              className="w-full p-2.5 rounded-lg border border-border-subtle bg-surface text-xs text-ink outline-none resize-none focus:border-ink/50"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-border-subtle bg-surface-subtle/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onSave(item, note)}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${isSaved
                ? "border-ink bg-ink text-white"
                : "border-border-subtle bg-surface text-ink hover:bg-surface-subtle"
              }`}
          >
            <Heart size={13} fill={isSaved ? "currentColor" : "none"} />
            <span>{isSaved ? "Saved to Library" : "Save to Library"}</span>
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onAddToProject(item);
              }}
              className="flex items-center gap-1.5"
            >
              <FolderPlus size={13} />
              <span>Add to Project...</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onAddToCanvas(item);
              }}
              className="flex items-center gap-1.5"
            >
              <Plus size={13} />
              <span>Add to Canvas</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
