"use client";
import React from "react";
import { Sparkles } from "lucide-react";
import { BrandBrain } from "@/lib/data";

interface BrandBrainObjectProps {
  content: {
    title?: string;
    client?: string;
    brain?: BrandBrain;
  };
  onOpenBrainDrawer?: () => void;
}

export function BrandBrainObject({ content, onOpenBrainDrawer }: BrandBrainObjectProps) {
  const brain = content.brain;

  return (
    <div
      className="w-full h-full rounded-lg overflow-hidden flex flex-col"
      style={{
        border: "1px solid #D0D0CA",
        background: "#FFFFFF",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid #EBEBE7" }}
      >
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary">
            Brand Brain
          </p>
          <h3 className="text-sm font-semibold text-ink tracking-tight mt-0.5">
            {content.title ?? "Untitled Project"}
          </h3>
          {content.client && (
            <p className="text-[11px] text-ink-tertiary">{content.client}</p>
          )}
        </div>
        <Sparkles size={14} className="text-ink-tertiary" />
      </div>

      {/* Pillars */}
      <div className="flex-1 overflow-hidden px-4 py-3 flex flex-col gap-3">
        {brain?.positioning?.statement && (
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-ink-tertiary mb-0.5">
              Positioning
            </p>
            <p className="text-[11px] text-ink-secondary leading-snug line-clamp-2">
              {brain.positioning.statement}
            </p>
          </div>
        )}
        {brain?.audience?.description && (
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-ink-tertiary mb-0.5">
              Audience
            </p>
            <p className="text-[11px] text-ink-secondary leading-snug line-clamp-2">
              {brain.audience.description}
            </p>
          </div>
        )}
        {brain?.personality?.traits && (
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-ink-tertiary mb-0.5">
              Personality
            </p>
            <div className="flex flex-wrap gap-1">
              {brain.personality.traits.map((t) => (
                <span
                  key={t}
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium text-ink-secondary bg-surface-subtle border border-border-subtle"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
        {brain?.visualDirection?.shouldFeelLike && (
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-ink-tertiary mb-0.5">
              Visual Direction
            </p>
            <div className="flex flex-wrap gap-1">
              {brain.visualDirection.shouldFeelLike.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium text-ink bg-surface-muted border border-border-subtle"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      {onOpenBrainDrawer && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenBrainDrawer();
          }}
          data-no-drag="true"
          className="px-4 py-2.5 text-[11px] font-medium text-ink-secondary hover:text-ink transition-colors flex items-center gap-1.5 border-t border-border-subtle hover:bg-surface-subtle"
        >
          <Sparkles size={11} />
          Open full Brand Brain
        </button>
      )}
    </div>
  );
}
