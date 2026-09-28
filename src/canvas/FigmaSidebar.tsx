"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Type,
  Layout,
  Droplets,
  Layers,
  StickyNote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Lock,
  Unlock,
  Copy,
  Plus,
  ChevronRight,
  ChevronDown,
  Sliders,
  Sparkles,
  Maximize2,
  FolderPlus,
  BookOpen,
  Image as ImageIcon,
  Check,
  PanelRightClose,
  PanelRightOpen,
  Move,
  RotateCw,
  Hash,
  Square,
  Smartphone,
  Monitor,
  Eye,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { ColorPicker } from "./ColorPicker";
import { CURATED_FONTS } from "./objects/FontObject";
import { GoogleFontPicker } from "@/components/typography/GoogleFontPicker";
import type { CanvasItem, CanvasObjectType, BrandBrain } from "@/lib/data";

// ── Curated Palettes & Presets ───────────────────────────────────────────────

const STICKY_COLORS = [
  { bg: "#FEF3C7", border: "#FDE68A", label: "Honey" },
  { bg: "#FCE7F3", border: "#FBCFE8", label: "Rose" },
  { bg: "#D1FAE5", border: "#A7F3D0", label: "Mint" },
  { bg: "#DBEAFE", border: "#BFDBFE", label: "Sky" },
  { bg: "#EDE9FE", border: "#DDD6FE", label: "Lavender" },
  { bg: "#F3F3F0", border: "#E5E5E0", label: "Paper" },
];

const FRAME_PRESETS = [
  { name: "Desktop", w: 1440, h: 900, icon: Monitor },
  { name: "Mobile", w: 390, h: 844, icon: Smartphone },
  { name: "Square", w: 1080, h: 1080, icon: Square },
  { name: "Section", w: 500, h: 360, icon: Layout },
];

const HARMONY_PALETTES = [
  {
    name: "Opalite Signature",
    colors: [
      { hex: "#191918", label: "Ink Black" },
      { hex: "#1E1B4B", label: "Twilight" },
      { hex: "#4DD4CD", label: "Cyan Accent" },
      { hex: "#EAF5F8", label: "Azure Mist" },
      { hex: "#FBFBFA", label: "Paper" },
    ],
  },
  {
    name: "Minimal Monochrome",
    colors: [
      { hex: "#191918", label: "Primary" },
      { hex: "#4A4A45", label: "Secondary" },
      { hex: "#9E9E98", label: "Tertiary" },
      { hex: "#EBEBE7", label: "Border" },
      { hex: "#FBFBFA", label: "Paper" },
    ],
  },
  {
    name: "Warm Editorial",
    colors: [
      { hex: "#231F20", label: "Ink" },
      { hex: "#B5451B", label: "Terracotta" },
      { hex: "#E8973A", label: "Ochre" },
      { hex: "#EAE6DF", label: "Sand" },
      { hex: "#FAFAF7", label: "Cream" },
    ],
  },
  {
    name: "Forest & Stone",
    colors: [
      { hex: "#1C2826", label: "Pine" },
      { hex: "#4C8B5D", label: "Sage" },
      { hex: "#8DAA9D", label: "Eucalyptus" },
      { hex: "#D8E2DC", label: "Mist" },
      { hex: "#F9F9F8", label: "Base" },
    ],
  },
  {
    name: "Deep Indigo",
    colors: [
      { hex: "#0F172A", label: "Midnight" },
      { hex: "#2563EB", label: "Cobalt" },
      { hex: "#60A5FA", label: "Sky" },
      { hex: "#E2E8F0", label: "Ice" },
      { hex: "#FFFFFF", label: "White" },
    ],
  },
];

const PRESET_SWATCHES = [
  "#191918", "#3A3A36", "#5A5A55", "#8F8E88", "#BCBCB6", "#E8E7E2", "#FBFBFA", "#FFFFFF",
  "#B5451B", "#D4672A", "#E8973A", "#F2C744", "#4C8B5D", "#2E7D6E", "#2563EB", "#6D28D9",
];

// ── Props ───────────────────────────────────────────────────────────────────

export interface FigmaSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  items: CanvasItem[];
  selectedIds: Set<string>;
  onSelectId: (id: string, additive?: boolean) => void;
  onDeselectAll: () => void;
  onUpdateItem: (id: string, patch: Partial<CanvasItem>, recordHistory?: boolean) => void;
  onRemoveItem: (id: string) => void;
  onRemoveSelected: () => void;
  onDuplicateSelected: () => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onAddItem: (type: CanvasObjectType, content?: Record<string, any>, size?: { w: number; h: number }) => void;
  onSaveToLibrary?: (item: CanvasItem) => void;
  projectName?: string;
  projectBrain?: BrandBrain;
  zoom?: number;
  onResetZoom?: () => void;
}

