"use client";

import React, { useState } from "react";
import { Search, Trash2, Plus, FolderPlus, FolderOpen, Layers, Type, Droplets, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LibraryItem } from "@/lib/data";

interface SavedExploreProps {
  items: LibraryItem[];
  onRemove: (id: string) => void;
  onAddToProject: (item: LibraryItem) => void;
  onAddToCanvas: (item: LibraryItem) => void;
}

const CATEGORIES = ["All", "References", "Fonts", "Colors", "Palettes"] as const;
type Category = (typeof CATEGORIES)[number];

export function SavedExplore({
  items,
  onRemove,
  onAddToProject,
  onAddToCanvas,
}: SavedExploreProps) {
  const [selectedCat, setSelectedCat] = useState<Category>("All");
  const [query, setQuery] = useState("");

  const filteredItems = items.filter((item) => {
    // Category match
    if (selectedCat === "References" && item.type !== "reference") return false;
    if (selectedCat === "Fonts" && item.type !== "font") return false;
    if (selectedCat === "Colors" && item.type !== "color") return false;
    if (selectedCat === "Palettes" && item.type !== "palette") return false;

    // Search query
    if (query.trim()) {
      const q = query.toLowerCase();
      const match =
        item.name.toLowerCase().includes(q) ||
        (item.source && item.source.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between p-3 rounded-xl border border-border-subtle bg-surface">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                selectedCat === cat
                  ? "bg-surface-subtle text-ink shadow-subtle border border-border-subtle"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search saved creative memory..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border-subtle bg-surface-subtle text-xs text-ink outline-none focus:border-ink"
          />
        </div>
      </div>

      {/* Grid of Saved Items */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="p-4 rounded-xl border border-border-subtle bg-surface flex flex-col justify-between hover:border-border transition-all group"
            >
              <div>
                {/* Header tag and remove */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary">
                    {item.type}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="p-1 rounded text-ink-tertiary hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove from saved memory"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Media Preview */}
                {item.type === "reference" && (
                  <div className="h-44 rounded-lg overflow-hidden bg-surface-subtle border border-border-subtle mb-3">
                    {item.imageUrl || item.content?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl || item.content?.url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-tertiary">
                        <BookOpen size={20} />
                      </div>
                    )}
                  </div>
                )}

                {item.type === "font" && (
                  <div className="h-36 rounded-lg bg-surface-subtle border border-border-subtle p-4 mb-3 flex flex-col justify-center text-center">
                    <div
                      className="text-2xl text-ink leading-snug"
                      style={{ fontFamily: item.content?.fontFamily || "inherit" }}
                    >
                      {item.content?.previewText || item.name}
                    </div>
                  </div>
                )}

                {item.type === "palette" && (
                  <div className="h-28 rounded-lg overflow-hidden flex border border-border-subtle mb-3">
                    {(item.content?.colors || []).map((c: any, i: number) => (
                      <div key={i} className="flex-1 h-full" style={{ background: c.hex }} />
                    ))}
                  </div>
                )}

                {item.type === "color" && (
                  <div
                    className="h-28 rounded-lg border border-black/10 mb-3 flex items-end p-2.5"
                    style={{ background: item.content?.hex || "#191918" }}
                  >
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-white">
                      {item.content?.hex}
                    </span>
                  </div>
                )}

                <h4 className="text-sm font-semibold text-ink truncate">{item.name}</h4>
                {item.source && (
                  <p className="text-[11px] text-ink-tertiary mt-0.5">{item.source}</p>
                )}
                {item.notes && (
                  <p className="text-xs text-ink-secondary mt-1.5 italic line-clamp-2">
                    "{item.notes}"
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-border-subtle mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddToProject(item)}
                  className="flex-1 flex items-center justify-center gap-1.5"
                >
                  <FolderPlus size={12} />
                  <span>Project...</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onAddToCanvas(item)}
                  className="flex-1 flex items-center justify-center gap-1.5"
                >
                  <Plus size={12} />
                  <span>Canvas</span>
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border-subtle bg-surface/50 p-16 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-surface-muted flex items-center justify-center text-ink-tertiary mb-3">
            <FolderOpen size={20} />
          </div>
          <h3 className="text-sm font-semibold text-ink">
            {items.length === 0 ? "Your creative memory is empty" : "No matching saved items"}
          </h3>
          <p className="mt-1 text-xs text-ink-secondary max-w-sm mx-auto leading-relaxed">
            {items.length === 0
              ? "Discover and save references, fonts, and colors from the Discover tab to build your inspiration archive."
              : "Try another filter or search keyword."}
          </p>
        </div>
      )}
    </div>
  );
}
