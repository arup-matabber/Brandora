"use client";

import React, { useCallback, useRef, useState } from "react";
import {
  ImagePlus,
  Upload,
  Copy,
  Check,
  Heart,
  FolderPlus,
  Layers,
  X,
  Loader2,
  AlertTriangle,
  Sparkles,
  Palette,
} from "lucide-react";
import { useProjects, PalettePayload } from "@/lib/projects-context";
import { Button } from "@/components/ui/Button";
import { extractPaletteFromImage, ExtractedPalette } from "@/lib/image-palette";
import { BrandProject } from "@/lib/data";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 15 * 1024 * 1024; // 15 MB

type Status = "idle" | "analyzing" | "success" | "error";

interface PickerState {
  title: string;
  subtitle?: string;
  options: { id: string; label: string; sub?: string }[];
  onPick: (id: string) => void;
}

interface ImagePaletteProps {
  /** The contextual project (when Explore is opened from a project via ?projectId=). */
  activeProject: BrandProject | null;
}

export function ImagePalette({ activeProject }: ImagePaletteProps) {
  const { projects, saveToLibrary, applyPaletteToProject, attachPaletteToDirection } =
    useProjects();

  const [status, setStatus] = useState<Status>("idle");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState("");
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [result, setResult] = useState<ExtractedPalette | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [picker, setPicker] = useState<PickerState | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const fireToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const palettePayload = (): PalettePayload | null => {
    if (!result) return null;
    const name = sourceName ? `${sourceName} palette` : "Extracted palette";
    return { name, colors: result.colors.map((c) => ({ hex: c.hex, label: c.name })) };
  };

  const processFile = useCallback(
    (file: File) => {
      if (!ACCEPTED.includes(file.type)) {
        setStatus("error");
        setError("Unsupported file type. Please use JPG, PNG, or WEBP.");
        return;
      }
      if (file.size > MAX_SIZE) {
        setStatus("error");
        setError("That image is too large. Keep it under 15 MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const url = reader.result as string;
        setImageUrl(url);
        setSourceName(file.name);
        setResult(null);
        setError(null);
        setStatus("analyzing");
        const started = Date.now();
        try {
          const palette = await extractPaletteFromImage(
            url,
            file.name.replace(/\.[^.]+$/, "")
          );
          // Keep the analyzing state perceptible so the extraction feels deliberate.
          const elapsed = Date.now() - started;
          if (elapsed < 700) await new Promise((r) => setTimeout(r, 700 - elapsed));
          setDims({ w: palette.width, h: palette.height });
          setResult(palette);
          setStatus("success");
        } catch (e) {
          console.error("Image palette extraction failed", e);
          setStatus("error");
          setError("We couldn't analyze this image. Try a different file.");
        }
      };
      reader.onerror = () => {
        setStatus("error");
        setError("We couldn't read that file. Try a different image.");
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setImageUrl(null);
    setSourceName("");
    setDims(null);
    setResult(null);
    setError(null);
  }, []);

  const copyHex = useCallback((hex: string) => {
    void navigator.clipboard?.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1200);
  }, []);

  const copyAll = useCallback(() => {
    if (!result) return;
    void navigator.clipboard?.writeText(result.colors.map((c) => c.hex).join("  "));
    fireToast("Copied all HEX values");
  }, [result, fireToast]);

  // ── Save Palette → Library (persistent) ──────────────────────────────────
  const handleSave = useCallback(() => {
    const payload = palettePayload();
    if (!payload || !result) return;
    saveToLibrary({
      type: "palette",
      name: payload.name,
      projectIds: activeProject ? [activeProject.id] : undefined,
      source: "Image extraction",
      tags: result.analysis.keywords,
      content: {
        name: payload.name,
        colors: payload.colors,
        rgb: result.colors.map((c) => ({
          hex: c.hex,
          name: c.name,
          rgb: `rgb(${c.r}, ${c.g}, ${c.b})`,
          percentage: c.percentage,
        })),
        analysis: result.analysis,
        sourceName,
        generatedAt: result.generatedAt,
      },
    });
    fireToast("Saved to Library");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, sourceName, activeProject, saveToLibrary, fireToast]);

  // ── Apply to Project → current color exploration ─────────────────────────
  const doApply = useCallback(
    (projectId: string) => {
      const payload = palettePayload();
      if (!payload) return;
      applyPaletteToProject(projectId, payload);
      const p = projects.find((x) => x.id === projectId);
      fireToast(`Applied palette to ${p?.name ?? "project"}`);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [applyPaletteToProject, projects, fireToast, result, sourceName]
  );

  const handleApply = useCallback(() => {
    if (!result) return;
    if (projects.length === 0) {
      fireToast("Create a project first");
      return;
    }
    if (activeProject) {
      doApply(activeProject.id);
      return;
    }
    setPicker({
      title: "Apply to Project",
      subtitle: "Choose the project for this palette",
      options: projects.map((p) => ({ id: p.id, label: p.name, sub: `${p.client} · ${p.type}` })),
      onPick: (id) => {
        setPicker(null);
        doApply(id);
      },
    });
  }, [result, projects, activeProject, doApply, fireToast]);

  // ── Add to Direction → associate with an existing direction ─────────────
  const doAttach = useCallback(
    (projectId: string, directionId: string) => {
      const payload = palettePayload();
      if (!payload) return;
      attachPaletteToDirection(projectId, directionId, payload);
      const p = projects.find((x) => x.id === projectId);
      fireToast(`Palette added to a direction in ${p?.name ?? "project"}`);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [attachPaletteToDirection, projects, fireToast, result, sourceName]
  );

  const resolveDirectionFor = useCallback(
    (projectId: string) => {
      const p = projects.find((x) => x.id === projectId);
      const directions = (p?.canvasObjects || []).filter((o) => o.type === "direction");
      if (directions.length === 0) {
        fireToast(`No directions in ${p?.name ?? "this project"} yet — create one on the canvas first`);
        return;
      }
      if (directions.length === 1) {
        doAttach(projectId, directions[0].id);
        return;
      }
      setPicker({
        title: "Add to Direction",
        subtitle: p?.name,
        options: directions.map((d) => ({
          id: d.id,
          label: d.content?.name ?? "Direction",
          sub: d.content?.description,
        })),
        onPick: (dirId) => {
          setPicker(null);
          doAttach(projectId, dirId);
        },
      });
    },
    [projects, doAttach, fireToast]
  );

  const handleAddToDirection = useCallback(() => {
    if (!result) return;
    if (projects.length === 0) {
      fireToast("Create a project first");
      return;
    }
    if (activeProject) {
      resolveDirectionFor(activeProject.id);
      return;
    }
    setPicker({
      title: "Add to Direction",
      subtitle: "Choose a project that has directions",
      options: projects.map((p) => ({ id: p.id, label: p.name, sub: `${p.client} · ${p.type}` })),
      onPick: (id) => {
        setPicker(null);
        resolveDirectionFor(id);
      },
    });
  }, [result, projects, activeProject, resolveDirectionFor, fireToast]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const showExploration = status === "analyzing" || (status === "success" && !!result);

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary block mb-1">
            Color Lab · Extraction
          </span>
          <h3 className="text-xl font-semibold tracking-tight text-ink flex items-center gap-2">
            <Palette size={16} className="text-ink-secondary" />
            Image → Palette
          </h3>
          <p className="mt-1 text-sm text-ink-secondary">
            Drop any reference and Opalite extracts a brand-ready palette.
          </p>
        </div>
        {status === "success" && (
          <Button variant="ghost" size="sm" onClick={reset} className="flex items-center gap-1.5">
            <X size={13} />
            <span>New image</span>
          </Button>
        )}
      </div>

      {/* Idle: drop zone */}
      {status === "idle" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragActive(false);
          }}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`rounded-xl border-2 border-dashed p-12 sm:p-16 text-center cursor-pointer transition-colors flex flex-col items-center justify-center ${
            dragActive
              ? "border-ink bg-surface-subtle"
              : "border-border-subtle bg-surface/60 hover:bg-surface-subtle/60 hover:border-border-line"
          }`}
        >
          <div className="h-12 w-12 rounded-full bg-surface border border-border-subtle flex items-center justify-center text-ink-secondary mb-4">
            <ImagePlus size={20} />
          </div>
          <p className="text-sm font-semibold text-ink">Drop a reference image</p>
          <p className="text-xs text-ink-tertiary mt-1">
            or{" "}
            <span className="text-ink font-medium underline underline-offset-2">
              browse your files
            </span>
          </p>
          <div className="mt-5 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-ink-tertiary">
            <span>JPG</span>
            <span>·</span>
            <span>PNG</span>
            <span>·</span>
            <span>WEBP</span>
          </div>
        </div>
      )}

      {/* Analyzing / Success: image + palette (one connected exploration) */}
      {showExploration && (
        <div className="rounded-xl border border-border-subtle bg-surface overflow-hidden">
          <div className="grid lg:grid-cols-2">
            {/* Left: source image */}
            <div className="p-5 flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary mb-3">
                Source
              </span>
              <div className="rounded-lg border border-border-subtle bg-surface-subtle/50 flex-1 min-h-[260px] lg:min-h-[320px] flex items-center justify-center overflow-hidden">
                {imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={sourceName}
                    className="max-w-full max-h-[380px] object-contain"
                  />
                )}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-ink-tertiary">
                <span className="truncate font-mono">{sourceName}</span>
                {dims && (
                  <span className="font-mono shrink-0">
                    {dims.w} × {dims.h}
                  </span>
                )}
              </div>
            </div>

            {/* Right: palette / analyzing */}
            <div className="p-5 border-t lg:border-t-0 lg:border-l border-border-subtle flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary">
                  Extracted Palette
                </span>
                {status === "success" && (
                  <button
                    type="button"
                    onClick={copyAll}
                    className="flex items-center gap-1 text-[11px] font-medium text-ink-tertiary hover:text-ink transition-colors"
                  >
                    <Copy size={12} />
                    <span>Copy HEX</span>
                  </button>
                )}
              </div>

              {status === "analyzing" ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                  <Loader2 className="animate-spin text-ink-secondary mb-3" size={20} />
                  <p className="text-sm font-medium text-ink">Analyzing image…</p>
                  <p className="text-xs text-ink-tertiary mt-1">
                    Extracting dominant colors and reading the visual tone.
                  </p>
                </div>
              ) : (
                result && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.colors.map((c) => (
                      <div
                        key={c.hex}
                        className="rounded-lg border border-border-subtle overflow-hidden bg-surface"
                      >
                        <div className="relative h-24" style={{ background: c.hex }}>
                          <button
                            type="button"
                            onClick={() => copyHex(c.hex)}
                            title="Copy HEX"
                            className="absolute top-2 right-2 p-1.5 rounded-md bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition-colors"
                          >
                            {copiedHex === c.hex ? (
                              <Check size={12} />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                          <span className="absolute bottom-2 left-2 font-mono text-[11px] px-1.5 py-0.5 rounded bg-black/40 text-white backdrop-blur-sm">
                            {c.hex}
                          </span>
                        </div>
                        <div className="p-2.5 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-ink truncate">{c.name}</p>
                            <p className="text-[10px] font-mono text-ink-tertiary">
                              rgb({c.r}, {c.g}, {c.b})
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-mono text-ink">{Math.round(c.percentage)}%</p>
                            <p className="text-[9px] text-ink-tertiary uppercase tracking-wider">
                              prominence
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Visual analysis */}
      {status === "success" && result && (
        <div className="rounded-xl border border-border-subtle bg-surface p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={13} className="text-ink-tertiary" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary">
              Visual Analysis
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-surface-muted text-ink-tertiary border border-border-subtle">
              AI-ready
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary mb-1">
                  Mood
                </p>
                <p className="text-sm font-medium text-ink">{result.analysis.mood}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary mb-2">
                  Keywords
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.analysis.keywords.map((k) => (
                    <span
                      key={k}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium text-ink-secondary bg-surface-subtle border border-border-subtle"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary mb-1">
                Description
              </p>
              <p className="text-sm text-ink-secondary leading-relaxed">
                {result.analysis.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {status === "success" && result && (
        <div className="flex items-center justify-end gap-2 flex-wrap">
          <Button variant="outline" size="md" onClick={handleSave} className="flex items-center gap-1.5">
            <Heart size={14} />
            <span>Save Palette</span>
          </Button>
          <Button variant="secondary" size="md" onClick={handleApply} className="flex items-center gap-1.5">
            <FolderPlus size={14} />
            <span>Apply to Project</span>
          </Button>
          <Button variant="primary" size="md" onClick={handleAddToDirection} className="flex items-center gap-1.5">
            <Layers size={14} />
            <span>Add to Direction</span>
          </Button>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="rounded-xl border border-border-subtle bg-surface/60 p-10 text-center">
          <div className="mx-auto h-11 w-11 rounded-full bg-surface-muted flex items-center justify-center text-ink-tertiary mb-3">
            <AlertTriangle size={18} />
          </div>
          <p className="text-sm font-medium text-ink">Couldn't process image</p>
          <p className="text-xs text-ink-tertiary mt-1">{error}</p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5"
            >
              <Upload size={13} />
              <span>Try another image</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={reset}>
              Start over
            </Button>
          </div>
        </div>
      )}

      {/* Generic destination picker */}
      {picker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setPicker(null)}
        >
          <div
            className="relative w-full max-w-sm bg-surface border border-border-subtle rounded-2xl shadow-lifted overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary">
                  Destination
                </span>
                <h3 className="text-sm font-semibold text-ink mt-0.5">{picker.title}</h3>
                {picker.subtitle && (
                  <p className="text-[11px] text-ink-tertiary mt-0.5">{picker.subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPicker(null)}
                className="p-1.5 rounded text-ink-tertiary hover:text-ink hover:bg-surface-subtle"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-4 space-y-1.5 max-h-64 overflow-y-auto">
              {picker.options.length === 0 ? (
                <p className="text-xs text-ink-tertiary text-center py-6">Nothing to choose yet.</p>
              ) : (
                picker.options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => picker.onPick(o.id)}
                    className="w-full p-3 rounded-xl border border-border-subtle hover:border-ink hover:bg-surface-subtle text-left flex items-center gap-3 transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-surface-muted text-ink-tertiary flex items-center justify-center shrink-0">
                      <Layers size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-ink truncate">{o.label}</div>
                      {o.sub && (
                        <div className="text-[11px] text-ink-tertiary truncate">{o.sub}</div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#191918] text-white text-xs font-medium shadow-lifted flex items-center gap-2 animate-fade-in">
          <Check size={14} className="text-white" />
          <span>{toast}</span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) processFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
