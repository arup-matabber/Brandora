"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Upload,
  FileText,
  Check,
  Trash2,
  Sparkles,
  RefreshCw,
  Edit2,
  Plus,
  Cloud,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useProjects } from "@/lib/projects-context";
import { useAuth } from "@/lib/auth-context";
import { uploadProjectMaterial } from "@/services/projectMaterials";
import {
  BrandBrain,
  UploadedMaterial,
  generateMockBrandBrain,
} from "@/lib/data";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { clients, createClient, createProject } = useProjects();

  // Wizard step: 1 (Basics) | 2 (Material) | 3 (Brain)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Basics
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientInput, setNewClientInput] = useState("");
  const [type, setType] = useState("Brand Identity");
  const [description, setDescription] = useState("");

  // Step 2: Material
  const [activeMaterialTab, setActiveMaterialTab] = useState<"files" | "notes">("files");
  const [materials, setMaterials] = useState<UploadedMaterial[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState("");
  const [isDriveConnected, setIsDriveConnected] = useState(false);

  // Step 3: Brand Brain
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState<string>("Reading your material...");
  const [brandBrain, setBrandBrain] = useState<BrandBrain | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track previous isOpen state so we ONLY reset when modal opens (false -> true)
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setStep(1);
      setName("");
      setClientName(clients.length > 0 ? clients[0].name : "");
      setIsCreatingClient(clients.length === 0);
      setNewClientInput("");
      setType("Brand Identity");
      setDescription("");
      setMaterials([]);
      setNotes("");
      setIsDriveConnected(false);
      setIsAnalyzing(false);
      setBrandBrain(null);
      setEditingSection(null);
      setIsSubmitting(false);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  if (!isOpen) return null;

  // Step navigation
  const handleNextFromStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // If custom client entered
    const finalClient = isCreatingClient
      ? newClientInput.trim() || "Independent"
      : clientName || "Independent";

    if (isCreatingClient && newClientInput.trim()) {
      const alreadyExists = clients.some(
        (c) => c.name.toLowerCase() === newClientInput.trim().toLowerCase()
      );
      if (!alreadyExists) {
        createClient({ name: newClientInput.trim() });
      }
    }
    setClientName(finalClient);
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    setStep(3);
    setIsAnalyzing(true);
    setAnalysisPhase("Reading your material...");

    // Simulated AI understanding timeline
    setTimeout(() => {
      setAnalysisPhase("Finding key ideas & positioning...");
    }, 600);

    setTimeout(() => {
      setAnalysisPhase("Structuring brand identity brief...");
    }, 1200);

    setTimeout(() => {
      const generated = generateMockBrandBrain(name, type, clientName, notes);
      setBrandBrain(generated);
      setIsAnalyzing(false);
    }, 1700);
  };

  // Add dummy or user-selected file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setPendingFiles((prev) => [...prev, ...fileList]);

    const newItems: UploadedMaterial[] = fileList.map((f) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      type: f.name.split(".").pop()?.toUpperCase() || "FILE",
    }));

    setMaterials((prev) => [...prev, ...newItems]);
  };

  const handleAddSampleFile = () => {
    const sampleFiles = [
      { name: `${name || "Brand"}_Brief_2026.pdf`, size: "2.4 MB", type: "PDF" },
      { name: "Brand_Strategy_Draft.docx", size: "1.1 MB", type: "DOCX" },
      { name: "Moodboard_References.pptx", size: "6.8 MB", type: "PPTX" },
    ];
    const pick = sampleFiles[materials.length % sampleFiles.length];
    setMaterials((prev) => [
      ...prev,
      {
        id: `sample-${Date.now()}`,
        name: pick.name,
        size: pick.size,
        type: pick.type,
      },
    ]);
  };

  const removeMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const handleRegenerateBrain = () => {
    setIsAnalyzing(true);
    setAnalysisPhase("Re-evaluating creative parameters...");
    setTimeout(() => {
      const regenerated = generateMockBrandBrain(name, type, clientName, notes);
      setBrandBrain(regenerated);
      setIsAnalyzing(false);
    }, 800);
  };

  const handleFinalCreateProject = () => {
    if (!brandBrain || isSubmitting) return;
    setIsSubmitting(true);

    const newProject = createProject({
      name,
      client: clientName,
      type,
      description,
      notes,
      materials,
      brandBrain,
    });

    // Upload real files to Firebase Storage in background
    if (pendingFiles.length > 0) {
      pendingFiles.forEach((file) => {
        uploadProjectMaterial(newProject.id, file, user.uid || "designer-1").catch((err) => {
          console.warn("Storage upload error (fallback mode):", err);
        });
      });
    }

    onClose();
    router.push(`/project/${newProject.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px] p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-border-subtle bg-surface shadow-lifted overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full transition-colors ${
                  step >= 1 ? "bg-ink" : "bg-border-line"
                }`}
              />
              <span
                className={`h-2 w-2 rounded-full transition-colors ${
                  step >= 2 ? "bg-ink" : "bg-border-line"
                }`}
              />
              <span
                className={`h-2 w-2 rounded-full transition-colors ${
                  step >= 3 ? "bg-ink" : "bg-border-line"
                }`}
              />
            </div>
            <span className="text-xs font-mono uppercase tracking-wider text-ink-tertiary">
              Step {step} of 3 —{" "}
              {step === 1 ? "Project Basics" : step === 2 ? "Brand Material" : "Brand Brain"}
            </span>
          </div>

          <button
            onClick={onClose}
            className="rounded p-1 text-ink-tertiary hover:bg-surface-subtle hover:text-ink transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
          {/* ============================================================ */}
          {/* STEP 1: PROJECT BASICS */}
          {/* ============================================================ */}
          {step === 1 && (
            <form onSubmit={handleNextFromStep1} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-ink">
                  Project Basics
                </h2>
                <p className="mt-1 text-xs text-ink-secondary">
                  Essential details to frame your new brand workspace.
                </p>
              </div>

              {/* Project Name */}
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5 tracking-tight">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Orblinn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  className="h-10 text-sm"
                />
              </div>

              {/* Client Selection / Inline Creation */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-ink-secondary tracking-tight">
                    Client
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingClient(!isCreatingClient)}
                    className="text-xs font-medium text-ink hover:underline inline-flex items-center gap-1"
                  >
                    {isCreatingClient ? "Select existing client" : "+ Create new client"}
                  </button>
                </div>

                {isCreatingClient ? (
                  <Input
                    placeholder="Enter new client name (e.g. Orblinn Nordic Living)"
                    value={newClientInput}
                    onChange={(e) => setNewClientInput(e.target.value)}
                    required
                    className="h-10 text-sm"
                  />
                ) : (
                  <select
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full h-10 rounded-md border border-border-subtle bg-surface px-3 text-sm text-ink focus:border-ink focus:outline-none"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="">No client assigned</option>
                  </select>
                )}
              </div>

              {/* Project Type */}
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5 tracking-tight">
                  Project Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    "Brand Identity",
                    "Rebrand",
                    "Logo",
                    "Packaging",
                    "Visual Identity",
                    "Other",
                  ].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`h-9 px-3 rounded-md text-xs font-medium border text-left transition-all flex items-center justify-between ${
                        type === t
                          ? "bg-surface-muted text-ink border-ink font-semibold"
                          : "bg-surface text-ink-secondary border-border-subtle hover:border-border-line hover:text-ink"
                      }`}
                    >
                      <span>{t}</span>
                      {type === t && <Check size={13} className="text-ink" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Description */}
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5 tracking-tight">
                  Project Description <span className="text-ink-tertiary font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Short brief or studio objective..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-border-subtle bg-surface p-3 text-xs text-ink placeholder:text-ink-tertiary focus:border-ink focus:outline-none resize-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border-subtle">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!name.trim()}
                  className="flex items-center gap-1.5"
                >
                  <span>Continue</span>
                  <ArrowRight size={14} />
                </Button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* STEP 2: BRAND MATERIAL */}
          {/* ============================================================ */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-ink">
                  Bring in what you already know.
                </h2>
                <p className="mt-1 text-xs text-ink-secondary">
                  Give Opalite the raw material it needs to understand the brand. Upload documents or paste your notes.
                </p>
              </div>

              {/* Material Method Tabs */}
              <div className="flex items-center justify-between border-b border-border-subtle">
                <div className="flex items-center gap-4 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setActiveMaterialTab("files")}
                    className={`pb-2 transition-colors border-b-2 -mb-px ${
                      activeMaterialTab === "files"
                        ? "border-ink text-ink font-semibold"
                        : "border-transparent text-ink-secondary hover:text-ink"
                    }`}
                  >
                    Upload Files ({materials.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMaterialTab("notes")}
                    className={`pb-2 transition-colors border-b-2 -mb-px ${
                      activeMaterialTab === "notes"
                        ? "border-ink text-ink font-semibold"
                        : "border-transparent text-ink-secondary hover:text-ink"
                    }`}
                  >
                    Paste Notes {notes.trim() ? "•" : ""}
                  </button>
                </div>

                {/* Optional Google Drive */}
                <button
                  type="button"
                  onClick={() => setIsDriveConnected(!isDriveConnected)}
                  className={`text-[11px] px-2.5 py-1 rounded border inline-flex items-center gap-1.5 transition-colors ${
                    isDriveConnected
                      ? "bg-surface-muted text-ink border-border-subtle"
                      : "text-ink-secondary border-dashed border-border-subtle hover:text-ink hover:border-border-line"
                  }`}
                >
                  <Cloud size={12} />
                  <span>{isDriveConnected ? "Drive Connected ✓" : "Connect Google Drive"}</span>
                </button>
              </div>

              {/* Upload Files Tab */}
              {activeMaterialTab === "files" && (
                <div className="space-y-4">
                  <div className="relative rounded-xl border border-dashed border-border-subtle hover:border-ink/40 p-6 text-center transition-colors bg-surface-subtle/30">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.docx,.pptx,.txt,image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="mx-auto h-9 w-9 rounded-full bg-surface-muted flex items-center justify-center text-ink-tertiary mb-2">
                      <Upload size={16} />
                    </div>
                    <p className="text-xs font-medium text-ink">
                      Drop files here, or <span className="underline">browse</span>
                    </p>
                    <p className="text-[11px] text-ink-tertiary mt-1">
                      PDF, DOCX, PPTX, TXT, and Images
                    </p>
                  </div>

                  {/* Sample file adder helper */}
                  <div className="flex items-center justify-between text-[11px] text-ink-tertiary">
                    <span>Add sample project brief:</span>
                    <button
                      type="button"
                      onClick={handleAddSampleFile}
                      className="text-xs text-ink hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <Plus size={11} />
                      <span>Add demo brief</span>
                    </button>
                  </div>

                  {/* Uploaded Material Previews */}
                  {materials.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <p className="text-xs font-mono uppercase tracking-wider text-ink-tertiary">
                        Material Preview ({materials.length})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {materials.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between p-2.5 rounded-lg border border-border-subtle bg-surface text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText size={14} className="text-ink-secondary shrink-0" />
                              <div className="min-w-0">
                                <p className="truncate font-medium text-ink">{m.name}</p>
                                <p className="text-[10px] text-ink-tertiary">
                                  {m.size} • <span className="text-green-700">✓ Added</span>
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeMaterial(m.id)}
                              className="text-ink-tertiary hover:text-ink p-1 rounded hover:bg-surface-subtle"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Paste Notes Tab */}
              {activeMaterialTab === "notes" && (
                <div>
                  <textarea
                    rows={6}
                    placeholder="Paste client notes, interview transcripts, research snippets, or core ideas..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-md border border-border-subtle bg-surface p-3 text-xs text-ink placeholder:text-ink-tertiary focus:border-ink focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-ink-tertiary">
                    Opalite will extract audience needs, positioning cues, and personality traits.
                  </p>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleNextFromStep2}
                  >
                    Skip for now
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleNextFromStep2}
                    className="flex items-center gap-1.5"
                  >
                    <span>Continue</span>
                    <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: BRAND BRAIN */}
          {/* ============================================================ */}
          {step === 3 && (
            <div>
              {/* Animated Analysis State */}
              {isAnalyzing && (
                <div className="py-16 text-center space-y-4">
                  <div className="mx-auto h-12 w-12 rounded-full bg-surface-muted flex items-center justify-center text-ink animate-pulse">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-ink">
                      Understanding the brand...
                    </h3>
                    <p className="mt-1 text-xs text-ink-secondary font-mono">
                      {analysisPhase}
                    </p>
                  </div>
                  <div className="mx-auto w-48 h-1 rounded-full bg-surface-muted overflow-hidden">
                    <div className="h-full bg-ink animate-indeterminate" />
                  </div>
                </div>
              )}

              {/* Generated Brand Brain Review */}
              {!isAnalyzing && brandBrain && (
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight text-ink">
                        Brand Brain Preview
                      </h2>
                      <p className="mt-1 text-xs text-ink-secondary">
                        Review and edit the core identity pillars before entering your canvas.
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateBrain}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <RefreshCw size={12} />
                      <span>Regenerate</span>
                    </Button>
                  </div>

                  {/* Pillars Container */}
                  <div className="space-y-4">
                    {/* 1. BRAND STORY */}
                    <div className="rounded-xl border border-border-subtle bg-surface p-4 text-xs space-y-2">
                      <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">
                          Brand Story & Mission
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingSection(editingSection === "story" ? null : "story")
                          }
                          className="text-[11px] text-ink-secondary hover:text-ink font-medium inline-flex items-center gap-1"
                        >
                          <Edit2 size={11} />
                          <span>{editingSection === "story" ? "Done" : "Edit"}</span>
                        </button>
                      </div>

                      {editingSection === "story" ? (
                        <div className="space-y-2 pt-1">
                          <textarea
                            rows={3}
                            value={brandBrain.story?.overview || ""}
                            onChange={(e) =>
                              setBrandBrain({
                                ...brandBrain,
                                story: { ...(brandBrain.story || {}), overview: e.target.value },
                              })
                            }
                            className="w-full rounded border border-border-subtle p-2 text-xs focus:border-ink focus:outline-none"
                          />
                        </div>
                      ) : (
                        <div className="pt-1 space-y-1">
                          <p className="text-ink leading-relaxed font-medium">
                            {brandBrain.story?.overview || ""}
                          </p>
                          <p className="text-ink-secondary">
                            <span className="font-semibold text-ink">Core Idea: </span>
                            {brandBrain.story?.coreIdea || ""}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 2. AUDIENCE */}
                    <div className="rounded-xl border border-border-subtle bg-surface p-4 text-xs space-y-2">
                      <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">
                          Audience
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingSection(editingSection === "audience" ? null : "audience")
                          }
                          className="text-[11px] text-ink-secondary hover:text-ink font-medium inline-flex items-center gap-1"
                        >
                          <Edit2 size={11} />
                          <span>{editingSection === "audience" ? "Done" : "Edit"}</span>
                        </button>
                      </div>

                      {editingSection === "audience" ? (
                        <textarea
                          rows={3}
                          value={brandBrain.audience?.description || ""}
                          onChange={(e) =>
                            setBrandBrain({
                              ...brandBrain,
                              audience: { ...(brandBrain.audience || {}), description: e.target.value },
                            })
                          }
                          className="w-full rounded border border-border-subtle p-2 text-xs focus:border-ink focus:outline-none"
                        />
                      ) : (
                        <div className="pt-1 space-y-1">
                          <p className="text-ink font-medium leading-relaxed">
                            {brandBrain.audience?.description || ""}
                          </p>
                          <p className="text-ink-secondary">
                            <span className="font-semibold text-ink">Needs: </span>
                            {brandBrain.audience?.needs || ""}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 3. POSITIONING */}
                    <div className="rounded-xl border border-border-subtle bg-surface p-4 text-xs space-y-2">
                      <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">
                          Positioning
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingSection(editingSection === "positioning" ? null : "positioning")
                          }
                          className="text-[11px] text-ink-secondary hover:text-ink font-medium inline-flex items-center gap-1"
                        >
                          <Edit2 size={11} />
                          <span>{editingSection === "positioning" ? "Done" : "Edit"}</span>
                        </button>
                      </div>

                      {editingSection === "positioning" ? (
                        <textarea
                          rows={3}
                          value={brandBrain.positioning?.statement || ""}
                          onChange={(e) =>
                            setBrandBrain({
                              ...brandBrain,
                              positioning: {
                                ...(brandBrain.positioning || {}),
                                statement: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded border border-border-subtle p-2 text-xs focus:border-ink focus:outline-none"
                        />
                      ) : (
                        <div className="pt-1 space-y-1">
                          <p className="text-ink font-medium leading-relaxed">
                            {brandBrain.positioning?.statement || ""}
                          </p>
                          <p className="text-ink-secondary">
                            <span className="font-semibold text-ink">Differentiator: </span>
                            {brandBrain.positioning?.differentiator || ""}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 4. PERSONALITY */}
                    <div className="rounded-xl border border-border-subtle bg-surface p-4 text-xs space-y-2">
                      <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">
                          Personality & Voice
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingSection(editingSection === "personality" ? null : "personality")
                          }
                          className="text-[11px] text-ink-secondary hover:text-ink font-medium inline-flex items-center gap-1"
                        >
                          <Edit2 size={11} />
                          <span>{editingSection === "personality" ? "Done" : "Edit"}</span>
                        </button>
                      </div>

                      <div className="pt-1 flex flex-wrap gap-1.5">
                        {(brandBrain.personality?.traits || []).map((trait, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded bg-surface-muted text-ink font-medium text-xs border border-border-subtle"
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                      <p className="text-ink-secondary text-[11px] pt-1">
                        Voice: {brandBrain.personality?.voice || "Confident & Measured"}
                      </p>
                    </div>

                    {/* 5. VISUAL DIRECTION */}
                    <div className="rounded-xl border border-border-subtle bg-surface p-4 text-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">
                          Visual Direction
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingSection(editingSection === "visual" ? null : "visual")
                          }
                          className="text-[11px] text-ink-secondary hover:text-ink font-medium inline-flex items-center gap-1"
                        >
                          <Edit2 size={11} />
                          <span>{editingSection === "visual" ? "Done" : "Edit"}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-ink-tertiary mb-1.5 font-semibold">
                            Should Feel Like
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {(brandBrain.visualDirection?.shouldFeelLike || []).map((item, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded bg-surface-subtle text-ink font-medium text-[11px] border border-border-subtle"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-ink-tertiary mb-1.5 font-semibold">
                            Should Not Feel Like
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {(brandBrain.visualDirection?.shouldNotFeelLike || []).map((item, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded bg-surface-subtle text-ink-tertiary line-through text-[11px] border border-border-subtle"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Confirmation Bar */}
                  <div className="rounded-xl bg-surface-subtle border border-border-subtle p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-ink">
                        Does this look right?
                      </p>
                      <p className="text-[11px] text-ink-secondary">
                        You can always change this later on your canvas.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSection("story")}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={isSubmitting}
                        onClick={handleFinalCreateProject}
                        className="flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 size={13} className="text-white" />
                        <span className="text-white">{isSubmitting ? "Creating..." : "Looks good — Create"}</span>
                      </Button>
                    </div>
                  </div>

                  {/* Back Navigation */}
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep(2)}
                      className="flex items-center gap-1"
                    >
                      <ArrowLeft size={13} />
                      <span>Back to Material</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
