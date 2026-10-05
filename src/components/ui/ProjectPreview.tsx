import React from "react";
import Link from "next/link";
import { BrandProject } from "@/lib/data";
import { ArrowUpRight, Trash2 } from "lucide-react";

export interface ProjectPreviewProps {
  project: BrandProject;
  onClick?: () => void;
  onDelete?: (id: string, name: string) => void;
}

export function ProjectPreview({ project, onClick, onDelete }: ProjectPreviewProps) {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(project.id, project.name);
    }
  };

  const visualPreview = project.visualPreview || {
    monogram: (project.name || "OP").slice(0, 2).toUpperCase(),
    fontSpecimen: "Satoshi",
    secondaryFont: "Inter",
    palette: ["#191918", "#EBEBE7", "#F7F7F5"],
    gridAccent: "#191918",
  };
  const monogram = visualPreview.monogram || (project.name || "OP").slice(0, 2).toUpperCase();
  const fontSpecimen = visualPreview.fontSpecimen || "Satoshi";
  const secondaryFont = visualPreview.secondaryFont || "Inter";
  const palette = Array.isArray(visualPreview.palette) && visualPreview.palette.length > 0
    ? visualPreview.palette
    : ["#191918", "#EBEBE7", "#F7F7F5"];

  return (
    <div className="group relative rounded-xl border border-border-subtle bg-surface p-4 transition-all duration-200 hover:border-border-line hover:shadow-card flex flex-col justify-between">
      <Link
        href={`/project/${project.id}`}
        onClick={onClick}
        className="block cursor-pointer"
      >
        {/* Visual Composition / Thumbnail */}
        <div className="relative aspect-[16/10] w-full rounded-lg bg-surface-subtle p-5 border border-border-subtle flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-ink-tertiary uppercase tracking-wider">
              {project.status}
            </span>
            <span className="font-serif text-lg text-ink font-light">
              {monogram}
            </span>
          </div>

          <div className="py-2">
            <p className="text-xl font-medium tracking-tight text-ink">
              {fontSpecimen}
            </p>
            <p className="text-[11px] text-ink-secondary mt-0.5 font-mono">
              {secondaryFont}
            </p>
          </div>

          <div className="flex items-center gap-1.5 pt-2 border-t border-border-subtle/70">
            {palette.map((c, i) => (
              <span
                key={i}
                style={{ backgroundColor: c }}
                className="h-2.5 w-6 rounded-sm border border-black/10"
              />
            ))}
          </div>
        </div>

        {/* Meta info */}
        <div className="mt-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold tracking-tight text-ink group-hover:underline underline-offset-2">
                {project.name}
              </h4>
              <span className="text-[11px] text-ink-tertiary">•</span>
              <span className="text-xs text-ink-secondary">{project.type}</span>
            </div>
            <p className="mt-0.5 text-xs text-ink-tertiary">
              {project.client} • {project.lastEdited}
            </p>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight size={14} className="text-ink" />
          </div>
        </div>
      </Link>

      {/* Delete button (quiet hover action) */}
      {onDelete && (
        <button
          type="button"
          onClick={handleDeleteClick}
          title={`Delete ${project.name}`}
          className="absolute top-6 right-6 z-20 opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-surface/90 hover:bg-red-50 text-ink-tertiary hover:text-red-600 border border-border-subtle hover:border-red-200 transition-all shadow-subtle cursor-pointer"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}
