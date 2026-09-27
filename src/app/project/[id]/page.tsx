"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  Trash2,
  AlertTriangle,
  X,
  Check,
  Share2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useProjects } from "@/lib/projects-context";
import { CanvasItem, BrandBrain } from "@/lib/data";
import { CanvasWorkspace } from "@/canvas/CanvasWorkspace";
import { ShareReviewModal } from "@/components/clients/ShareReviewModal";

export default function ProjectCanvasPage() {
  const params = useParams();
  const router = useRouter();
  const {
    getProject,
    updateProjectCanvas,
    updateBrandBrain,
    deleteProject,
    saveToLibrary,
    publishDirection,
    getSharesForProject,
    activity,
  } = useProjects();
  const projectId = params?.id as string;
  const project = getProject(projectId);

  // Initialise canvas items from saved state
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const prevObjectCountRef = useRef<number>(0);

  useEffect(() => {
    if (project) {
      const objects = project.canvasObjects;
      if (!isInitialized) {
        if (objects && objects.length > 0) {
          // Ensure every item has width/height (migrate old format)
          const migrated = objects.map((item) => ({
            ...item,
            width: item.width ?? 280,
            height: item.height ?? 200,
          }));
          setCanvasItems(migrated);
          prevObjectCountRef.current = migrated.length;
        } else {
          // Default: Brand Brain object for new project
          const defaultItem: CanvasItem = {
            id: `bb-${project.id}`,
            type: "brand_brain",
            x: 80,
            y: 60,
            width: 320,
            height: 380,
            zIndex: 1,
            content: {
              title: project.name,
              client: project.client,
              brain: project.brandBrain,
            },
          };
          setCanvasItems([defaultItem]);
          prevObjectCountRef.current = 1;
        }
        setIsInitialized(true);
      } else if (objects && objects.length > prevObjectCountRef.current) {
        // Detect new objects added externally (e.g. via Explore "Add to Canvas")
        prevObjectCountRef.current = objects.length;
        setCanvasItems(objects);
      }
    }
  }, [project, isInitialized]);

  // Debounced persistence
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleItemsChange = useCallback(
    (items: CanvasItem[]) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        if (project) updateProjectCanvas(project.id, items);
      }, 500);
    },
    [project, updateProjectCanvas]
  );

