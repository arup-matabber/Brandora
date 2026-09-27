"use client";

import React, { useState } from "react";
import { Plus, Search, Layers, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProjectPreview } from "@/components/ui/ProjectPreview";
import { useProjects } from "@/lib/projects-context";
import { NewProjectModal } from "@/components/project/NewProjectModal";

export default function ProjectsPage() {
  const { projects, deleteProject } = useProjects();
  const [activeTab, setActiveTab] = useState<"All" | "Active" | "Draft">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);

  const filteredProjects = projects.filter((p) => {
    const matchesTab =
      activeTab === "All"
        ? true
        : activeTab === "Active"
        ? p.status === "Active"
        : p.status === "Draft";

    const matchesSearch =
      searchQuery.trim() === ""
        ? true
        : p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.type.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Area */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-ink-tertiary mb-1">
            <Layers size={13} />
            <span>Workspace Repository</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight text-ink">
            Projects
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            All your brand workspaces, visual identities, and studio archives in one place.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsNewProjectModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus size={14} className="text-white shrink-0" />
            <span className="text-white font-medium">New Project</span>
          </Button>
        </div>
      </header>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface-subtle border border-border-subtle w-fit">
          {(["All", "Active", "Draft"] as const).map((tab) => {
            const count =
              tab === "All"
                ? projects.length
                : projects.filter((p) => p.status === tab).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activeTab === tab
                    ? "bg-surface text-ink shadow-subtle font-semibold"
                    : "text-ink-secondary hover:text-ink"
                }`}
              >
                <span>{tab}</span>
                <span className="ml-1.5 text-[11px] text-ink-tertiary font-mono">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary"
          />
          <input
            type="text"
            placeholder="Search projects or clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs bg-surface rounded-md border border-border-subtle placeholder:text-ink-tertiary focus:border-ink focus:outline-none"
          />
        </div>
      </div>

      {/* Projects Grid or Empty States */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectPreview
              key={project.id}
              project={project}
              onDelete={(id, name) => setProjectToDelete({ id, name })}
            />
          ))}

          {/* Quick Add Project Card */}
          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="group rounded-xl border border-dashed border-border-subtle hover:border-ink/30 bg-surface/40 hover:bg-surface-subtle p-6 flex flex-col items-center justify-center min-h-[280px] transition-all text-center cursor-pointer"
          >
            <div className="h-10 w-10 rounded-full bg-surface border border-border-subtle flex items-center justify-center text-ink-tertiary group-hover:text-ink transition-colors mb-3">
              <Plus size={18} />
            </div>
            <p className="text-sm font-medium text-ink">New Brand Workspace</p>
            <p className="text-xs text-ink-tertiary mt-1 max-w-[180px]">
              Start an exploratory canvas, typography study, or identity system.
            </p>
          </button>
        </div>
      ) : projects.length === 0 ? (
        /* Zero Projects Initial State */
        <div className="rounded-xl border border-dashed border-border-subtle bg-surface/50 p-16 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-surface-muted flex items-center justify-center text-ink-tertiary mb-4">
            <Layers size={22} />
          </div>
          <h3 className="text-base font-semibold text-ink">No projects yet</h3>
          <p className="mt-1 text-xs text-ink-secondary max-w-sm mx-auto leading-relaxed">
            Your brand workspaces, identity systems, and typography studies will live here.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsNewProjectModalOpen(true)}
            className="mt-5 inline-flex items-center gap-1.5"
          >
            <Plus size={14} className="text-white" />
            <span className="text-white font-medium">Create your first project</span>
          </Button>
        </div>
      ) : (
        /* No search matches */
        <div className="rounded-xl border border-border-subtle bg-surface p-12 text-center">
          <p className="text-sm font-medium text-ink">No projects match your filter</p>
          <p className="text-xs text-ink-secondary mt-1">
            Try adjusting your search query or status filter.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setActiveTab("All");
              setSearchQuery("");
            }}
            className="mt-4"
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* 3-Step Full Flow Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-sm rounded-xl border border-border-subtle bg-surface p-6 shadow-lifted">
            <div className="flex items-center gap-2.5 text-red-600 mb-3">
              <AlertTriangle size={18} />
              <h3 className="text-sm font-semibold tracking-tight text-ink">
                Delete Project
              </h3>
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-ink">&ldquo;{projectToDelete.name}&rdquo;</span>? This will permanently remove its canvas, Brand Brain, and all exploratory materials.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setProjectToDelete(null)}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={confirmDelete}
                className="h-8 px-3 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Delete project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
