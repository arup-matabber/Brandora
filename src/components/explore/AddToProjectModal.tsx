"use client";

import React, { useState } from "react";
import { X, Check, Folder, Layout, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useProjects } from "@/lib/projects-context";
import { NormalizedInspirationItem } from "@/lib/inspiration/types";

interface AddToProjectModalProps {
  item: NormalizedInspirationItem | null;
  onClose: () => void;
  onSuccess?: (projectName: string, placedOnCanvas: boolean) => void;
  defaultPlaceOnCanvas?: boolean;
}

export function AddToProjectModal({
  item,
  onClose,
  onSuccess,
  defaultPlaceOnCanvas = false,
}: AddToProjectModalProps) {
  const { projects, addInspirationToCanvas, saveToLibrary } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || "");
  const [placeOnCanvas, setPlaceOnCanvas] = useState(defaultPlaceOnCanvas);
  const [isDone, setIsDone] = useState(false);

  if (!item) return null;

  const handleConfirm = () => {
    if (!selectedProjectId) return;
    const targetProject = projects.find((p) => p.id === selectedProjectId);
    if (!targetProject) return;

    // 1. Always save to library with project link
    saveToLibrary({
      type: item.type,
      name: item.title,
      projectIds: [targetProject.id],
      source: item.creator || item.provider,
      sourceUrl: item.sourceUrl,
      imageUrl: item.imageUrl,
      tags: item.tags,
      content: {
        title: item.title,
        source: item.creator || item.provider,
        url: item.imageUrl,
        tags: item.tags,
        metadata: item.metadata,
      },
    });

    // 2. If place on canvas requested:
    if (placeOnCanvas) {
      addInspirationToCanvas(targetProject.id, item);
    }

    setIsDone(true);
    setTimeout(() => {
      onSuccess?.(targetProject.name, placeOnCanvas);
      onClose();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-surface border border-border-subtle rounded-2xl shadow-lifted overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary">
              Workspace Destination
            </span>
            <h3 className="text-sm font-semibold text-ink mt-0.5">
              {placeOnCanvas ? "Add to Project Canvas" : "Link to Project"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-ink-tertiary hover:text-ink hover:bg-surface-subtle"
          >
            <X size={15} />
          </button>
        </div>

        {/* Project Picker List */}
        <div className="p-5 space-y-4">
          <div className="text-xs text-ink-secondary">
            Select a project for <span className="font-medium text-ink font-mono">"{item.title}"</span>:
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {projects.map((proj) => {
              const isSelected = selectedProjectId === proj.id;
              return (
                <div
                  key={proj.id}
                  onClick={() => setSelectedProjectId(proj.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? "border-ink bg-surface-subtle text-ink shadow-subtle"
                      : "border-border-subtle bg-surface hover:bg-surface-subtle/60 text-ink-secondary"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSelected ? "bg-ink text-white" : "bg-surface-muted text-ink-tertiary"
                      }`}
                    >
                      <Folder size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-ink truncate">{proj.name}</div>
                      <div className="text-[11px] text-ink-tertiary truncate">
                        {proj.client} · {proj.type}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-ink text-white flex items-center justify-center shrink-0">
                      <Check size={12} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Place directly on canvas checkbox toggle */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-subtle/60 border border-border-subtle cursor-pointer hover:bg-surface-subtle transition-colors">
            <input
              type="checkbox"
              checked={placeOnCanvas}
              onChange={(e) => setPlaceOnCanvas(e.target.checked)}
              className="mt-0.5 rounded border-border-subtle text-ink focus:ring-ink"
            />
            <div className="text-xs">
              <span className="font-medium text-ink block">Place on Canvas immediately</span>
              <span className="text-[11px] text-ink-tertiary">
                Creates a live reference, font, or color object directly on this project's canvas.
              </span>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border-subtle bg-surface-subtle/30 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            disabled={!selectedProjectId || isDone}
            className="flex items-center gap-1.5 min-w-[120px] justify-center"
          >
            {isDone ? (
              <>
                <Check size={13} />
                <span>Added!</span>
              </>
            ) : (
              <>
                <span>{placeOnCanvas ? "Add to Canvas" : "Add to Project"}</span>
                <ArrowRight size={13} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
