"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, ArrowRight, Bookmark, Lightbulb } from "lucide-react";
import { ContinueWorking } from "@/components/ui/ContinueWorking";
import { useAuth } from "@/lib/auth-context";
import { useProjects } from "@/lib/projects-context";
import { NewProjectModal } from "@/components/project/NewProjectModal";

export default function HomePage() {
  const { user } = useAuth();
  const { projects, activity, library } = useProjects();
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  const activeProject = projects.length > 0 ? projects[0] : null;

  // Dynamic library counts
  const fontCount = library.filter((i) => i.type === "font").length;
  const colorCount = library.filter((i) => i.type === "color" || i.type === "palette").length;
  const referenceCount = library.filter((i) => i.type === "reference").length;
  const ideasCount = library.filter((i) => i.type === "direction").length;

  // Recent activity: compact 3 items
  const recentItems =
    activity.length > 0
      ? activity.slice(0, 3)
      : activeProject
      ? [
          {
            id: "rec-1",
            action: "Color Exploration",
            project: activeProject.name,
            timeAgo: activeProject.lastEdited || "2 hours ago",
          },
          {
            id: "rec-2",
            action: "Typography Study",
            project: activeProject.name,
            timeAgo: "Yesterday",
          },
          {
            id: "rec-3",
            action: "Moodboard Direction",
            project: activeProject.name,
            timeAgo: "2 days ago",
          },
        ]
      : [];

  return (
    <div className="space-y-10 max-w-5xl">
      {/* ── 1. Greeting & Primary Action ───────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
            Good morning, {user.name}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-ink-secondary">
            Pick up where you left off.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewProjectModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#111827] hover:bg-[#1E1B4B] text-white text-xs sm:text-sm font-medium transition-all duration-200 ease-out shadow-sm hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 active:shadow-sm self-start sm:self-auto shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2"
        >
          <Plus size={15} className="text-white" />
          <span>New Project</span>
        </button>
      </header>

      {/* ── 2. Continue Working ────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3.5 px-1">
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-ink-tertiary">
            Continue Working
          </h2>
          {activeProject && (
            <Link
              href="/projects"
              className="text-[11px] text-ink-tertiary hover:text-ink transition-colors duration-150 font-mono focus-visible:outline-none focus-visible:underline"
            >
              All projects ({projects.length}) →
            </Link>
          )}
        </div>

        {activeProject ? (
          <ContinueWorking project={activeProject} />
        ) : (
          <div className="rounded-[28px] border border-black/[0.06] bg-white p-7 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <p className="text-sm font-semibold text-ink">No projects yet.</p>
              <p className="text-xs text-ink-secondary mt-1">
                Create your first brand workspace to explore typography, color systems, and visual guidelines.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsNewProjectModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-white hover:bg-[#1E1B4B] text-xs font-medium transition-all duration-200 ease-out shadow-sm hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 active:shadow-sm self-start sm:self-auto shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2"
            >
              <Plus size={14} />
              <span>Create Project</span>
            </button>
          </div>
        )}
      </section>

      {/* ── 3. Creative Library ────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3.5 px-1">
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-ink-tertiary">
            Creative Library
          </h2>
          <Link
            href="/library"
            className="text-[11px] text-ink-tertiary hover:text-ink transition-colors duration-150 font-mono focus-visible:outline-none focus-visible:underline"
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Fonts */}
          <Link
            href="/library"
            className="group rounded-[26px] border border-black/[0.06] bg-white p-6 hover:border-black/[0.14] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-all duration-200 ease-out flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#F4F8FA] border border-black/[0.04] flex items-center justify-center font-serif text-2xl font-light text-ink shadow-sm transition-transform duration-200 ease-out group-hover:-translate-y-1">
                Aa
              </div>
              <div className="mt-5">
                <h3 className="text-base font-semibold text-ink tracking-tight">
                  Fonts
                </h3>
                <span className="inline-block mt-1 text-[11px] font-mono text-ink-secondary px-2.5 py-0.5 rounded-full bg-stone-100 border border-black/[0.03]">
                  {fontCount} saved
                </span>
              </div>
            </div>
            <div className="mt-6 pt-3 flex items-center justify-between text-xs text-ink-secondary group-hover:text-ink transition-colors duration-200">
              <span className="font-medium text-xs">Browse</span>
              <div className="w-8 h-8 rounded-full bg-stone-100 text-ink group-hover:bg-[#111827] group-hover:text-white transition-colors duration-200 ease-out flex items-center justify-center shadow-none">
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-200 ease-out" />
              </div>
            </div>
          </Link>

          {/* Card 2: Colors */}
          <Link
            href="/library"
            className="group rounded-[26px] border border-black/[0.06] bg-white p-6 hover:border-black/[0.14] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-all duration-200 ease-out flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2"
          >
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-full bg-[#F4F8FA] border border-black/[0.04] shadow-sm transition-transform duration-200 ease-out group-hover:-translate-y-1">
                <span className="h-3 w-3 rounded-full bg-[#191918] border border-black/10" />
                <span className="h-3 w-3 rounded-full bg-[#4DD4CD] border border-black/10" />
                <span className="h-3 w-3 rounded-full bg-[#2563EB] border border-black/10" />
                <span className="h-3 w-3 rounded-full bg-[#E8973A] border border-black/10" />
              </div>
              <div className="mt-5">
                <h3 className="text-base font-semibold text-ink tracking-tight">
                  Colors
                </h3>
                <span className="inline-block mt-1 text-[11px] font-mono text-ink-secondary px-2.5 py-0.5 rounded-full bg-stone-100 border border-black/[0.03]">
                  {colorCount} palettes
                </span>
              </div>
            </div>
            <div className="mt-6 pt-3 flex items-center justify-between text-xs text-ink-secondary group-hover:text-ink transition-colors duration-200">
              <span className="font-medium text-xs">Browse</span>
              <div className="w-8 h-8 rounded-full bg-stone-100 text-ink group-hover:bg-[#111827] group-hover:text-white transition-colors duration-200 ease-out flex items-center justify-center shadow-none">
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-200 ease-out" />
              </div>
            </div>
          </Link>

          {/* Card 3: References */}
          <Link
            href="/library"
            className="group rounded-[26px] border border-black/[0.06] bg-white p-6 hover:border-black/[0.14] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-all duration-200 ease-out flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#F4F8FA] border border-black/[0.04] flex items-center justify-center text-ink shadow-sm transition-transform duration-200 ease-out group-hover:-translate-y-1">
                <Bookmark size={16} />
              </div>
              <div className="mt-5">
                <h3 className="text-base font-semibold text-ink tracking-tight">
                  References
                </h3>
                <span className="inline-block mt-1 text-[11px] font-mono text-ink-secondary px-2.5 py-0.5 rounded-full bg-stone-100 border border-black/[0.03]">
                  {referenceCount} saved
                </span>
              </div>
            </div>
            <div className="mt-6 pt-3 flex items-center justify-between text-xs text-ink-secondary group-hover:text-ink transition-colors duration-200">
              <span className="font-medium text-xs">Browse</span>
              <div className="w-8 h-8 rounded-full bg-stone-100 text-ink group-hover:bg-[#111827] group-hover:text-white transition-colors duration-200 ease-out flex items-center justify-center shadow-none">
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-200 ease-out" />
              </div>
            </div>
          </Link>

          {/* Card 4: Saved Ideas */}
          <Link
            href="/library"
            className="group rounded-[26px] border border-black/[0.06] bg-white p-6 hover:border-black/[0.14] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-all duration-200 ease-out flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#F4F8FA] border border-black/[0.04] flex items-center justify-center text-ink shadow-sm transition-transform duration-200 ease-out group-hover:-translate-y-1">
                <Lightbulb size={16} />
              </div>
              <div className="mt-5">
                <h3 className="text-base font-semibold text-ink tracking-tight">
                  Saved Ideas
                </h3>
                <span className="inline-block mt-1 text-[11px] font-mono text-ink-secondary px-2.5 py-0.5 rounded-full bg-stone-100 border border-black/[0.03]">
                  {ideasCount} boards
                </span>
              </div>
            </div>
            <div className="mt-6 pt-3 flex items-center justify-between text-xs text-ink-secondary group-hover:text-ink transition-colors duration-200">
              <span className="font-medium text-xs">Browse</span>
              <div className="w-8 h-8 rounded-full bg-stone-100 text-ink group-hover:bg-[#111827] group-hover:text-white transition-colors duration-200 ease-out flex items-center justify-center shadow-none">
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-200 ease-out" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── 4. Recent (Compact secondary section in squircle container) ── */}
      <section className="pt-2">
        <div className="mb-3.5 px-1">
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-ink-tertiary">
            Recent
          </h2>
        </div>
        {recentItems.length > 0 ? (
          <div className="rounded-[26px] border border-black/[0.06] bg-white p-2.5 divide-y divide-stone-100 shadow-sm overflow-hidden">
            {recentItems.map((item) => (
              <div
                key={item.id}
                className="px-4 py-3 rounded-2xl flex items-center justify-between text-xs hover:bg-stone-50/80 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[#4DD4CD] shrink-0" />
                  <span className="font-medium text-ink truncate">
                    {item.action}
                  </span>
                  <span className="text-ink-tertiary">·</span>
                  <span className="text-ink-secondary truncate">
                    {item.project}
                  </span>
                </div>
                <span className="text-[10px] text-ink-tertiary font-mono shrink-0 ml-4 px-2.5 py-0.5 rounded-full bg-stone-100/70 border border-black/[0.03]">
                  {item.timeAgo}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[26px] border border-black/[0.06] bg-white px-6 py-4 text-xs text-ink-tertiary shadow-sm">
            No recent activity yet.
          </div>
        )}
      </section>

      {/* New Project Modal Flow */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
      />
    </div>
  );
}
