"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Sparkles,
  SlidersHorizontal,
  X,
  Heart,
  Plus,
  Compass,
  Type,
  Droplets,
  BookOpen,
  Bookmark,
  Check,
  ExternalLink,
  Palette,
  Loader2,
  Globe,
} from "lucide-react";
import { useProjects } from "@/lib/projects-context";
import {
  NormalizedInspirationItem,
  InspirationCategory,
} from "@/lib/inspiration/types";
import {
  defaultInspirationProvider,
  MOCK_INSPIRATION_ITEMS,
  SUGGESTED_TOPICS,
} from "@/lib/inspiration/mock-provider";
import { pixabayInspirationProvider } from "@/lib/inspiration/pixabay-provider";
import { isPixabayConfigured } from "@/lib/pixabay-config";
import { InspirationCard } from "@/components/explore/InspirationCard";
import { InspirationDetailModal } from "@/components/explore/InspirationDetailModal";
import { AddToProjectModal } from "@/components/explore/AddToProjectModal";
import { TypographyExplore } from "@/components/explore/TypographyExplore";
import { ColorExplore } from "@/components/explore/ColorExplore";
import { SavedExplore } from "@/components/explore/SavedExplore";
import { ImagePalette } from "@/components/explore/ImagePalette";

export type ExploreTab =
  | "discover"
  | "typography"
  | "colors"
  | "image-palette"
  | "references"
  | "saved";