export function FigmaSidebar({
  isOpen,
  onToggle,
  items,
  selectedIds,
  onSelectId,
  onDeselectAll,
  onUpdateItem,
  onRemoveItem,
  onRemoveSelected,
  onDuplicateSelected,
  onBringToFront,
  onSendToBack,
  onAddItem,
  onSaveToLibrary,
  projectName,
  projectBrain,
  zoom = 1,
  onResetZoom,
}: FigmaSidebarProps) {
  // Sidebar tab: "design" (properties), "insert" (add items), "layers" (item tree)
  const [activeTab, setActiveTab] = useState<"design" | "insert" | "layers">("design");

  // Keep track of active color picker popovers in sidebar
  const [activePicker, setActivePicker] = useState<string | null>(null);

  // When selection changes to non-empty, automatically focus design tab
  useEffect(() => {
    if (selectedIds.size > 0 && activeTab === "insert") {
      setActiveTab("design");
    }
  }, [selectedIds.size]);

  // Selected item (if exactly one selected)
  const selectedItem = items.find((i) => selectedIds.has(i.id));
  const isMultiSelect = selectedIds.size > 1;

  if (!isOpen) {
    return (
      <div
        className="shrink-0 flex flex-col items-center py-3 bg-surface border-l border-border-subtle"
        style={{ width: 44, zIndex: 30 }}
      >
        <button
          type="button"
          onClick={onToggle}
          title="Open Design Panel (Figma Sidebar)"
          className="p-2 rounded-lg text-ink-secondary hover:text-ink hover:bg-surface-subtle transition-colors"
        >
          <PanelRightOpen size={16} />
        </button>
        <div className="mt-4 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => {
              onToggle();
              setActiveTab("design");
            }}
            title="Design Properties"
            className={`p-2 rounded-lg text-xs transition-colors ${
              activeTab === "design" ? "text-ink bg-surface-subtle" : "text-ink-tertiary hover:text-ink"
            }`}
          >
            <Sliders size={15} />
          </button>
          <button
            type="button"
            onClick={() => {
              onToggle();
              setActiveTab("insert");
            }}
            title="Insert Frame, Swatches, Text..."
            className={`p-2 rounded-lg text-xs transition-colors ${
              activeTab === "insert" ? "text-ink bg-surface-subtle" : "text-ink-tertiary hover:text-ink"
            }`}
          >
            <Plus size={15} />
          </button>
          <button
            type="button"
            onClick={() => {
              onToggle();
              setActiveTab("layers");
            }}
            title="Layers"
            className={`p-2 rounded-lg text-xs transition-colors ${
              activeTab === "layers" ? "text-ink bg-surface-subtle" : "text-ink-tertiary hover:text-ink"
            }`}
          >
            <Layers size={15} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside
      data-no-drag="true"
      className="shrink-0 h-full bg-surface border-l border-border-subtle flex flex-col select-none overflow-hidden"
      style={{
        width: 280,
        zIndex: 35,
        boxShadow: "-1px 0 0 #EBEBE7",
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* ── Header with Tabs & Close ──────────────────────────────────── */}
      <div className="shrink-0 h-11 px-2.5 border-b border-border-subtle flex items-center justify-between bg-surface">
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface-subtle border border-border-subtle/60 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("design")}
            className={`px-2.5 py-1 rounded font-medium transition-all ${
              activeTab === "design"
                ? "bg-surface text-ink shadow-subtle"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            Design
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("insert")}
            className={`px-2.5 py-1 rounded font-medium transition-all flex items-center gap-1 ${
              activeTab === "insert"
                ? "bg-surface text-ink shadow-subtle"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            <Plus size={12} />
            <span>Insert</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("layers")}
            className={`px-2.5 py-1 rounded font-medium transition-all flex items-center gap-1 ${
              activeTab === "layers"
                ? "bg-surface text-ink shadow-subtle"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            <span>Layers</span>
            {items.length > 0 && (
              <span className="text-[10px] text-ink-tertiary font-mono">
                {items.length}
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={onToggle}
          title="Collapse Panel"
          className="p-1.5 rounded-md text-ink-tertiary hover:text-ink hover:bg-surface-subtle transition-colors"
        >
          <PanelRightClose size={15} />
        </button>
      </div>

      {/* ── Tab Contents ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-border-subtle">
        {activeTab === "design" && (
          <DesignTab
            selectedItem={selectedItem}
            isMultiSelect={isMultiSelect}
            selectedCount={selectedIds.size}
            items={items}
            onUpdateItem={onUpdateItem}
            onRemoveItem={onRemoveItem}
            onRemoveSelected={onRemoveSelected}
            onDuplicateSelected={onDuplicateSelected}
            onBringToFront={onBringToFront}
            onSendToBack={onSendToBack}
            onSaveToLibrary={onSaveToLibrary}
            activePicker={activePicker}
            setActivePicker={setActivePicker}
            onSwitchToInsert={() => setActiveTab("insert")}
            zoom={zoom}
            onResetZoom={onResetZoom}
            onAddItem={onAddItem}
          />
        )}

        {activeTab === "insert" && (
          <InsertTab
            onAddItem={onAddItem}
            projectName={projectName}
            projectBrain={projectBrain}
          />
        )}

        {activeTab === "layers" && (
          <LayersTab
            items={items}
            selectedIds={selectedIds}
            onSelectId={onSelectId}
            onRemoveItem={onRemoveItem}
            onUpdateItem={onUpdateItem}
          />
        )}
      </div>
    </aside>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. DESIGN / PROPERTIES TAB
// ═════════════════════════════════════════════════════════════════════════════

interface DesignTabProps {
  selectedItem?: CanvasItem;
  isMultiSelect: boolean;
  selectedCount: number;
  items: CanvasItem[];
  onUpdateItem: (id: string, patch: Partial<CanvasItem>, recordHistory?: boolean) => void;
  onRemoveItem: (id: string) => void;
  onRemoveSelected: () => void;
  onDuplicateSelected: () => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onSaveToLibrary?: (item: CanvasItem) => void;
  activePicker: string | null;
  setActivePicker: (id: string | null) => void;
  onSwitchToInsert: () => void;
  zoom: number;
  onResetZoom?: () => void;
  onAddItem: (type: CanvasObjectType, content?: Record<string, any>, size?: { w: number; h: number }) => void;
}

function DesignTab({
  selectedItem,
  isMultiSelect,
  selectedCount,
  items,
  onUpdateItem,
  onRemoveItem,
  onRemoveSelected,
  onDuplicateSelected,
  onBringToFront,
  onSendToBack,
  onSaveToLibrary,
  activePicker,
  setActivePicker,
  onSwitchToInsert,
  zoom,
  onResetZoom,
  onAddItem,
}: DesignTabProps) {
  // If multiple items selected
  if (isMultiSelect) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-ink">
            {selectedCount} objects selected
          </span>
          <button
            type="button"
            onClick={onRemoveSelected}
            className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
            title="Delete Selected"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDuplicateSelected}
            className="flex-1 py-1.5 px-3 rounded-lg border border-border-subtle bg-surface hover:bg-surface-subtle text-xs font-medium text-ink flex items-center justify-center gap-1.5"
          >
            <Copy size={13} />
            <span>Duplicate All</span>
          </button>
        </div>
      </div>
    );
  }

  // If no item is selected -> Canvas Overview & Quick Insert
  if (!selectedItem) {
    return (
      <div className="p-4 space-y-5">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-ink-tertiary">
              Canvas
            </span>
            <span className="text-[11px] font-mono text-ink-secondary">
              {Math.round(zoom * 100)}%
            </span>
          </div>
          <p className="text-xs text-ink-secondary">
            Select an object on canvas to edit its properties, or input new elements below.
          </p>
        </div>

        {/* Quick Input shortcuts */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary block">
            Input to Canvas
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onAddItem("section", { label: "Frame / Artboard" }, { w: 500, h: 360 })}
              className="p-2.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-subtle text-left transition-colors flex items-center gap-2 group"
            >
              <div className="w-6 h-6 rounded bg-surface-muted flex items-center justify-center text-ink-secondary group-hover:text-ink">
                <Layout size={13} />
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-medium text-ink truncate">Frame</div>
                <div className="text-[10px] text-ink-tertiary">Section / Board</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onAddItem("color", { hex: "#191918" }, { w: 180, h: 220 })}
              className="p-2.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-subtle text-left transition-colors flex items-center gap-2 group"
            >
              <div className="w-6 h-6 rounded bg-surface-muted flex items-center justify-center text-ink-secondary group-hover:text-ink">
                <Droplets size={13} />
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-medium text-ink truncate">Swatch</div>
                <div className="text-[10px] text-ink-tertiary">Color card</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onAddItem("text", { text: "Heading text...", fontSize: 24, fontWeight: 600 }, { w: 320, h: 80 })}
              className="p-2.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-subtle text-left transition-colors flex items-center gap-2 group"
            >
              <div className="w-6 h-6 rounded bg-surface-muted flex items-center justify-center text-ink-secondary group-hover:text-ink">
                <Type size={13} />
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-medium text-ink truncate">Text</div>
                <div className="text-[10px] text-ink-tertiary">Typography</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onAddItem("palette", {}, { w: 320, h: 160 })}
              className="p-2.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-subtle text-left transition-colors flex items-center gap-2 group"
            >
              <div className="w-6 h-6 rounded bg-surface-muted flex items-center justify-center text-ink-secondary group-hover:text-ink">
                <Layers size={13} />
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-medium text-ink truncate">Palette</div>
                <div className="text-[10px] text-ink-tertiary">Color system</div>
              </div>
            </button>
          </div>

          <button
            type="button"
            onClick={onSwitchToInsert}
            className="w-full mt-2 py-2 px-3 rounded-lg border border-dashed border-border text-center text-xs font-medium text-ink-secondary hover:text-ink hover:bg-surface-subtle transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus size={13} />
            <span>Open Full Insert Library...</span>
          </button>
        </div>

        {/* Canvas stats */}
        <div className="pt-2 border-t border-border-subtle">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary block mb-2">
            Workspace Summary
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-surface-subtle/80">
              <span className="text-ink-tertiary text-[11px] block">Total Elements</span>
              <span className="font-mono font-semibold text-ink">{items.length}</span>
            </div>
            <div className="p-2 rounded bg-surface-subtle/80">
              <span className="text-ink-tertiary text-[11px] block">Zoom Scale</span>
              <span className="font-mono font-semibold text-ink">{Math.round(zoom * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Single Item Selected
  const item = selectedItem;
  const content = item.content || {};

  return (
    <div className="divide-y divide-border-subtle">
      {/* ── Item Header & Quick Actions (Bento Sculpted Header) ─────── */}
      <div className="p-3 bg-surface-subtle/40 border-b border-border-subtle/80">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-7 h-7 rounded-full bg-ink text-white flex items-center justify-center shadow-xs shrink-0">
              {getItemIcon(item.type)}
            </span>
            <div className="min-w-0">
              <span className="text-xs font-bold text-ink uppercase tracking-wider font-mono truncate block">
                {item.type.replace("_", " ")}
              </span>
              <span className="text-[10px] text-ink-tertiary font-mono truncate block">
                {Math.round(item.width)} × {Math.round(item.height)} px
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Lock / Unlock */}
            <button
              type="button"
              onClick={() => onUpdateItem(item.id, { locked: !item.locked })}
              title={item.locked ? "Unlock" : "Lock"}
              className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all shadow-xs ${
                item.locked
                  ? "text-amber-600 bg-amber-50 border-amber-200"
                  : "text-ink-tertiary bg-white border-black/[0.08] hover:text-ink hover:bg-surface-subtle hover:scale-105 active:scale-95"
              }`}
            >
              {item.locked ? <Lock size={12} /> : <Unlock size={12} />}
            </button>

            {/* Duplicate */}
            <button
              type="button"
              onClick={onDuplicateSelected}
              title="Duplicate (Ctrl+D)"
              className="w-7 h-7 rounded-full bg-white border border-black/[0.08] text-ink-tertiary hover:text-ink hover:bg-surface-subtle hover:scale-105 active:scale-95 transition-all shadow-xs flex items-center justify-center"
            >
              <Copy size={12} />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => onRemoveItem(item.id)}
              title="Delete (Backspace)"
              className="w-7 h-7 rounded-full bg-white border border-black/[0.08] text-ink-tertiary hover:text-red-600 hover:bg-red-50 hover:border-red-200 hover:scale-105 active:scale-95 transition-all shadow-xs flex items-center justify-center"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Position & Dimensions (Bento Transform Section) ──────────── */}
      <div className="p-3">
        <div className="bg-[#F7F7F5] rounded-[20px] p-3.5 border border-black/[0.06] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-white text-[10px] font-mono uppercase tracking-wider text-ink-secondary border border-black/[0.06] shadow-2xs font-semibold">
              Transform
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onBringToFront(item.id)}
                title="Bring to Front"
                className="w-6 h-6 rounded-full bg-white border border-black/[0.08] flex items-center justify-center text-ink-tertiary hover:text-ink hover:bg-surface shadow-2xs hover:scale-105 active:scale-95 transition-all"
              >
                <ArrowUp size={11} />
              </button>
              <button
                type="button"
                onClick={() => onSendToBack(item.id)}
                title="Send to Back"
                className="w-6 h-6 rounded-full bg-white border border-black/[0.08] flex items-center justify-center text-ink-tertiary hover:text-ink hover:bg-surface shadow-2xs hover:scale-105 active:scale-95 transition-all"
              >
                <ArrowDown size={11} />
              </button>
            </div>
          </div>

          {/* X, Y numeric capsule inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div className="h-8 rounded-full border border-black/[0.06] bg-white px-2.5 flex items-center gap-1.5 focus-within:border-ink/50 focus-within:ring-2 focus-within:ring-ink/10 shadow-2xs transition-all">
              <span className="w-4 h-4 rounded-full bg-[#F0F0ED] flex items-center justify-center text-[10px] font-mono font-bold text-ink-secondary select-none shrink-0">
                X
              </span>
              <input
                type="number"
                value={Math.round(item.x)}
                onChange={(e) => onUpdateItem(item.id, { x: parseFloat(e.target.value) || 0 })}
                className="w-full bg-transparent text-right font-mono text-xs font-semibold text-ink outline-none"
              />
            </div>
            <div className="h-8 rounded-full border border-black/[0.06] bg-white px-2.5 flex items-center gap-1.5 focus-within:border-ink/50 focus-within:ring-2 focus-within:ring-ink/10 shadow-2xs transition-all">
              <span className="w-4 h-4 rounded-full bg-[#F0F0ED] flex items-center justify-center text-[10px] font-mono font-bold text-ink-secondary select-none shrink-0">
                Y
              </span>
              <input
                type="number"
                value={Math.round(item.y)}
                onChange={(e) => onUpdateItem(item.id, { y: parseFloat(e.target.value) || 0 })}
                className="w-full bg-transparent text-right font-mono text-xs font-semibold text-ink outline-none"
              />
            </div>
          </div>

          {/* W, H numeric capsule inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div className="h-8 rounded-full border border-black/[0.06] bg-white px-2.5 flex items-center gap-1.5 focus-within:border-ink/50 focus-within:ring-2 focus-within:ring-ink/10 shadow-2xs transition-all">
              <span className="w-4 h-4 rounded-full bg-[#F0F0ED] flex items-center justify-center text-[10px] font-mono font-bold text-ink-secondary select-none shrink-0">
                W
              </span>
              <input
                type="number"
                value={Math.round(item.width)}
                min={40}
                onChange={(e) =>
                  onUpdateItem(item.id, { width: Math.max(40, parseFloat(e.target.value) || 40) })
                }
                className="w-full bg-transparent text-right font-mono text-xs font-semibold text-ink outline-none"
              />
            </div>
            <div className="h-8 rounded-full border border-black/[0.06] bg-white px-2.5 flex items-center gap-1.5 focus-within:border-ink/50 focus-within:ring-2 focus-within:ring-ink/10 shadow-2xs transition-all">
              <span className="w-4 h-4 rounded-full bg-[#F0F0ED] flex items-center justify-center text-[10px] font-mono font-bold text-ink-secondary select-none shrink-0">
                H
              </span>
              <input
                type="number"
                value={Math.round(item.height)}
                min={20}
                onChange={(e) =>
                  onUpdateItem(item.id, { height: Math.max(20, parseFloat(e.target.value) || 20) })
                }
                className="w-full bg-transparent text-right font-mono text-xs font-semibold text-ink outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Type Specific Editors ────────────────────────────────────── */}
      {item.type === "section" && (
        <FrameSectionEditor
          item={item}
          onUpdate={(patch) => onUpdateItem(item.id, { content: { ...content, ...patch } })}
          onUpdateSize={(w, h) => onUpdateItem(item.id, { width: w, height: h })}
        />
      )}

      {item.type === "text" && (
        <TextEditor
          item={item}
          onUpdate={(patch) => onUpdateItem(item.id, { content: { ...content, ...patch } })}
          activePicker={activePicker}
          setActivePicker={setActivePicker}
        />
      )}

      {item.type === "color" && (
        <ColorSwatchEditor
          item={item}
          onUpdate={(patch) => onUpdateItem(item.id, { content: { ...content, ...patch } })}
          onSaveToLibrary={onSaveToLibrary ? () => onSaveToLibrary(item) : undefined}
        />
      )}

      {item.type === "palette" && (
        <PaletteEditor
          item={item}
          onUpdate={(patch) => onUpdateItem(item.id, { content: { ...content, ...patch } })}
          onSaveToLibrary={onSaveToLibrary ? () => onSaveToLibrary(item) : undefined}
          activePicker={activePicker}
          setActivePicker={setActivePicker}
        />
      )}

      {item.type === "note" && (
        <NoteEditor
          item={item}
          onUpdate={(patch) => onUpdateItem(item.id, { content: { ...content, ...patch } })}
        />
      )}

      {item.type === "font" && (
        <FontSpecimenEditor
          item={item}
          onUpdate={(patch) => onUpdateItem(item.id, { content: { ...content, ...patch } })}
          onSaveToLibrary={onSaveToLibrary ? () => onSaveToLibrary(item) : undefined}
        />
      )}

      {item.type === "image" && (
        <ImageReferenceEditor
          item={item}
          onUpdate={(patch) => onUpdateItem(item.id, { content: { ...content, ...patch } })}
        />
      )}

      {item.type === "reference" && (
        <ImageReferenceEditor
          item={item}
          onUpdate={(patch) => onUpdateItem(item.id, { content: { ...content, ...patch } })}
        />
      )}

      {item.type === "direction" && (
        <DirectionEditor
          item={item}
          onUpdate={(patch) => onUpdateItem(item.id, { content: { ...content, ...patch } })}
        />
      )}

      {item.type === "brand_brain" && (
        <BrandBrainEditor item={item} />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. FRAME / SECTION EDITOR
// ═════════════════════════════════════════════════════════════════════════════

function FrameSectionEditor({
  item,
  onUpdate,
  onUpdateSize,
}: {
  item: CanvasItem;
  onUpdate: (patch: Record<string, any>) => void;
  onUpdateSize: (w: number, h: number) => void;
}) {
  const content = item.content || {};
  const label = content.label ?? "Section";
  const bg = content.bg ?? "rgba(235,235,231,0.35)";
  const borderStyle = content.borderStyle ?? "dashed";
  const radius = content.radius ?? 12;

  return (
    <div className="p-3 space-y-3">
      <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary block">
        Frame Presets
      </span>

      {/* Preset buttons */}
      <div className="grid grid-cols-2 gap-1.5">
        {FRAME_PRESETS.map((p) => {
          const Icon = p.icon;
          const isCurrent = item.width === p.w && item.height === p.h;
          return (
            <button
              key={p.name}
              type="button"
              onClick={() => onUpdateSize(p.w, p.h)}
              className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition-colors ${
                isCurrent
                  ? "border-ink bg-surface-subtle text-ink font-medium"
                  : "border-border-subtle bg-surface text-ink-secondary hover:text-ink hover:bg-surface-subtle"
              }`}
            >
              <Icon size={12} className="shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] truncate">{p.name}</div>
                <div className="text-[9px] font-mono text-ink-tertiary">
                  {p.w} × {p.h}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Frame Label */}
      <div className="space-y-1">
        <label className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary block">
          Label / Name
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-md border border-border-subtle bg-surface text-xs text-ink outline-none focus:border-ink/50"
          placeholder="Frame name..."
        />
      </div>

      {/* Frame Appearance */}
      <div className="space-y-2 pt-2 border-t border-border-subtle">
        <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary block">
          Border & Fill
        </span>

        {/* Border Style */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-secondary">Border Style</span>
          <div className="flex items-center gap-1 p-0.5 rounded bg-surface-subtle border border-border-subtle">
            {(["dashed", "solid", "none"] as const).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => onUpdate({ borderStyle: style })}
                className={`px-2 py-0.5 rounded text-[10px] capitalize transition-colors ${
                  borderStyle === style
                    ? "bg-surface text-ink font-medium shadow-subtle"
                    : "text-ink-tertiary hover:text-ink"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Corner Radius */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-secondary">Radius</span>
          <div className="flex items-center gap-1 w-24">
            <input
              type="number"
              min={0}
              max={48}
              value={radius}
              onChange={(e) => onUpdate({ radius: parseInt(e.target.value) || 0 })}
              className="w-full px-2 py-1 rounded border border-border-subtle bg-surface text-right font-mono text-xs text-ink outline-none"
            />
            <span className="text-[11px] font-mono text-ink-tertiary">px</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. TEXT / TYPOGRAPHY EDITOR
// ═════════════════════════════════════════════════════════════════════════════

function TextEditor({
  item,
  onUpdate,
  activePicker,
  setActivePicker,
}: {
  item: CanvasItem;
  onUpdate: (patch: Record<string, any>) => void;
  activePicker: string | null;
  setActivePicker: (id: string | null) => void;
}) {
  const content = item.content || {};
  const text = content.text ?? "";
  const fontFamily = content.fontFamily ?? "Satoshi, system-ui, sans-serif";
  const fontSize = content.fontSize ?? 14;
  const fontWeight = content.fontWeight ?? 400;
  const textAlign = content.textAlign ?? "left";
  const color = content.color ?? "#191918";

  const isPickerOpen = activePicker === `text-${item.id}`;

  return (
    <div className="p-3 space-y-3">
      <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary block">
        Typography
      </span>

      {/* Font Family Dropdown */}
      <div className="space-y-1">
        <label className="text-[10px] text-ink-tertiary">Font Family</label>
        <GoogleFontPicker
          value={fontFamily}
          onSelect={(font) => onUpdate({ fontFamily: font.family })}
        />
      </div>

      {/* Size & Weight row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] text-ink-tertiary">Size (px)</label>
          <input
            type="number"
            min={9}
            max={96}
            value={fontSize}
            onChange={(e) => onUpdate({ fontSize: Math.max(9, parseInt(e.target.value) || 14) })}
            className="w-full px-2 py-1 rounded border border-border-subtle bg-surface font-mono text-xs text-ink outline-none focus:border-ink/50"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-ink-tertiary">Weight</label>
          <select
            value={fontWeight}
            onChange={(e) => onUpdate({ fontWeight: parseInt(e.target.value) || 400 })}
            className="w-full px-2 py-1 rounded border border-border-subtle bg-surface text-xs text-ink outline-none focus:border-ink/50"
          >
            <option value={300}>Light 300</option>
            <option value={400}>Regular 400</option>
            <option value={500}>Medium 500</option>
            <option value={600}>Semi 600</option>
            <option value={700}>Bold 700</option>
          </select>
        </div>
      </div>

      {/* Alignment */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-secondary">Alignment</span>
        <div className="flex items-center gap-1 p-0.5 rounded bg-surface-subtle border border-border-subtle">
          <button
            type="button"
            onClick={() => onUpdate({ textAlign: "left" })}
            className={`p-1 rounded ${textAlign === "left" ? "bg-surface text-ink shadow-subtle" : "text-ink-tertiary"}`}
            title="Align Left"
          >
            <AlignLeft size={13} />
          </button>
          <button
            type="button"
            onClick={() => onUpdate({ textAlign: "center" })}
            className={`p-1 rounded ${textAlign === "center" ? "bg-surface text-ink shadow-subtle" : "text-ink-tertiary"}`}
            title="Align Center"
          >
            <AlignCenter size={13} />
          </button>
          <button
            type="button"
            onClick={() => onUpdate({ textAlign: "right" })}
            className={`p-1 rounded ${textAlign === "right" ? "bg-surface text-ink shadow-subtle" : "text-ink-tertiary"}`}
            title="Align Right"
          >
            <AlignRight size={13} />
          </button>
        </div>
      </div>

      {/* Text Fill Color Swatch */}
      <div className="space-y-1.5 pt-2 border-t border-border-subtle">
        <label className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary block">
          Text Fill
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActivePicker(isPickerOpen ? null : `text-${item.id}`)}
            className="w-7 h-7 rounded-md border border-border shadow-subtle shrink-0 cursor-pointer"
            style={{ background: color }}
            title="Open Color Picker"
          />
          <input
            type="text"
            value={color.toUpperCase()}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="flex-1 px-2 py-1 rounded border border-border-subtle bg-surface font-mono text-xs text-ink uppercase outline-none"
          />
        </div>

        {/* Color picker popup */}
        {isPickerOpen && (
          <div className="mt-2 pt-2 border-t border-border-subtle">
            <ColorPicker hex={color} onChange={(hex) => onUpdate({ color: hex })} />
          </div>
        )}
      </div>

      {/* Text Content Editor */}
      <div className="space-y-1 pt-2 border-t border-border-subtle">
        <label className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary block">
          Content
        </label>
        <textarea
          rows={3}
          value={text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          className="w-full p-2 rounded-md border border-border-subtle bg-surface text-xs text-ink outline-none resize-none focus:border-ink/50"
          placeholder="Edit text content..."
        />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════════════════
// 4. COLOR SWATCH EDITOR
// ═════════════════════════════════════════════════════════════════════════════

function ColorSwatchEditor({
  item,
  onUpdate,
  onSaveToLibrary,
}: {
  item: CanvasItem;
  onUpdate: (patch: Record<string, any>) => void;
  onSaveToLibrary?: () => void;
}) {
  const content = item.content || {};
  const hex = content.hex ?? "#191918";
  const name = content.name ?? "Color";
  const [showMixer, setShowMixer] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyHex = () => {
    navigator.clipboard?.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const OPALITE_CORE_TONES = [
    "#191918", "#1E1B4B", "#4DD4CD", "#EAF5F8", "#FBFBFA", "#E8973A", "#B5451B", "#4C8B5D"
  ];

  return (
    <div className="p-3 space-y-3">
      {/* Bento Swatch Card */}
      <div className="bg-[#F7F7F5] rounded-[22px] p-3.5 border border-black/[0.06] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full bg-white text-[10px] font-mono uppercase tracking-wider text-ink-secondary border border-black/[0.06] shadow-2xs font-semibold">
            Color Swatch
          </span>
          <span className="font-mono text-[10px] text-ink-tertiary">
            1 Token
          </span>
        </div>

        {/* Large sculpted swatch banner */}
        <div
          className="w-full h-18 rounded-[18px] border border-black/[0.08] shadow-inner flex items-end justify-between p-2.5 relative transition-colors overflow-hidden"
          style={{ background: hex }}
        >
          <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-black/40 text-white backdrop-blur-md shadow-xs font-semibold tracking-wider flex items-center gap-1.5">
            {hex.toUpperCase()}
          </span>

          <button
            type="button"
            onClick={copyHex}
            title="Copy Hex"
            className="w-6 h-6 rounded-full bg-white/25 hover:bg-white/40 backdrop-blur-md text-white flex items-center justify-center transition-all shadow-xs"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>

        {/* Role / Token Name Capsule */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary block px-1">
            Token / Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Primary / Accent / Neutral"
            className="w-full h-8 px-3.5 rounded-full border border-black/[0.08] bg-white text-xs font-medium text-ink outline-none focus:border-ink/50 focus:ring-2 focus:ring-ink/10 shadow-2xs transition-all"
          />
        </div>

        {/* Opalite Core Tones Row */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary block px-1">
            Opalite Palette
          </label>
          <div className="flex items-center justify-between px-1">
            {OPALITE_CORE_TONES.map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => onUpdate({ hex: tone })}
                style={{ background: tone }}
                className={`w-5 h-5 rounded-full border border-black/15 shadow-2xs hover:scale-125 transition-transform ${
                  hex.toLowerCase() === tone.toLowerCase() ? "ring-2 ring-ink ring-offset-1 scale-110" : ""
                }`}
                title={tone}
              />
            ))}
          </div>
        </div>

        {/* Expandable Custom Mixer Toggle Pill */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowMixer(!showMixer)}
            className="w-full h-8 px-3 rounded-full bg-white hover:bg-white/80 border border-black/[0.06] text-[11px] font-medium text-ink-secondary hover:text-ink flex items-center justify-between shadow-2xs transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Sliders size={12} />
              <span>Color Mixer</span>
            </span>
            <ChevronDown
              size={12}
              className={`transition-transform duration-200 ${showMixer ? "rotate-180" : ""}`}
            />
          </button>

          {showMixer && (
            <div className="mt-2.5 p-3 rounded-[18px] bg-white border border-black/[0.06] shadow-xs">
              <ColorPicker hex={hex} onChange={(newHex) => onUpdate({ hex: newHex })} />
            </div>
          )}
        </div>
      </div>

      {/* Save to library */}
      {onSaveToLibrary && (
        <button
          type="button"
          onClick={onSaveToLibrary}
          className="w-full h-9 px-3 rounded-full bg-ink hover:bg-black text-white text-xs font-medium transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
        >
          <FolderPlus size={13} />
          <span>Save Swatch to Library</span>
        </button>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. PALETTE EDITOR (BENTO & VERTICAL SWATCH CAPSULES)
// ═════════════════════════════════════════════════════════════════════════════

function PaletteEditor({
  item,
  onUpdate,
  onSaveToLibrary,
  activePicker,
  setActivePicker,
}: {
  item: CanvasItem;
  onUpdate: (patch: Record<string, any>) => void;
  onSaveToLibrary?: () => void;
  activePicker: string | null;
  setActivePicker: (id: string | null) => void;
}) {
  const content = item.content || {};
  const name = content.name ?? "Palette";
  const rawColors = content.colors ?? [
    { hex: "#191918", label: "Primary" },
    { hex: "#5A5A55", label: "Secondary" },
    { hex: "#BCBCB6", label: "Accent" },
    { hex: "#FBFBFA", label: "Background" },
  ];

  // Defensive normalize in case colors array contains raw strings
  const colors: { hex: string; label: string }[] = rawColors.map((c: any, i: number) => {
    if (typeof c === "string") return { hex: c, label: `Tone ${i + 1}` };
    return { hex: c.hex ?? "#191918", label: c.label ?? `Tone ${i + 1}` };
  });

  const [selectedSwatchIdx, setSelectedSwatchIdx] = useState<number>(0);
  const [showMixer, setShowMixer] = useState<boolean>(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Keep selected index in range if swatches change
  const activeIdx = Math.min(Math.max(0, selectedSwatchIdx), colors.length - 1);
  const activeColor = colors[activeIdx] || { hex: "#191918", label: "Primary" };

  const handleColorChange = (idx: number, newHex: string) => {
    const next = colors.map((c, i) => (i === idx ? { ...c, hex: newHex } : c));
    onUpdate({ colors: next, name });
  };

  const handleLabelChange = (idx: number, newLabel: string) => {
    const next = colors.map((c, i) => (i === idx ? { ...c, label: newLabel } : c));
    onUpdate({ colors: next, name });
  };

  const addColor = () => {
    const next = [...colors, { hex: "#4DD4CD", label: `Tone ${colors.length + 1}` }];
    onUpdate({ colors: next, name });
    setSelectedSwatchIdx(next.length - 1);
  };

  const removeColor = (idx: number) => {
    if (colors.length <= 2) return;
    const next = colors.filter((_, i) => i !== idx);
    onUpdate({ colors: next, name });
    if (activeIdx >= next.length) {
      setSelectedSwatchIdx(next.length - 1);
    }
  };

  const applyHarmony = (harmony: (typeof HARMONY_PALETTES)[0]) => {
    onUpdate({ colors: harmony.colors, name: harmony.name });
    setSelectedSwatchIdx(0);
  };

  const copyHex = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  // Opalite core tokens for instant swatch tuning
  const OPALITE_QUICK_TONES = [
    "#191918", "#1E1B4B", "#4DD4CD", "#EAF5F8", "#FBFBFA", "#E8973A", "#B5451B", "#4C8B5D"
  ];

  return (
    <div className="p-3 space-y-3.5">
      {/* Header Bento Card: Title & Palette Name */}
      <div className="bg-[#F7F7F5] rounded-[22px] p-3.5 border border-black/[0.06] shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full bg-white text-[10px] font-mono uppercase tracking-wider text-ink-secondary border border-black/[0.06] shadow-2xs font-semibold">
            Palette Studio
          </span>
          <button
            type="button"
            onClick={addColor}
            className="h-6 px-2.5 rounded-full bg-ink text-white hover:bg-black text-[11px] font-medium flex items-center gap-1 shadow-xs transition-transform active:scale-95"
          >
            <Plus size={11} />
            <span>Add</span>
          </button>
        </div>

        {/* Palette Name Capsule Input */}
        <input
          type="text"
          value={name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="w-full h-8 px-3.5 rounded-full border border-black/[0.08] bg-white text-xs font-semibold text-ink outline-none focus:border-ink/50 focus:ring-2 focus:ring-ink/10 shadow-2xs transition-all"
          placeholder="Palette Name..."
        />
      </div>

      {/* Vertical Swatch Capsules Reel (Direct Reference Image 1 Attribute) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary">
            Swatch Reel
          </span>
          <span className="text-[10px] font-mono text-ink-tertiary">
            {colors.length} Swatches
          </span>
        </div>

        {/* Horizontal scroll strip of vertical capsules */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 no-scrollbar">
          {colors.map((c, idx) => {
            const isSelected = idx === activeIdx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedSwatchIdx(idx)}
                className={`w-12 h-20 rounded-full flex flex-col items-center justify-between p-1.5 cursor-pointer transition-all shrink-0 select-none shadow-xs ${
                  isSelected
                    ? "bg-ink text-white ring-2 ring-ink ring-offset-2 scale-105 shadow-md border-transparent"
                    : "bg-white border border-black/[0.08] text-ink hover:border-black/25 hover:shadow-xs"
                }`}
              >
                {/* Color Dot Top */}
                <div
                  className="w-7 h-7 rounded-full border border-black/15 shadow-inner shrink-0"
                  style={{ background: c.hex }}
                />

                {/* Index Pill Center */}
                <span className={`text-[9px] font-mono font-bold tracking-wider ${
                  isSelected ? "text-white/80" : "text-ink-tertiary"
                }`}>
                  0{idx + 1}
                </span>

                {/* Label Bottom */}
                <span className={`text-[9px] font-mono font-semibold uppercase max-w-[40px] truncate text-center leading-none pb-0.5 ${
                  isSelected ? "text-white" : "text-ink-secondary"
                }`}>
                  {c.label.slice(0, 5)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Swatch Studio Bento Card */}
      <div className="bg-white rounded-[22px] border border-black/[0.08] p-3.5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary">
            Active Tone • 0{activeIdx + 1}
          </span>
          {colors.length > 2 && (
            <button
              type="button"
              onClick={() => removeColor(activeIdx)}
              className="text-[10px] font-mono text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full px-2 py-0.5 flex items-center gap-1 transition-colors"
              title="Remove Swatch"
            >
              <Trash2 size={11} />
              <span>Remove</span>
            </button>
          )}
        </div>

        {/* Large Rounded Swatch Banner */}
        <div
          className="w-full h-16 rounded-[16px] border border-black/[0.08] shadow-inner flex items-end justify-between p-2.5 relative transition-colors overflow-hidden"
          style={{ background: activeColor.hex }}
        >
          <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-black/45 text-white backdrop-blur-md shadow-xs font-semibold tracking-wider flex items-center gap-1.5">
            {activeColor.hex.toUpperCase()}
          </span>

          <button
            type="button"
            onClick={() => copyHex(activeColor.hex)}
            title="Copy Hex"
            className="w-6 h-6 rounded-full bg-white/25 hover:bg-white/40 backdrop-blur-md text-white flex items-center justify-center transition-all shadow-xs"
          >
            {copiedHex === activeColor.hex ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>

        {/* Pill Inputs: Label & Hex */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-ink-tertiary uppercase block px-1">Label</label>
            <input
              type="text"
              value={activeColor.label}
              onChange={(e) => handleLabelChange(activeIdx, e.target.value)}
              className="w-full h-8 px-3 rounded-full border border-black/[0.06] bg-[#F7F7F5] text-xs font-medium text-ink outline-none focus:border-ink/40 transition-colors"
              placeholder="Label"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-ink-tertiary uppercase block px-1">Hex Code</label>
            <input
              type="text"
              value={activeColor.hex.toUpperCase()}
              onChange={(e) => handleColorChange(activeIdx, e.target.value)}
              className="w-full h-8 px-3 rounded-full border border-black/[0.06] bg-[#F7F7F5] font-mono text-xs font-semibold text-ink outline-none focus:border-ink/40 uppercase text-right transition-colors"
            />
          </div>
        </div>

        {/* Curated Opalite Tones Row */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary block px-1">
            Quick Opalite Tones
          </label>
          <div className="flex items-center justify-between px-1">
            {OPALITE_QUICK_TONES.map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => handleColorChange(activeIdx, tone)}
                style={{ background: tone }}
                className={`w-5 h-5 rounded-full border border-black/15 shadow-2xs hover:scale-125 transition-transform ${
                  activeColor.hex.toLowerCase() === tone.toLowerCase() ? "ring-2 ring-ink ring-offset-1 scale-110" : ""
                }`}
                title={tone}
              />
            ))}
          </div>
        </div>

        {/* Expandable Deep Color Mixer Pill */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowMixer(!showMixer)}
            className="w-full h-8 px-3 rounded-full bg-[#F7F7F5] hover:bg-[#EFEFEA] border border-black/[0.06] text-[11px] font-medium text-ink-secondary hover:text-ink flex items-center justify-between shadow-2xs transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Sliders size={12} />
              <span>Color Mixer</span>
            </span>
            <ChevronDown
              size={12}
              className={`transition-transform duration-200 ${showMixer ? "rotate-180" : ""}`}
            />
          </button>

          {showMixer && (
            <div className="mt-2.5 p-3 rounded-[18px] bg-[#F7F7F5] border border-black/[0.06] shadow-inner">
              <ColorPicker
                hex={activeColor.hex}
                onChange={(hex) => handleColorChange(activeIdx, hex)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Preset Harmonies as Segmented Capsule Ribbons (Direct Reference Image 1 Attribute) */}
      <div className="bg-[#F7F7F5] rounded-[22px] border border-black/[0.06] p-3.5 shadow-xs space-y-2.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary block px-1">
          Preset Harmonies
        </span>
        <div className="space-y-1.5">
          {HARMONY_PALETTES.map((h) => (
            <button
              key={h.name}
              type="button"
              onClick={() => applyHarmony(h)}
              className="w-full p-2.5 rounded-[16px] bg-white hover:bg-white/80 border border-black/[0.06] flex items-center justify-between gap-3 text-left transition-all hover:scale-[1.01] hover:shadow-2xs active:scale-[0.99] group"
            >
              <span className="text-[11px] font-semibold text-ink-secondary group-hover:text-ink truncate">
                {h.name}
              </span>
              {/* Segmented capsule ribbon */}
              <div className="h-6 rounded-full overflow-hidden flex border border-black/[0.08] shadow-2xs min-w-[100px] shrink-0">
                {h.colors.map((c, i) => (
                  <div
                    key={i}
                    className="flex-1 h-full"
                    style={{ background: c.hex }}
                    title={c.label}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Save to library CTA */}
      {onSaveToLibrary && (
        <button
          type="button"
          onClick={onSaveToLibrary}
          className="w-full h-10 px-3 rounded-full bg-ink hover:bg-black text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
        >
          <FolderPlus size={14} />
          <span>Save Palette to Library</span>
        </button>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. NOTE EDITOR
// ═════════════════════════════════════════════════════════════════════════════

function NoteEditor({
  item,
  onUpdate,
}: {
  item: CanvasItem;
  onUpdate: (patch: Record<string, any>) => void;
}) {
  const content = item.content || {};
  const text = content.text ?? "";
  const bg = content.bg ?? "#FEF3C7";

  return (
    <div className="p-3 space-y-3">
      <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary block">
        Sticky Note
      </span>

      {/* Color swatches */}
      <div className="space-y-1">
        <label className="text-[10px] text-ink-tertiary">Note Color</label>
        <div className="flex items-center gap-2">
          {STICKY_COLORS.map((sc) => (
            <button
              key={sc.label}
              type="button"
              onClick={() => onUpdate({ bg: sc.bg, borderColor: sc.border })}
              className={`w-6 h-6 rounded-md border transition-transform ${
                bg === sc.bg ? "scale-110 border-ink shadow-subtle" : "border-black/10 hover:scale-105"
              }`}
              style={{ background: sc.bg }}
              title={sc.label}
            />
          ))}
        </div>
      </div>

      {/* Note Content */}
      <div className="space-y-1">
        <label className="text-[10px] text-ink-tertiary">Note Text</label>
        <textarea
          rows={4}
          value={text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Write note ideas..."
          className="w-full p-2.5 rounded-md border border-border-subtle bg-surface text-xs text-ink outline-none resize-none focus:border-ink/50"
        />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 7. FONT SPECIMEN EDITOR
// ═════════════════════════════════════════════════════════════════════════════

function FontSpecimenEditor({
  item,
  onUpdate,
  onSaveToLibrary,
}: {
  item: CanvasItem;
  onUpdate: (patch: Record<string, any>) => void;
  onSaveToLibrary?: () => void;
}) {
  const content = item.content || {};
  const fontName = content.fontName ?? content.fontFamily ?? "Satoshi";
  const previewText = content.previewText ?? "Aa";
  const provider = content.provider ?? "google";
  const category = content.category ?? "sans-serif";
  const variant = content.variant ?? "regular";
  const variants: string[] = content.variants || [];

  const isCustomOrGoogle = !CURATED_FONTS.some((f) => f.name.toLowerCase() === fontName.toLowerCase());

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary block">
          Font Specimen
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-ink-secondary uppercase">
            {category}
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-ink-tertiary capitalize">
            {provider === "google" ? "Google" : provider}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-ink-tertiary">Font Family</label>
        <GoogleFontPicker
          value={fontName}
          category={category}
          onSelect={(font) => {
            onUpdate({
              fontName: font.family,
              fontFamily: font.family,
              category: font.category,
              provider: "google",
              variants: font.variants,
              variant: font.variants.includes("regular") ? "regular" : font.variants[0] || "400",
              files: font.files,
            });
          }}
        />
      </div>

      {variants.length > 0 && (
        <div className="space-y-1">
          <label className="text-[10px] text-ink-tertiary">Weight / Variant</label>
          <select
            value={variant}
            onChange={(e) => onUpdate({ variant: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded-md border border-border-subtle bg-surface text-xs text-ink outline-none focus:border-ink/50 capitalize"
          >
            {variants.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[10px] text-ink-tertiary">Specimen Preview Text</label>
        <input
          type="text"
          value={previewText}
          onChange={(e) => onUpdate({ previewText: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-md border border-border-subtle bg-surface text-xs text-ink outline-none focus:border-ink/50"
          placeholder="Aa"
        />
      </div>

      {onSaveToLibrary && (
        <button
          type="button"
          onClick={onSaveToLibrary}
          className="w-full py-1.5 px-3 rounded-lg border border-border-subtle bg-surface hover:bg-surface-subtle text-xs font-medium text-ink transition-colors flex items-center justify-center gap-1.5"
        >
          <FolderPlus size={13} />
          <span>Save Font to Library</span>
        </button>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 8. IMAGE & REFERENCE EDITOR
// ═════════════════════════════════════════════════════════════════════════════

function ImageReferenceEditor({
  item,
  onUpdate,
}: {
  item: CanvasItem;
  onUpdate: (patch: Record<string, any>) => void;
}) {
  const content = item.content || {};
  const title = content.title ?? "";
  const source = content.source ?? "";

  return (
    <div className="p-3 space-y-3">
      <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary block">
        Reference Card
      </span>

      <div className="space-y-1">
        <label className="text-[10px] text-ink-tertiary">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Reference title..."
          className="w-full px-2.5 py-1.5 rounded-md border border-border-subtle bg-surface text-xs text-ink outline-none focus:border-ink/50"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-ink-tertiary">Source / URL</label>
        <input
          type="text"
          value={source}
          onChange={(e) => onUpdate({ source: e.target.value })}
          placeholder="e.g. Kinfolk, Studio scan..."
          className="w-full px-2.5 py-1.5 rounded-md border border-border-subtle bg-surface text-xs text-ink outline-none focus:border-ink/50"
        />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 9. DIRECTION & BRAND BRAIN EDITORS
// ═════════════════════════════════════════════════════════════════════════════

function DirectionEditor({
  item,
  onUpdate,
}: {
  item: CanvasItem;
  onUpdate: (patch: Record<string, any>) => void;
}) {
  const content = item.content || {};
  const name = content.name ?? "Direction 01";
  const description = content.description ?? "";

  return (
    <div className="p-3 space-y-3">
      <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary block">
        Creative Direction
      </span>

      <div className="space-y-1">
        <label className="text-[10px] text-ink-tertiary">Concept Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-md border border-border-subtle bg-surface text-xs text-ink outline-none focus:border-ink/50"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-ink-tertiary">Concept Statement</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Editorial premise and aesthetic narrative..."
          className="w-full p-2.5 rounded-md border border-border-subtle bg-surface text-xs text-ink outline-none resize-none focus:border-ink/50"
        />
      </div>
    </div>
  );
}

function BrandBrainEditor({ item }: { item: CanvasItem }) {
  const content = item.content || {};
  const brain = content.brain as BrandBrain | undefined;

  return (
    <div className="p-3 space-y-3">
      <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary block">
        Brand Brain Object
      </span>
      <p className="text-xs text-ink-secondary">
        This object synchronises with the core Brand Strategy document.
      </p>
      {brain?.story?.coreIdea && (
        <div className="p-2.5 rounded-lg bg-surface-subtle text-xs text-ink space-y-1">
          <span className="text-[10px] font-mono text-ink-tertiary uppercase block">
            Core Idea
          </span>
          <p className="italic">"{brain.story.coreIdea}"</p>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 10. INSERT TAB (FIGMA-LIKE INPUT PALETTE)
// ═════════════════════════════════════════════════════════════════════════════

interface InsertTabProps {
  onAddItem: (type: CanvasObjectType, content?: Record<string, any>, size?: { w: number; h: number }) => void;
  projectName?: string;
  projectBrain?: BrandBrain;
}

function InsertTab({ onAddItem, projectName, projectBrain }: InsertTabProps) {
  return (
    <div className="p-3 space-y-5">
      {/* ── 1. Frames & Artboards ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary flex items-center gap-1.5">
            <Layout size={12} />
            <span>Frames & Sections</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onAddItem("section", { label: "Desktop 1440" }, { w: 1440, h: 900 })}
            className="p-2 rounded-lg border border-border-subtle bg-surface hover:bg-surface-subtle text-left transition-colors flex items-center gap-2"
          >
            <Monitor size={14} className="text-ink-secondary" />
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-ink truncate">Desktop</div>
              <div className="text-[9px] font-mono text-ink-tertiary">1440 × 900</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onAddItem("section", { label: "Mobile 390" }, { w: 390, h: 844 })}
            className="p-2 rounded-lg border border-border-subtle bg-surface hover:bg-surface-subtle text-left transition-colors flex items-center gap-2"
          >
            <Smartphone size={14} className="text-ink-secondary" />
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-ink truncate">Mobile</div>
              <div className="text-[9px] font-mono text-ink-tertiary">390 × 844</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onAddItem("section", { label: "Square Board" }, { w: 1080, h: 1080 })}
            className="p-2 rounded-lg border border-border-subtle bg-surface hover:bg-surface-subtle text-left transition-colors flex items-center gap-2"
          >
            <Square size={14} className="text-ink-secondary" />
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-ink truncate">Square</div>
              <div className="text-[9px] font-mono text-ink-tertiary">1080 × 1080</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onAddItem("section", { label: "New Section" }, { w: 500, h: 360 })}
            className="p-2 rounded-lg border border-border-subtle bg-surface hover:bg-surface-subtle text-left transition-colors flex items-center gap-2"
          >
            <Layout size={14} className="text-ink-secondary" />
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-ink truncate">Section</div>
              <div className="text-[9px] font-mono text-ink-tertiary">500 × 360</div>
            </div>
          </button>
        </div>
      </div>

      {/* ── 2. Swatches & Colors ─────────────────────────────────────────── */}
      <div className="space-y-2 pt-3 border-t border-border-subtle">
        <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary flex items-center gap-1.5">
          <Droplets size={12} />
          <span>Swatches & Palettes</span>
        </span>

        {/* Quick swatch row */}
        <div className="space-y-1">
          <span className="text-[10px] text-ink-tertiary">Add Swatch:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_SWATCHES.slice(0, 8).map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => onAddItem("color", { hex }, { w: 180, h: 220 })}
                className="w-6 h-6 rounded-md border border-black/10 hover:scale-110 transition-transform shadow-subtle"
                style={{ background: hex }}
                title={`Add ${hex} Swatch`}
              />
            ))}
          </div>
        </div>

        {/* Palette strip button */}
        <button
          type="button"
          onClick={() => onAddItem("palette", {}, { w: 320, h: 160 })}
          className="w-full p-2.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-subtle text-left transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-ink-secondary" />
            <div>
              <div className="text-xs font-medium text-ink">5-Color Palette Strip</div>
              <div className="text-[10px] text-ink-tertiary">Full system strip</div>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            {["#191918", "#5A5A55", "#BCBCB6", "#FBFBFA"].map((c) => (
              <div key={c} className="w-2.5 h-4 rounded-sm" style={{ background: c }} />
            ))}
          </div>
        </button>
      </div>

      {/* ── 3. Typography & Text ─────────────────────────────────────────── */}
      <div className="space-y-2 pt-3 border-t border-border-subtle">
        <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary flex items-center gap-1.5">
          <Type size={12} />
          <span>Text & Typography</span>
        </span>

        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() =>
              onAddItem(
                "text",
                {
                  text: "Display Headline",
                  fontSize: 36,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  fontFamily: "'Playfair Display', serif",
                },
                { w: 380, h: 90 }
              )
            }
            className="w-full p-2 rounded-lg border border-border-subtle bg-surface hover:bg-surface-subtle text-left transition-colors flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-semibold text-ink">Display Heading</div>
              <div className="text-[10px] text-ink-tertiary">Playfair Display · 36px</div>
            </div>
            <span className="font-serif text-lg font-bold text-ink">Aa</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onAddItem(
                "text",
                {
                  text: "Section Heading",
                  fontSize: 22,
                  fontWeight: 600,
                  fontFamily: "Satoshi, system-ui, sans-serif",
                },
                { w: 320, h: 70 }
              )
            }
            className="w-full p-2 rounded-lg border border-border-subtle bg-surface hover:bg-surface-subtle text-left transition-colors flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-medium text-ink">Subheading</div>
              <div className="text-[10px] text-ink-tertiary">Satoshi · 22px Semi</div>
            </div>
            <span className="text-sm font-semibold text-ink">Aa</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onAddItem(
                "text",
                {
                  text: "Body text paragraph describing the brand concept, vision and philosophy...",
                  fontSize: 14,
                  fontWeight: 400,
                  lineHeight: 1.6,
                },
                { w: 300, h: 100 }
              )
            }
            className="w-full p-2 rounded-lg border border-border-subtle bg-surface hover:bg-surface-subtle text-left transition-colors flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-medium text-ink">Body Copy</div>
              <div className="text-[10px] text-ink-tertiary">14px Regular</div>
            </div>
            <span className="text-xs text-ink-secondary">Aa</span>
          </button>

          <div className="pt-2 space-y-2 border-t border-border-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary">
                Google Font Specimen
              </span>
              <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-stone-100 text-ink-secondary">
                1,940+ Live
              </span>
            </div>

            <GoogleFontPicker
              value=""
              placeholder="Search & Insert Any Google Font..."
              onSelect={(font) => {
                onAddItem(
                  "font",
                  {
                    fontName: font.family,
                    fontFamily: font.family,
                    category: font.category,
                    provider: "google",
                    variants: font.variants,
                    variant: font.variants.includes("regular") ? "regular" : font.variants[0] || "400",
                    files: font.files,
                    previewText: projectName || "ORBLINN",
                  },
                  { w: 320, h: 220 }
                );
              }}
            />

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {[
                { name: "Playfair Display", cat: "serif" },
                { name: "Space Grotesk", cat: "sans-serif" },
                { name: "Fraunces", cat: "serif" },
                { name: "Cinzel", cat: "serif" },
                { name: "Inter", cat: "sans-serif" },
                { name: "Syne", cat: "sans-serif" },
              ].map((gf) => (
                <button
                  key={gf.name}
                  type="button"
                  onClick={() =>
                    onAddItem(
                      "font",
                      {
                        fontName: gf.name,
                        fontFamily: gf.name,
                        category: gf.cat,
                        provider: "google",
                        previewText: projectName || "ORBLINN",
                      },
                      { w: 320, h: 220 }
                    )
                  }
                  className="px-2 py-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-subtle text-left transition-colors flex items-center justify-between group"
                >
                  <span className="text-xs font-medium text-ink truncate pr-1" style={{ fontFamily: `"${gf.name}", sans-serif` }}>
                    {gf.name}
                  </span>
                  <Plus size={11} className="text-ink-tertiary group-hover:text-ink shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Sticky Notes ──────────────────────────────────────────────── */}
      <div className="space-y-2 pt-3 border-t border-border-subtle">
        <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary flex items-center gap-1.5">
          <StickyNote size={12} />
          <span>Sticky Notes</span>
        </span>

        <div className="grid grid-cols-3 gap-1.5">
          {STICKY_COLORS.map((sc) => (
            <button
              key={sc.label}
              type="button"
              onClick={() =>
                onAddItem(
                  "note",
                  { text: "", bg: sc.bg, borderColor: sc.border },
                  { w: 220, h: 160 }
                )
              }
              className="p-2 rounded-lg border text-center transition-transform hover:scale-105"
              style={{ background: sc.bg, borderColor: sc.border }}
            >
              <span className="text-[10px] font-medium text-ink">{sc.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 5. Reference & Moodboard ─────────────────────────────────────── */}
      <div className="space-y-2 pt-3 border-t border-border-subtle">
        <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary flex items-center gap-1.5">
          <BookOpen size={12} />
          <span>Reference & Brand</span>
        </span>

        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => onAddItem("reference", { title: "Tactile Reference", source: "Kinfolk" }, { w: 240, h: 280 })}
            className="w-full p-2 rounded-lg border border-border-subtle bg-surface hover:bg-surface-subtle text-left transition-colors flex items-center gap-2"
          >
            <BookOpen size={14} className="text-ink-secondary" />
            <div>
              <div className="text-xs font-medium text-ink">Reference Card</div>
              <div className="text-[10px] text-ink-tertiary">Visual citation</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onAddItem("direction", { name: "Direction 01", description: "Minimal and tactile" }, { w: 380, h: 280 })}
            className="w-full p-2 rounded-lg border border-border-subtle bg-surface hover:bg-surface-subtle text-left transition-colors flex items-center gap-2"
          >
            <Sparkles size={14} className="text-ink-secondary" />
            <div>
              <div className="text-xs font-medium text-ink">Creative Direction</div>
              <div className="text-[10px] text-ink-tertiary">Board for client review</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 11. LAYERS TAB (FIGMA-LIKE CANVAS TREE)
// ═════════════════════════════════════════════════════════════════════════════

interface LayersTabProps {
  items: CanvasItem[];
  selectedIds: Set<string>;
  onSelectId: (id: string, additive?: boolean) => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (id: string, patch: Partial<CanvasItem>) => void;
}

function LayersTab({
  items,
  selectedIds,
  onSelectId,
  onRemoveItem,
  onUpdateItem,
}: LayersTabProps) {
  // Sort reverse z-index so highest on top
  const sorted = [...items].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));

  if (sorted.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-ink-tertiary">
        No elements on canvas yet.
      </div>
    );
  }

  return (
    <div className="p-2 space-y-0.5">
      {sorted.map((item) => {
        const isSelected = selectedIds.has(item.id);
        const name = getItemName(item);

        return (
          <div
            key={item.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectId(item.id, e.shiftKey || e.metaKey);
            }}
            className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors ${
              isSelected
                ? "bg-ink text-white"
                : "text-ink hover:bg-surface-subtle"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`shrink-0 ${isSelected ? "text-white/80" : "text-ink-tertiary"}`}>
                {getItemIcon(item.type)}
              </span>
              <span className="text-xs truncate font-medium">
                {name}
              </span>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateItem(item.id, { locked: !item.locked });
                }}
                className={`p-1 rounded ${
                  isSelected ? "text-white/80 hover:text-white" : "text-ink-tertiary hover:text-ink"
                }`}
                title={item.locked ? "Unlock" : "Lock"}
              >
                {item.locked ? <Lock size={12} /> : <Unlock size={12} />}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveItem(item.id);
                }}
                className={`p-1 rounded ${
                  isSelected ? "text-white/80 hover:text-red-300" : "text-ink-tertiary hover:text-red-600"
                }`}
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getItemIcon(type: CanvasObjectType) {
  switch (type) {
    case "text": return <Type size={13} />;
    case "section": return <Layout size={13} />;
    case "color": return <Droplets size={13} />;
    case "palette": return <Layers size={13} />;
    case "note": return <StickyNote size={13} />;
    case "font": return <AlignLeft size={13} />;
    case "image": return <ImageIcon size={13} />;
    case "reference": return <BookOpen size={13} />;
    case "brand_brain": return <Sparkles size={13} />;
    case "direction": return <Sparkles size={13} />;
    default: return <Square size={13} />;
  }
}

function getItemName(item: CanvasItem): string {
  const c = item.content || {};
  switch (item.type) {
    case "text": return c.text ? c.text.slice(0, 24) : "Text";
    case "section": return c.label ?? "Section";
    case "color": return c.name ? `${c.name} (${c.hex})` : c.hex ?? "Color";
    case "palette": return c.name ?? "Palette";
    case "note": return c.text ? c.text.slice(0, 20) : "Sticky Note";
    case "font": return c.fontName ?? "Font Specimen";
    case "image": return c.title ?? "Image";
    case "reference": return c.title ?? "Reference";
    case "brand_brain": return c.title ?? "Brand Brain";
    case "direction": return c.name ?? "Direction";
    default: return item.type;
  }
}
