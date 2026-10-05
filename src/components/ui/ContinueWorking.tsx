import React from "react";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { BrandProject } from "@/lib/data";

export interface ContinueWorkingProps {
  project: BrandProject;
}

export function ContinueWorking({ project }: ContinueWorkingProps) {
  const palette = project.visualPreview?.palette || ["#191918", "#E8973A", "#4DD4CD", "#FAFAF7"];
  const monogram = project.visualPreview?.monogram || project.name.slice(0, 1).toUpperCase();

  return (
    <Link
      href={`/project/${project.id}`}
      className="group block rounded-[28px] border border-black/[0.06] bg-white p-5 sm:p-6 hover:border-black/[0.12] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] hover:-translate-y-[1px] transition-all duration-200 ease-out overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2"
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5">
        {/* Visual Preview Thumbnail */}
        <div className="sm:w-48 h-32 sm:h-28 rounded-[20px] bg-[#F4F8FA] border border-black/[0.04] p-4 flex flex-col justify-between shrink-0 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <span className="h-8 w-8 rounded-2xl bg-white border border-black/[0.06] flex items-center justify-center font-serif text-sm font-semibold text-ink shadow-sm transition-transform duration-200 ease-out group-hover:-translate-y-[1px]">
              {monogram}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary px-2 py-0.5 rounded-full bg-white/80 border border-black/[0.04]">
              Canvas
            </span>
          </div>
          {/* Palette preview dots in a soft pill tray */}
          <div className="self-start inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 border border-black/[0.04] shadow-sm transition-transform duration-200 ease-out group-hover:translate-y-[0.5px]">
            {palette.slice(0, 4).map((c, i) => (
              <span
                key={i}
                className="h-2.5 w-2.5 rounded-full border border-black/10 shrink-0"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* Project Details & Metadata */}
        <div className="flex-1 flex flex-col justify-between gap-3 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-ink truncate">
                  {project.name}
                </h3>
                <span className="shrink-0 text-[11px] font-mono text-ink-secondary px-2.5 py-0.5 rounded-full bg-stone-100 border border-black/[0.03]">
                  {project.type}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-ink-secondary truncate">
                Client: {project.client}
              </p>
            </div>

            {/* Pill Progress / Status indicator */}
            <div className="shrink-0 flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF5F8] border border-[#D0EBF2]">
              <span className="h-2 w-2 rounded-full bg-[#4DD4CD]" />
              <span className="text-xs font-mono font-medium text-ink">
                78%
              </span>
            </div>
          </div>

          {/* Bottom Bar with capsule progress track and circular action */}
          <div className="pt-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-28 sm:w-36 h-2 rounded-full bg-stone-100 overflow-hidden">
                <div className="h-full rounded-full bg-[#4DD4CD] w-[78%]" />
              </div>
              <span className="text-ink-tertiary font-mono text-[11px] flex items-center gap-1.5">
                <Clock size={12} className="text-ink-tertiary" />
                <span>{project.lastEdited}</span>
              </span>
            </div>

            {/* Circular action button matching the reference design */}
            <div className="w-10 h-10 rounded-full bg-[#111827] text-white flex items-center justify-center group-hover:bg-[#1E1B4B] transition-colors duration-200 ease-out shadow-sm shrink-0">
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-200 ease-out" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
