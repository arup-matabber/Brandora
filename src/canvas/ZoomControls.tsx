"use client";
import React from "react";
import { Minus, Plus, Maximize, Archive } from "lucide-react";

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFit: () => void;
  archivedCount?: number;
  showArchived?: boolean;
  onToggleShowArchived?: () => void;
}

export function ZoomControls({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
  onFit,
  archivedCount = 0,
  showArchived = false,
  onToggleShowArchived,
}: ZoomControlsProps) {
  const pct = Math.round(scale * 100);

  return (
    <div
      className="flex items-center gap-1 rounded-lg border border-border-subtle bg-surface/90 backdrop-blur-sm shadow-card px-1.5 py-1"
      style={{ userSelect: "none" }}
    >
      <button
        type="button"
        onClick={onZoomOut}
        className="h-6 w-6 flex items-center justify-center rounded text-ink-secondary hover:text-ink hover:bg-surface-subtle transition-colors"
        title="Zoom out (Cmd -)"
      >
        <Minus size={13} />
      </button>

      <button
        type="button"
        onClick={onReset}
        className="px-2 h-6 rounded text-[11px] font-mono text-ink-secondary hover:text-ink hover:bg-surface-subtle transition-colors min-w-[46px] text-center"
        title="Reset zoom (Cmd 0)"
      >
        {pct}%
      </button>

      <button
        type="button"
        onClick={onZoomIn}
        className="h-6 w-6 flex items-center justify-center rounded text-ink-secondary hover:text-ink hover:bg-surface-subtle transition-colors"
        title="Zoom in (Cmd +)"
      >
        <Plus size={13} />
      </button>

      <div className="w-px h-4 bg-border-subtle mx-0.5" />

      <button
        type="button"
        onClick={onFit}
        className="h-6 w-6 flex items-center justify-center rounded text-ink-secondary hover:text-ink hover:bg-surface-subtle transition-colors"
        title="Fit to content (Cmd Shift H)"
      >
        <Maximize size={12} />
      </button>

      {archivedCount > 0 && onToggleShowArchived && (
        <>
          <div className="w-px h-4 bg-border-subtle mx-0.5" />
          <button
            type="button"
            onClick={onToggleShowArchived}
            className={`h-6 px-2 flex items-center gap-1.5 rounded text-[11px] font-mono transition-colors ${
              showArchived
                ? "bg-ink text-surface"
                : "text-ink-secondary hover:text-ink hover:bg-surface-subtle"
            }`}
            title={showArchived ? "Hide archived items" : `Show ${archivedCount} archived items`}
          >
            <Archive size={11} />
            <span>{archivedCount}</span>
          </button>
        </>
      )}
    </div>
  );
}