function getSafeBrandBrain(brain?: BrandBrain | null): BrandBrain {
  return {
    story: {
      overview: brain?.story?.overview || "",
      mission: brain?.story?.mission || brain?.mission || "",
      coreIdea: brain?.story?.coreIdea || "",
    },
    whatTheyDo: brain?.whatTheyDo || "",
    mission: brain?.mission || brain?.story?.mission || "",
    audience: {
      description: brain?.audience?.description || "",
      needs: brain?.audience?.needs || brain?.customerNeeds || "",
      problems: brain?.audience?.problems || "",
      motivations: brain?.audience?.motivations || "",
    },
    customerNeeds: brain?.customerNeeds || brain?.audience?.needs || "",
    positioning: {
      statement: brain?.positioning?.statement || "",
      differentiator: brain?.positioning?.differentiator || brain?.differentiator || "",
      competitiveContext: brain?.positioning?.competitiveContext || brain?.competitors || "",
      opportunity: brain?.positioning?.opportunity || brain?.opportunities || "",
    },
    differentiator: brain?.differentiator || brain?.positioning?.differentiator || "",
    competitors: brain?.competitors || brain?.positioning?.competitiveContext || "",
    values: Array.isArray(brain?.values) ? brain.values : [],
    personality: {
      traits: Array.isArray(brain?.personality?.traits) ? brain.personality.traits : [],
      voice: brain?.personality?.voice || brain?.voice || "",
    },
    tone: brain?.tone || "",
    voice: brain?.voice || brain?.personality?.voice || "",
    visualDirection: {
      shouldFeelLike: Array.isArray(brain?.visualDirection?.shouldFeelLike)
        ? brain.visualDirection.shouldFeelLike
        : Array.isArray(brain?.shouldFeelLike)
        ? brain.shouldFeelLike
        : [],
      shouldNotFeelLike: Array.isArray(brain?.visualDirection?.shouldNotFeelLike)
        ? brain.visualDirection.shouldNotFeelLike
        : Array.isArray(brain?.shouldNotFeelLike)
        ? brain.shouldNotFeelLike
        : [],
    },
    shouldFeelLike: Array.isArray(brain?.shouldFeelLike) ? brain.shouldFeelLike : [],
    shouldNotFeelLike: Array.isArray(brain?.shouldNotFeelLike) ? brain.shouldNotFeelLike : [],
    opportunities: brain?.opportunities || "",
  };
}

  // Brand Brain drawer
  const [isBrainDrawerOpen, setIsBrainDrawerOpen] = useState(false);
  const [editingBrain, setEditingBrain] = useState<BrandBrain | null>(null);

  useEffect(() => {
    if (isBrainDrawerOpen) {
      setEditingBrain(getSafeBrandBrain(project?.brandBrain));
    }
  }, [isBrainDrawerOpen, project?.brandBrain]);

  const saveBrain = () => {
    if (editingBrain && project) {
      updateBrandBrain(project.id, editingBrain);
    }
    setIsBrainDrawerOpen(false);
  };

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Save to library
  const handleSaveToLibrary = useCallback(
    (item: CanvasItem) => {
      const nameMap: Record<string, string> = {
        font: item.content.fontName ?? "Font",
        color: item.content.hex ?? "Color",
        palette: item.content.name ?? "Palette",
        reference: item.content.title ?? "Reference",
        direction: item.content.name ?? "Direction",
      };
      saveToLibrary({
        type: item.type as any,
        name: nameMap[item.type] ?? item.type,
        content: item.content,
      });
    },
    [saveToLibrary]
  );

  // Client Review Share modal state
  const [shareModalConfig, setShareModalConfig] = useState<{
    isOpen: boolean;
    directionId?: string;
    directionName?: string;
    publishedVersion?: number;
    shareToken?: string;
    justPublished?: boolean;
  }>({ isOpen: false });

  // Instant publish toast state
  const [publishToast, setPublishToast] = useState<{
    visible: boolean;
    directionName: string;
    token?: string;
    directionId?: string;
  }>({ visible: false, directionName: "" });

  // Count published directions / sections
  const publishedDirectionsCount = canvasItems.filter(
    (item) => (item.type === "direction" || item.type === "section") && item.content?.published
  ).length;

  // Publish direction to client review
  const handlePublishDirection = useCallback(
    (item: CanvasItem) => {
      if (!project) return;
      const { version, share } = publishDirection(project.id, item, canvasItems);
      // Immediately update local canvas items state so badges and buttons reflect the new published version
      setCanvasItems((prev) =>
        prev.map((obj) =>
          obj.id === item.id
            ? {
                ...obj,
                content: {
                  ...obj.content,
                  published: true,
                  publishedVersion: version.version,
                  lastPublishedAt: version.createdAt,
                },
              }
            : obj
        )
      );

      // Immediately open client review share dialog with link and portal preview
      setShareModalConfig({
        isOpen: true,
        directionId: item.id,
        directionName: version.snapshot.name,
        publishedVersion: version.version,
        shareToken: share?.token,
        justPublished: true,
      });

      // Show immediate toast confirmation
      setPublishToast({
        visible: true,
        directionName: version.snapshot.name,
        token: share?.token,
        directionId: item.id,
      });
    },
    [project, publishDirection, canvasItems]
  );

  // Quick jump: open client portal directly for a direction or project
  const handleViewClientPortal = useCallback(
    (item?: CanvasItem) => {
      if (!project) return;
      const activeShares = getSharesForProject(project.id).filter((s) => s.active);
      let token = activeShares[0]?.token;
      if (!token && item) {
        const { share } = publishDirection(project.id, item, canvasItems);
        token = share.token;
      }
      if (token) {
        const path = item ? `/client/${token}/review/${item.id}` : `/client/${token}/review`;
        window.open(path, "_blank");
      } else {
        setShareModalConfig({
          isOpen: true,
          directionId: item?.id,
          directionName: item?.content?.name || item?.content?.title,
          justPublished: false,
        });
      }
    },
    [project, getSharesForProject, publishDirection, canvasItems]
  );

  if (!project) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-semibold text-ink">Project not found</h2>
        <p className="mt-2 text-xs text-ink-secondary">
          The requested workspace does not exist or has been removed.
        </p>
        <Link href="/projects" className="mt-4">
          <Button variant="primary" size="sm">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const brain = project.brandBrain;

  return (
    <div className="relative flex flex-col overflow-hidden bg-paper" style={{ height: "100dvh" }}>
      {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
      <header
        className="shrink-0 z-40 h-[52px] border-b border-border-subtle bg-surface/95 backdrop-blur-md px-4 flex items-center justify-between gap-4"
        style={{ boxShadow: "0 1px 0 #EBEBE7" }}
      >
        {/* Left: breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/projects"
            className="shrink-0 rounded p-1.5 text-ink-tertiary hover:text-ink hover:bg-surface-subtle transition-colors"
            title="Back to Projects"
          >
            <ArrowLeft size={15} />
          </Link>

          <div className="h-3.5 w-px bg-border-subtle shrink-0" />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-semibold text-ink tracking-tight truncate">
                {project.name}
              </span>
              <span className="text-[11px] text-ink-tertiary shrink-0">·</span>
              <span className="text-[12px] text-ink-secondary truncate max-w-[140px]">
                {project.client}
              </span>
              <span className="shrink-0 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface-muted text-ink-secondary border border-border-subtle">
                {project.status}
              </span>
            </div>
            <p className="text-[11px] text-ink-tertiary">
              {project.type} · Canvas
            </p>
          </div>
        </div>

        {/* Center: mode switcher */}
        <div className="hidden md:flex items-center gap-0.5 p-0.5 rounded-lg bg-surface-subtle border border-border-subtle">
          <button className="px-3 py-1 rounded text-[12px] font-medium bg-surface text-ink shadow-subtle">
            Canvas
          </button>
          <button
            onClick={() => setIsBrainDrawerOpen(true)}
            className="px-3 py-1 rounded text-[12px] font-medium text-ink-secondary hover:text-ink transition-colors flex items-center gap-1.5"
          >
            <Sparkles size={11} />
            Brand Brain
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setShareModalConfig({
                isOpen: true,
                directionId: undefined,
                directionName: undefined,
                justPublished: false,
              })
            }
            className="flex items-center gap-1.5"
            title="Client Review Portal & Share Links"
          >
            <Share2 size={12} />
            <span>Client Review</span>
            {publishedDirectionsCount > 0 && (
              <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium">
                {publishedDirectionsCount}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBrainDrawerOpen(true)}
            className="hidden md:flex items-center gap-1.5"
          >
            <Sparkles size={12} />
            <span>Brand Brain</span>
          </Button>

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            title="Delete Project"
            className="p-1.5 rounded-md text-ink-tertiary hover:text-red-600 hover:bg-red-50 transition-colors border border-border-subtle hover:border-red-200 cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </header>

      {/* ── Canvas ──────────────────────────────────────────────────────── */}
      <main className="flex-1 relative overflow-hidden">
        {isInitialized && (
          <CanvasWorkspace
            initialItems={canvasItems}
            projectName={project.name}
            projectBrain={project.brandBrain}
            onItemsChange={handleItemsChange}
            onOpenBrainDrawer={() => setIsBrainDrawerOpen(true)}
            onSaveToLibrary={handleSaveToLibrary}
            onPublishDirection={handlePublishDirection}
            onViewClientPortal={handleViewClientPortal}
          />
        )}
      </main>

      {/* ── Brand Brain Drawer ──────────────────────────────────────────── */}
      {isBrainDrawerOpen && editingBrain && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/10"
            onClick={() => setIsBrainDrawerOpen(false)}
          />
          <aside className="fixed top-0 right-0 h-full z-50 w-full max-w-md bg-surface border-l border-border-subtle shadow-lifted flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary">
                  Brand Brain
                </p>
                <h2 className="text-base font-semibold text-ink tracking-tight mt-0.5">
                  {project.name}
                </h2>
              </div>
              <button
                onClick={() => setIsBrainDrawerOpen(false)}
                className="p-1.5 rounded-md text-ink-tertiary hover:text-ink hover:bg-surface-subtle transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 text-sm">
              {/* What They Do & Story */}
              <section>
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary mb-2">What They Do & Mission</h3>
                <textarea
                  value={editingBrain.whatTheyDo || editingBrain.story?.overview || ""}
                  onChange={(e) =>
                    setEditingBrain((b) =>
                      b ? { ...b, whatTheyDo: e.target.value } : b
                    )
                  }
                  className="w-full rounded-lg border border-border-subtle px-3 py-2 text-xs text-ink bg-surface-subtle focus:border-ink focus:outline-none resize-none"
                  rows={2}
                  placeholder="What they do..."
                />
                <textarea
                  value={editingBrain.mission || editingBrain.story?.mission || ""}
                  onChange={(e) =>
                    setEditingBrain((b) =>
                      b ? { ...b, mission: e.target.value, story: { ...b.story, mission: e.target.value } } : b
                    )
                  }
                  className="w-full mt-2 rounded-lg border border-border-subtle px-3 py-2 text-xs text-ink bg-surface-subtle focus:border-ink focus:outline-none resize-none"
                  rows={2}
                  placeholder="Brand mission..."
                />
              </section>

              {/* Story Overview & Core Idea */}
              <section>
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary mb-2">Brand Story</h3>
                <textarea
                  value={editingBrain.story?.overview || ""}
                  onChange={(e) =>
                    setEditingBrain((b) =>
                      b ? { ...b, story: { ...(b.story || {}), overview: e.target.value } } : b
                    )
                  }
                  className="w-full rounded-lg border border-border-subtle px-3 py-2 text-xs text-ink bg-surface-subtle focus:border-ink focus:outline-none resize-none"
                  rows={3}
                  placeholder="Brand overview..."
                />
                <textarea
                  value={editingBrain.story?.coreIdea || ""}
                  onChange={(e) =>
                    setEditingBrain((b) =>
                      b ? { ...b, story: { ...(b.story || {}), coreIdea: e.target.value } } : b
                    )
                  }
                  className="w-full mt-2 rounded-lg border border-border-subtle px-3 py-2 text-xs text-ink bg-surface-subtle focus:border-ink focus:outline-none resize-none"
                  rows={2}
                  placeholder="Core idea..."
                />
              </section>

              {/* Audience & Customer Needs */}
              <section>
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary mb-2">Audience & Needs</h3>
                <textarea
                  value={editingBrain.audience?.description || ""}
                  onChange={(e) =>
                    setEditingBrain((b) =>
                      b ? { ...b, audience: { ...(b.audience || {}), description: e.target.value } } : b
                    )
                  }
                  className="w-full rounded-lg border border-border-subtle px-3 py-2 text-xs text-ink bg-surface-subtle focus:border-ink focus:outline-none resize-none"
                  rows={2}
                  placeholder="Audience description..."
                />
                <textarea
                  value={editingBrain.customerNeeds || editingBrain.audience?.needs || ""}
                  onChange={(e) =>
                    setEditingBrain((b) =>
                      b ? { ...b, customerNeeds: e.target.value, audience: { ...(b.audience || {}), needs: e.target.value } } : b
                    )
                  }
                  className="w-full mt-2 rounded-lg border border-border-subtle px-3 py-2 text-xs text-ink bg-surface-subtle focus:border-ink focus:outline-none resize-none"
                  rows={2}
                  placeholder="Customer needs..."
                />
              </section>

              {/* Positioning, Differentiator & Competitors */}
              <section>
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary mb-2">Positioning & Competition</h3>
                <textarea
                  value={editingBrain.positioning?.statement || ""}
                  onChange={(e) =>
                    setEditingBrain((b) =>
                      b ? { ...b, positioning: { ...(b.positioning || {}), statement: e.target.value } } : b
                    )
                  }
                  className="w-full rounded-lg border border-border-subtle px-3 py-2 text-xs text-ink bg-surface-subtle focus:border-ink focus:outline-none resize-none"
                  rows={2}
                  placeholder="Positioning statement..."
                />
                <textarea
                  value={editingBrain.differentiator || editingBrain.positioning?.differentiator || ""}
                  onChange={(e) =>
                    setEditingBrain((b) =>
                      b ? { ...b, differentiator: e.target.value, positioning: { ...(b.positioning || {}), differentiator: e.target.value } } : b
                    )
                  }
                  className="w-full mt-2 rounded-lg border border-border-subtle px-3 py-2 text-xs text-ink bg-surface-subtle focus:border-ink focus:outline-none resize-none"
                  rows={2}
                  placeholder="Differentiator..."
                />
                <input
                  type="text"
                  value={editingBrain.competitors || editingBrain.positioning?.competitiveContext || ""}
                  onChange={(e) =>
                    setEditingBrain((b) =>
                      b ? { ...b, competitors: e.target.value } : b
                    )
                  }
                  className="w-full mt-2 rounded-lg border border-border-subtle px-3 py-2 text-xs text-ink bg-surface-subtle focus:border-ink focus:outline-none"
                  placeholder="Competitors..."
                />
                <input
                  type="text"
                  value={editingBrain.opportunities || editingBrain.positioning?.opportunity || ""}
                  onChange={(e) =>
                    setEditingBrain((b) =>
                      b ? { ...b, opportunities: e.target.value } : b
                    )
                  }
                  className="w-full mt-2 rounded-lg border border-border-subtle px-3 py-2 text-xs text-ink bg-surface-subtle focus:border-ink focus:outline-none"
                  placeholder="Market opportunities..."
                />
              </section>

              {/* Personality, Tone & Voice */}
              <section>
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary mb-2">Personality & Tone</h3>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(editingBrain.personality?.traits || []).map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded bg-surface-muted text-ink text-[11px] border border-border-subtle"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={editingBrain.tone || ""}
                  onChange={(e) =>
                    setEditingBrain((b) =>
                      b ? { ...b, tone: e.target.value } : b
                    )
                  }
                  className="w-full rounded-lg border border-border-subtle px-3 py-2 text-xs text-ink bg-surface-subtle focus:border-ink focus:outline-none mb-2"
                  placeholder="Tone (e.g. Articulate, measured, elevated)..."
                />
                <textarea
                  value={editingBrain.voice || editingBrain.personality?.voice || ""}
                  onChange={(e) =>
                    setEditingBrain((b) =>
                      b ? { ...b, voice: e.target.value, personality: { ...(b.personality || {}), voice: e.target.value } } : b
                    )
                  }
                  className="w-full rounded-lg border border-border-subtle px-3 py-2 text-xs text-ink bg-surface-subtle focus:border-ink focus:outline-none resize-none"
                  rows={2}
                  placeholder="Brand voice..."
                />
              </section>

              {/* Visual Direction */}
              <section>
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary mb-2">Visual Direction</h3>
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {(editingBrain.visualDirection?.shouldFeelLike || []).map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded bg-surface-muted text-ink text-[11px] border border-border-subtle">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(editingBrain.visualDirection?.shouldNotFeelLike || []).map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded text-ink-tertiary line-through text-[11px] border border-border-subtle">
                      {t}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            <div className="px-5 py-4 border-t border-border-subtle flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsBrainDrawerOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={saveBrain} className="flex items-center gap-1.5">
                <Check size={13} className="text-white" />
                <span className="text-white">Save changes</span>
              </Button>
            </div>
          </aside>
        </>
      )}

      {/* ── Delete Confirmation Modal ───────────────────────────────────── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-sm rounded-xl border border-border-subtle bg-surface p-6 shadow-lifted">
            <div className="flex items-center gap-2.5 text-red-600 mb-3">
              <AlertTriangle size={18} />
              <h3 className="text-sm font-semibold tracking-tight text-ink">Delete Project</h3>
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-ink">&ldquo;{project.name}&rdquo;</span>? This
              will permanently remove this project, its canvas, and Brand Brain.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
              <button
                type="button"
                onClick={() => {
                  deleteProject(project.id);
                  router.push("/projects");
                }}
                className="h-8 px-3 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Delete project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Client Review Share Modal ─────────────────────────────────────── */}
      {shareModalConfig.isOpen && project && (
        <ShareReviewModal
          projectId={project.id}
          projectName={project.name}
          clientId={project.client}
          directionId={shareModalConfig.directionId}
          directionName={shareModalConfig.directionName}
          publishedVersion={shareModalConfig.publishedVersion}
          shareToken={shareModalConfig.shareToken}
          justPublished={shareModalConfig.justPublished}
          onClose={() => setShareModalConfig({ isOpen: false })}
        />
      )}

      {/* ── Instant Publish Toast Notification ────────────────────────── */}
      {publishToast.visible && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#191918] text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check size={16} />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Project Direction Published!</p>
            <p className="text-[11px] text-stone-400">
              {publishToast.directionName || "Creative Direction"} is live for client review.
            </p>
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            {publishToast.token && (
              <button
                type="button"
                onClick={() => {
                  window.open(
                    `/client/${publishToast.token}/review/${publishToast.directionId || ""}`,
                    "_blank"
                  );
                }}
                className="px-2.5 py-1 text-[11px] font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Open Page</span>
                <ExternalLink size={11} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setPublishToast((t) => ({ ...t, visible: false }))}
              className="p-1 text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
