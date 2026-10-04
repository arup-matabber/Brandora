"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, SlidersHorizontal, X, ArrowUpDown, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { useFonts } from "@/lib/typography/use-fonts";
import { FontItem, FontSortOption } from "@/lib/typography/types";
import { FontCard } from "./FontCard";
import { FontSpecimenModal } from "./FontSpecimenModal";
import { useProjects } from "@/lib/projects-context";

interface TypographyLaboratoryProps {
  projectName?: string;
  onSelectFont?: (font: FontItem) => void;
}

const CATEGORIES = [
  { label: "All", value: "" },
  { label: "Sans", value: "sans-serif" },
  { label: "Serif", value: "serif" },
  { label: "Display", value: "display" },
  { label: "Handwriting", value: "handwriting" },
  { label: "Monospace", value: "monospace" },
] as const;

const SORT_OPTIONS: { label: string; value: FontSortOption }[] = [
  { label: "Popular", value: "popularity" },
  { label: "Trending", value: "trending" },
  { label: "Alphabetical", value: "alpha" },
  { label: "Most Styles", value: "style" },
];

export function TypographyLaboratory({
  projectName = "ORBLINN",
  onSelectFont,
}: TypographyLaboratoryProps) {
  const { projects, library, saveToLibrary, addInspirationToCanvas } = useProjects();

  // Active context project for adding font specimen directly to canvas
  const activeProject = projects.length > 0 ? projects[0] : null;

  // Search & specimen text state
  const [searchInput, setSearchInput] = useState("");
  const [specimenText, setSpecimenText] = useState(projectName);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSort, setSelectedSort] = useState<FontSortOption>("popularity");

  // Full specimen preview modal
  const [modalFont, setModalFont] = useState<FontItem | null>(null);

  // Quick feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Typography data layer via useFonts hook
  const {
    fonts,
    isLoading,
    error,
    isFallback,
    total,
    hasMore,
    setOptions,
    refetch,
    loadMore,
  } = useFonts({
    sort: selectedSort,
    category: selectedCategory || undefined,
    limit: 30,
  });

  // Debounced search query propagation to provider options
  useEffect(() => {
    const timer = setTimeout(() => {
      setOptions((prev) => ({
        ...prev,
        search: searchInput.trim() || undefined,
        category: selectedCategory || undefined,
        sort: selectedSort,
      }));
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput, selectedCategory, selectedSort, setOptions]);

  // Instant client-side filtering for immediate feedback while typing
  const displayedFonts = useMemo(() => {
    if (!searchInput.trim()) return fonts;
    const q = searchInput.toLowerCase().trim();
    return fonts.filter(
      (f) =>
        f.family.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }, [fonts, searchInput]);

  // Set of saved font families in Opalite Creative Library
  const savedFontFamilies = useMemo(() => {
    return new Set(
      library
        .filter((item) => item.type === "font")
        .map((item) => item.name.toLowerCase())
    );
  }, [library]);

  const handleSaveFont = (font: FontItem) => {
    saveToLibrary({
      type: "font",
      name: font.family,
      content: {
        fontFamily: font.family,
        category: font.category,
        variants: font.variants,
        subsets: font.subsets,
        provider: font.provider,
        previewText: specimenText || "ORBLINN",
      },
    });
    showToast(`Saved ${font.family} to Creative Library`);
  };

  const handleAddToCanvas = (font: FontItem) => {
    if (!activeProject) {
      showToast("No active project available");
      return;
    }

    addInspirationToCanvas(activeProject.id, {
      type: "font",
      title: font.family,
      content: {
        fontName: font.family,
        fontFamily: font.family,
        provider: font.provider || "google",
        category: font.category,
        variant: (font.variants?.includes("regular") ? "regular" : font.variants?.[0]) || "400",
        variants: font.variants || [],
        files: font.files || {},
        previewText: specimenText || "ORBLINN",
      },
      metadata: {
        fontFamily: font.family,
        provider: font.provider || "google",
        category: font.category,
        categoryType: font.category,
        variants: font.variants || [],
        files: font.files || {},
        version: font.version,
        lastModified: font.lastModified,
      },
    });

    showToast(`Added ${font.family} to ${activeProject.name} canvas`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-black/[0.06]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary block">
            Creative Type Laboratory
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink mt-0.5">
            Typography
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-ink-secondary">
            Explore curated Google Fonts, inspect live brand specimens, and add typefaces to your canvas.
          </p>
        </div>

        {/* Live Specimen Customizer Input */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-black/[0.08] shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-ink-tertiary">Specimen:</span>
            <input
              type="text"
              value={specimenText}
              onChange={(e) => setSpecimenText(e.target.value)}
              placeholder="Brand Name (e.g. ORBLINN)..."
              className="bg-transparent text-xs text-ink font-medium outline-none w-28 sm:w-36 placeholder:text-ink-tertiary"
            />
          </div>
          {specimenText !== projectName && (
            <button
              type="button"
              onClick={() => setSpecimenText(projectName)}
              className="text-[10px] font-mono text-ink-tertiary hover:text-ink underline"
            >
              Reset
            </button>
          )}
        </div>
      </header>

      {/* ── Filter & Search Control Bar ────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-tertiary"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search fonts by family name..."
              className="w-full h-10 pl-9 pr-8 rounded-full border border-black/[0.08] bg-white text-xs text-ink outline-none focus:border-ink/50 focus:ring-2 focus:ring-ink/10 transition-all shadow-2xs"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink p-0.5 rounded-full"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <span className="text-[11px] font-mono uppercase tracking-wider text-ink-tertiary flex items-center gap-1">
              <ArrowUpDown size={12} />
              <span>Sort:</span>
            </span>
            <div className="flex items-center p-0.5 rounded-full bg-stone-100/80 border border-black/[0.04]">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedSort(opt.value)}
                  className={`px-3 py-1 rounded-full text-xs transition-all ${
                    selectedSort === opt.value
                      ? "bg-white text-ink font-medium shadow-xs"
                      : "text-ink-secondary hover:text-ink hover:bg-white/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category Pills Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <button
                key={cat.label}
                type="button"
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 select-none ${
                  isSelected
                    ? "bg-ink text-white shadow-xs"
                    : "bg-white text-ink-secondary hover:text-ink border border-black/[0.06] hover:bg-stone-50"
                }`}
              >
                {cat.label}
              </button>
            );
          })}

          <div className="ml-auto pl-2 shrink-0 text-[11px] font-mono text-ink-tertiary">
            {isLoading ? "Fetching..." : `${total} typefaces`}
          </div>
        </div>
      </div>

      {/* ── Fallback / Notice Banner (if API key not set or network fallback) ── */}
      {isFallback && (
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between text-xs text-amber-900 gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-amber-700 shrink-0" />
            <span>
              Using curated typography catalogue. Add your <code className="font-mono text-[11px] bg-amber-100/70 px-1.5 py-0.5 rounded">GOOGLE_FONTS_API_KEY</code> in <code className="font-mono text-[11px] bg-amber-100/70 px-1.5 py-0.5 rounded">.env.local</code> for the full 1,700+ Google Fonts library.
            </span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-[11px] font-semibold text-amber-800 hover:underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Responsive Font Specimen Gallery ───────────────────────── */}
      {isLoading && displayedFonts.length === 0 ? (
        /* Loading Skeleton Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[24px] border border-black/[0.06] bg-white p-6 h-56 flex flex-col justify-between animate-pulse"
            >
              <div className="space-y-3">
                <div className="h-8 bg-stone-100 rounded-lg w-3/4" />
                <div className="h-4 bg-stone-100 rounded w-full" />
              </div>
              <div className="pt-4 border-t border-black/[0.04] flex justify-between items-center">
                <div className="h-4 bg-stone-100 rounded w-1/3" />
                <div className="h-8 w-8 bg-stone-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : displayedFonts.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedFonts.map((font) => (
              <FontCard
                key={font.id}
                font={font}
                previewText={specimenText}
                isSaved={savedFontFamilies.has(font.family.toLowerCase())}
                onSave={handleSaveFont}
                onAddToCanvas={handleAddToCanvas}
                onPreview={(f) => setModalFont(f)}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={loadMore}
                disabled={isLoading}
                className="h-10 px-6 rounded-full bg-white hover:bg-stone-50 border border-black/[0.08] text-xs font-semibold text-ink shadow-2xs transition-all active:scale-[0.98] flex items-center gap-2"
              >
                {isLoading && <Loader2 size={13} className="animate-spin text-ink-tertiary" />}
                <span>Load More Typefaces</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty Search Results State */
        <div className="rounded-[28px] border border-dashed border-black/[0.1] bg-white/60 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-ink-tertiary">
            <Search size={16} />
          </div>
          <h3 className="text-sm font-semibold text-ink">No typefaces found</h3>
          <p className="text-xs text-ink-secondary leading-relaxed">
            No font families matched &ldquo;{searchInput}&rdquo;. Try another name or clear your filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setSelectedCategory("");
            }}
            className="text-xs font-semibold text-ink hover:underline pt-1 block mx-auto"
          >
            Clear search & filters
          </button>
        </div>
      )}

      {/* ── Typeface Specimen Modal ─────────────────────────────────── */}
      {modalFont && (
        <FontSpecimenModal
          font={modalFont}
          initialText={specimenText}
          isSaved={savedFontFamilies.has(modalFont.family.toLowerCase())}
          onSave={handleSaveFont}
          onAddToCanvas={handleAddToCanvas}
          onClose={() => setModalFont(null)}
        />
      )}

      {/* ── Toast Feedback ─────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#191918] text-white text-xs px-4 py-2.5 rounded-full shadow-lg border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