export default function ExplorePage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-xs text-ink-tertiary">Loading inspiration feed...</div>}>
      <ExploreContent />
    </React.Suspense>
  );
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as ExploreTab) || "discover";
  const initialProjectId = searchParams.get("projectId") || searchParams.get("project") || null;

  const { projects, library, saveToLibrary, removeFromLibrary, addInspirationToCanvas } =
    useProjects();

  const [activeTab, setActiveTab] = useState<ExploreTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState<string>("All");
  const [activeMood, setActiveMood] = useState<string>("All");

  // All inspiration items from the curated provider
  const [allItems, setAllItems] = useState<NormalizedInspirationItem[]>(MOCK_INSPIRATION_ITEMS);
  const [isLoading, setIsLoading] = useState(false);

  // Pixabay Live Search Integration
  const [pixabayItems, setPixabayItems] = useState<NormalizedInspirationItem[]>([]);
  const [isPixabayLoading, setIsPixabayLoading] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<"all" | "curated" | "pixabay">("all");
  const hasPixabay = isPixabayConfigured();

  // Detail Modal & Add to Project Modal states
  const [detailItem, setDetailItem] = useState<NormalizedInspirationItem | null>(null);
  const [modalItem, setModalItem] = useState<NormalizedInspirationItem | null>(null);
  const [defaultPlaceOnCanvas, setDefaultPlaceOnCanvas] = useState(false);

  // Quick feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load items from curated provider
  useEffect(() => {
    let isMounted = true;
    defaultInspirationProvider
      .getTrending()
      .then((items) => {
        if (isMounted) {
          setAllItems(items);
          setIsLoading(false);
        }
      })
      .catch(() => setIsLoading(false));
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch live Pixabay items when searching or topic changes
  useEffect(() => {
    if (!hasPixabay || sourceFilter === "curated") {
      return;
    }

    let isMounted = true;
    setIsPixabayLoading(true);

    const timer = setTimeout(() => {
      pixabayInspirationProvider
        .search(searchQuery, { category: activeTopic })
        .then((items) => {
          if (isMounted) {
            setPixabayItems(items);
            setIsPixabayLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setIsPixabayLoading(false);
        });
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, activeTopic, sourceFilter, hasPixabay]);

  // Track saved item IDs from unified library
  const savedItemIds = useMemo(() => {
    return new Set(
      library.map((l) => l.content?.pinId || l.id || l.name)
    );
  }, [library]);

  const isItemSaved = (item: NormalizedInspirationItem) => {
    return (
      savedItemIds.has(item.id) ||
      library.some((l) => l.name === item.title || l.content?.title === item.title)
    );
  };

  // Active contextual project (if project-aware)
  const contextualProject = projects.find((p) => p.id === initialProjectId) || null;

  // Filter items for Discover & References combining Curated + Pixabay
  const filteredFeedItems = useMemo(() => {
    // 1. Filter Curated Items
    const curatedFiltered = allItems.filter((item) => {
      if (activeTab === "references" && item.type !== "reference") return false;
      if (activeTopic !== "All" && item.category !== activeTopic) return false;
      if (activeMood !== "All" && item.metadata?.mood !== activeMood) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = [
          item.title,
          item.creator ?? "",
          item.category,
          ...item.tags,
          item.metadata?.mood ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    // 2. Filter Pixabay Items
    const pixabayFiltered = pixabayItems.filter((item) => {
      if (activeTopic !== "All" && item.category !== activeTopic) return false;
      return true;
    });

    if (sourceFilter === "curated") {
      return curatedFiltered;
    }
    if (sourceFilter === "pixabay") {
      return pixabayFiltered;
    }

    // "all": Interleave curated and live Pixabay results
    const combined: NormalizedInspirationItem[] = [];
    const seenIds = new Set<string>();

    const maxLen = Math.max(curatedFiltered.length, pixabayFiltered.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < curatedFiltered.length && !seenIds.has(curatedFiltered[i].id)) {
        combined.push(curatedFiltered[i]);
        seenIds.add(curatedFiltered[i].id);
      }
      if (i < pixabayFiltered.length && !seenIds.has(pixabayFiltered[i].id)) {
        combined.push(pixabayFiltered[i]);
        seenIds.add(pixabayFiltered[i].id);
      }
    }

    return combined;
  }, [allItems, pixabayItems, activeTab, activeTopic, activeMood, searchQuery, sourceFilter]);

  // Save handler
  const handleSave = (item: NormalizedInspirationItem, note?: string) => {
    saveToLibrary({
      type: item.type,
      name: item.title,
      notes: note,
      source: item.creator || item.provider,
      sourceUrl: item.sourceUrl,
      imageUrl: item.imageUrl,
      tags: item.tags,
      content: {
        pinId: item.id,
        title: item.title,
        source: item.creator || item.provider,
        url: item.imageUrl,
        sourceUrl: item.sourceUrl,
        tags: item.tags,
        note,
        metadata: item.metadata,
      },
    });
    triggerToast(`Saved "${item.title}" to Library`);
  };

  // Add to Project handler
  const handleOpenAddToProject = (item: NormalizedInspirationItem) => {
    setModalItem(item);
    setDefaultPlaceOnCanvas(false);
  };

  // Add directly to Canvas handler
  const handleOpenAddToCanvas = (item: NormalizedInspirationItem) => {
    // If only one project exists or contextual project is active, add immediately or prompt
    if (contextualProject) {
      addInspirationToCanvas(contextualProject.id, item);
      triggerToast(`Placed on ${contextualProject.name}'s Canvas`);
      return;
    }

    setModalItem(item);
    setDefaultPlaceOnCanvas(true);
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* ── Header Area ─────────────────────────────────────────────────── */}
      <header className="space-y-4 pb-2 border-b border-border-subtle">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary block mb-1">
              Creative Discovery
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              Explore
            </h1>
            <p className="mt-1 text-sm text-ink-secondary">
              A quiet visual feed for the brand decisions you are shaping.
            </p>
          </div>

          {/* Tab navigation */}
          <nav className="flex items-center gap-1 p-1 rounded-xl bg-surface border border-border-subtle text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("discover")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "discover"
                  ? "bg-surface-subtle text-ink shadow-subtle"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              <Compass size={13} />
              <span>Discover</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("typography")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "typography"
                  ? "bg-surface-subtle text-ink shadow-subtle"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              <Type size={13} />
              <span>Typography</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("colors")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "colors"
                  ? "bg-surface-subtle text-ink shadow-subtle"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              <Droplets size={13} />
              <span>Colors</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("image-palette")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "image-palette"
                  ? "bg-surface-subtle text-ink shadow-subtle"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              <Palette size={13} />
              <span>Image → Palette</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("references")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "references"
                  ? "bg-surface-subtle text-ink shadow-subtle"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              <BookOpen size={13} />
              <span>References</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("saved")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "saved"
                  ? "bg-surface-subtle text-ink shadow-subtle"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              <Bookmark size={13} />
              <span>Saved</span>
              {library.length > 0 && (
                <span className="font-mono text-[10px] text-ink-tertiary">
                  ({library.length})
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* ── Project-Aware Banner (Phase 10) ───────────────────────────── */}
        {contextualProject && (
          <div className="p-3.5 rounded-xl border border-border-subtle bg-surface-subtle/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-ink border border-border-subtle shrink-0">
                <Sparkles size={15} />
              </div>
              <div>
                <div className="text-xs font-semibold text-ink">
                  Curated for {contextualProject.name}
                </div>
                <div className="text-[11px] text-ink-tertiary">
                  Filtering visual tone based on Brand Brain:{" "}
                  <span className="text-ink-secondary font-medium">
                    {contextualProject.brandBrain?.visualDirection?.shouldFeelLike?.join(" · ") ||
                      "Editorial · Minimal · Contemporary"}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href={`/project/${contextualProject.id}`}
              className="text-xs text-ink hover:underline inline-flex items-center gap-1 font-medium"
            >
              <span>Back to Canvas</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        )}
      </header>

      {/* ── TAB 1 & 4: DISCOVER / REFERENCES FEED ────────────────────── */}
      {(activeTab === "discover" || activeTab === "references") && (
        <div className="space-y-6">
          {/* Search bar & Suggested topics */}
          <div className="space-y-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-tertiary"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search inspiration across branding, typography, packaging, posters, Pixabay imagery..."
                className="w-full h-12 pl-11 pr-11 rounded-full border border-black/[0.06] bg-white text-sm text-ink placeholder:text-ink-tertiary outline-none focus:border-ink transition-all shadow-sm"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isPixabayLoading && (
                  <Loader2 size={15} className="animate-spin text-ink-tertiary" />
                )}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-ink-tertiary hover:text-ink p-1 rounded-full hover:bg-stone-100"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Filter controls row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Suggested Topic Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTopic("All")}
                  className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                    activeTopic === "All"
                      ? "bg-ink text-white font-medium shadow-sm"
                      : "bg-white text-ink-secondary border border-black/[0.05] hover:text-ink hover:bg-stone-50"
                  }`}
                >
                  All Topics
                </button>

                {SUGGESTED_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => setActiveTopic(topic)}
                    className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                      activeTopic === topic
                        ? "bg-ink text-white font-medium shadow-sm"
                        : "bg-white text-ink-secondary border border-black/[0.05] hover:text-ink hover:bg-stone-50"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>

              {/* Source Filter (Curated vs Pixabay Live) */}
              {hasPixabay && (
                <div className="flex items-center gap-1 p-1 rounded-full bg-stone-100/90 border border-black/[0.04] text-[11px] shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setSourceFilter("all")}
                    className={`px-3 py-1 rounded-full transition-all ${
                      sourceFilter === "all"
                        ? "bg-white text-ink font-medium shadow-sm"
                        : "text-ink-secondary hover:text-ink"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceFilter("curated")}
                    className={`px-3 py-1 rounded-full transition-all ${
                      sourceFilter === "curated"
                        ? "bg-white text-ink font-medium shadow-sm"
                        : "text-ink-secondary hover:text-ink"
                    }`}
                  >
                    Curated
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceFilter("pixabay")}
                    className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                      sourceFilter === "pixabay"
                        ? "bg-white text-ink font-medium shadow-sm"
                        : "text-ink-secondary hover:text-ink"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Pixabay Live</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Masonry Visual Feed */}
          {filteredFeedItems.length > 0 ? (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
              {filteredFeedItems.map((item) => (
                <InspirationCard
                  key={item.id}
                  item={item}
                  isSaved={isItemSaved(item)}
                  onSave={handleSave}
                  onAddToCanvas={handleOpenAddToCanvas}
                  onOpenDetail={(it) => setDetailItem(it)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border-subtle bg-surface/50 p-16 text-center">
              <h3 className="text-sm font-semibold text-ink">Nothing matches this direction yet</h3>
              <p className="mt-1 text-xs text-ink-secondary">
                Try searching for a broader keyword or resetting your category filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveTopic("All");
                  setActiveMood("All");
                }}
                className="mt-4 text-xs font-medium text-ink hover:underline"
              >
                Reset discovery filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: TYPOGRAPHY EXPLORATION ────────────────────────────── */}
      {activeTab === "typography" && (
        <TypographyExplore
          items={allItems}
          savedIds={savedItemIds}
          onSave={handleSave}
          onAddToProject={handleOpenAddToProject}
          onAddToCanvas={handleOpenAddToCanvas}
          projectName={contextualProject?.name || "Orblinn Studio"}
        />
      )}

      {/* ── TAB 3: COLOR & PALETTE EXPLORATION ────────────────────────── */}
      {activeTab === "colors" && (
        <ColorExplore
          items={allItems}
          savedIds={savedItemIds}
          onSave={handleSave}
          onAddToProject={handleOpenAddToProject}
          onAddToCanvas={handleOpenAddToCanvas}
        />
      )}

      {/* ── TAB 3b: IMAGE → PALETTE EXTRACTION ─────────────────────────── */}
      {activeTab === "image-palette" && <ImagePalette activeProject={contextualProject} />}

      {/* ── TAB 5: SAVED CREATIVE MEMORY ──────────────────────────────── */}
      {activeTab === "saved" && (
        <SavedExplore
          items={library}
          onRemove={(id) => removeFromLibrary(id)}
          onAddToProject={(libItem) => {
            handleOpenAddToProject({
              id: libItem.id,
              provider: "opalite_curated",
              title: libItem.name,
              imageUrl: libItem.imageUrl || libItem.content?.url,
              type: libItem.type as any,
              category: "Branding",
              tags: libItem.tags || [],
              metadata: libItem.content,
            });
          }}
          onAddToCanvas={(libItem) => {
            handleOpenAddToCanvas({
              id: libItem.id,
              provider: "opalite_curated",
              title: libItem.name,
              imageUrl: libItem.imageUrl || libItem.content?.url,
              type: libItem.type as any,
              category: "Branding",
              tags: libItem.tags || [],
              metadata: libItem.content,
            });
          }}
        />
      )}

      {/* ── Detail Modal ──────────────────────────────────────────────── */}
      {detailItem && (
        <InspirationDetailModal
          item={detailItem}
          isSaved={isItemSaved(detailItem)}
          onClose={() => setDetailItem(null)}
          onSave={handleSave}
          onAddToProject={handleOpenAddToProject}
          onAddToCanvas={handleOpenAddToCanvas}
        />
      )}

      {/* ── Add to Project Modal ───────────────────────────────────────── */}
      {modalItem && (
        <AddToProjectModal
          item={modalItem}
          defaultPlaceOnCanvas={defaultPlaceOnCanvas}
          onClose={() => setModalItem(null)}
          onSuccess={(projName, onCanvas) => {
            triggerToast(
              onCanvas
                ? `Placed on ${projName}'s Canvas`
                : `Saved and linked to ${projName}`
            );
          }}
        />
      )}

      {/* ── Toast Notification ────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#191918] text-white text-xs font-medium shadow-lifted flex items-center gap-2 animate-fade-in">
          <Check size={14} className="text-white" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
