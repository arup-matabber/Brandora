"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import { useGesture } from "@use-gesture/react";
import {
  MousePointer,
  Hand,
  Type,
  Image,
  AlignLeft,
  Droplets,
  Layers,
  BookOpen,
  StickyNote,
  Layout,
} from "lucide-react";
import type { CanvasItem, CanvasObjectType, BrandBrain } from "@/lib/data";
import { useCanvas } from "./use-canvas";
import { CanvasObject } from "./CanvasObject";
import { SelectionBox } from "./SelectionBox";
import { ZoomControls } from "./ZoomControls";
import { QuickAddMenu } from "./QuickAddMenu";
import { ContextMenu, type ContextMenuAction } from "./ContextMenu";
import { TextObject } from "./objects/TextObject";
import { NoteObject } from "./objects/NoteObject";
import { ColorObject } from "./objects/ColorObject";
import { PaletteObject } from "./objects/PaletteObject";
import { FontObject } from "./objects/FontObject";
import { ImageObject } from "./objects/ImageObject";
import { ReferenceObject } from "./objects/ReferenceObject";
import { BrandBrainObject } from "./objects/BrandBrainObject";
import { SectionObject } from "./objects/SectionObject";
import { DirectionObject } from "./objects/DirectionObject";
import { FigmaSidebar } from "./FigmaSidebar";
import { SnapGuides } from "./SnapGuides";

// ── Default sizes per object type ────────────────────────────────────────────
const DEFAULT_SIZES: Record<CanvasObjectType, { w: number; h: number }> = {
  text: { w: 280, h: 100 },
  note: { w: 240, h: 160 },
  image: { w: 300, h: 240 },
  font: { w: 320, h: 220 },
  color: { w: 180, h: 220 },
  palette: { w: 320, h: 160 },
  reference: { w: 220, h: 280 },
  brand_brain: { w: 320, h: 380 },
  section: { w: 500, h: 360 },
  direction: { w: 380, h: 280 },
};

function defaultContent(type: CanvasObjectType, projectName?: string, brain?: BrandBrain): Record<string, any> {
  switch (type) {
    case "text": return { text: "Brand Vision\nTimeless, quiet, refined simplicity." };
    case "note": return { text: "Creative Note\nFocus on spatial rhythm and tactile editorial layout." };
    case "image": return {
      url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
      filename: "architectural_mood.jpg",
      caption: "Materiality & Spatial Structure"
    };
    case "font": return {
      fontName: "Satoshi",
      fontFamily: "Satoshi, system-ui, sans-serif",
      previewText: "Sphinx of black quartz, judge my vow.",
      category: "Geometric Sans"
    };
    case "color": return {
      hex: "#191918",
      name: "Ink Black",
      cmyk: "0, 0, 0, 95"
    };
    case "palette": return {
      name: "Opalite Monolith",
      colors: [
        { hex: "#191918", label: "Primary" },
        { hex: "#E8E8E2", label: "Paper" },
        { hex: "#4DD4CD", label: "Accent" },
        { hex: "#1E1B4B", label: "Indigo" },
        { hex: "#FBFBFA", label: "Mist" },
      ],
    };
    case "reference": return {
      title: "Tactile Form Study",
      source: "Are.na / Cosmos",
      url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"
    };
    case "brand_brain": return { title: projectName ?? "Brand Core", brain };
    case "section": return { label: "Design Direction 01", description: "Spatial framing and materials" };
    case "direction": return { name: "Direction 01", description: "Primary visual direction" };
    default: return {};
  }
}

// ── Viewport centre in canvas space ──────────────────────────────────────────
function viewportCenter(
  containerRef: React.RefObject<HTMLDivElement | null>,
  transform: { x: number; y: number; scale: number }
) {
  if (!containerRef.current) return { x: 200, y: 200 };
  const rect = containerRef.current.getBoundingClientRect();
  const cx = (rect.width / 2 - transform.x) / transform.scale;
  const cy = (rect.height / 2 - transform.y) / transform.scale;
  return { x: cx, y: cy };
}

interface CanvasWorkspaceProps {
  initialItems: CanvasItem[];
  projectName?: string;
  projectBrain?: BrandBrain;
  onItemsChange: (items: CanvasItem[]) => void;
  onOpenBrainDrawer?: () => void;
  onSaveToLibrary?: (item: CanvasItem) => void;
  onPublishDirection?: (item: CanvasItem) => void;
  onViewClientPortal?: (item: CanvasItem) => void;
}

export function CanvasWorkspace({
  initialItems,
  projectName,
  projectBrain,
  onItemsChange,
  onOpenBrainDrawer,
  onSaveToLibrary,
  onPublishDirection,
  onViewClientPortal,
}: CanvasWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Tool mode: "select" (pointer/marquee) or "hand" (pan)
  const [activeTool, setActiveTool] = useState<"select" | "hand">("select");

  // Pan state
  const isPanning = useRef(false);
  const spaceDown = useRef(false);
  const panStart = useRef<{ clientX: number; clientY: number } | null>(null);
  const panStartTransform = useRef<{ x: number; y: number } | null>(null);

  // Rubber-band marquee selection
  const [rubberBand, setRubberBand] = useState<{
    startX: number;
    startY: number;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const isRubberBanding = useRef(false);
  const rubberBandStart = useRef<{ clientX: number; clientY: number } | null>(null);
  const RUBBER_BAND_THRESHOLD = 5; // px in screen space

  // Context menu
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    itemId: string;
  } | null>(null);

  // Figma-like sidebar toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Unified drag tracking & atomic commit
  const [draggingIds, setDraggingIds] = useState<Set<string>>(new Set());
  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);
  const dragStartPositions = useRef<Map<string, { x: number; y: number }>>(new Map());

  const canvas = useCanvas({ initialItems, onItemsChange });
  const {
    items,
    transform,
    selectedIds,
    showArchived,
    archivedCount,
    setShowArchived,
    zoomBy,
    zoomTo,
    panBy,
    resetZoom,
    fitToContent,
    setTransform,
    selectId,
    deselectAll,
    selectAll,
    selectInRect,
    addItem,
    updateItem,
    updateItems,
    updateItemsCommit,
    removeItem,
    removeSelected,
    duplicateSelected,
    copySelected,
    paste,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    groupSelected,
    ungroupSelected,
    lockItem,
    unlockItem,
    toggleLockSelected,
    archiveItem,
    restoreItem,
    createDirectionFromSelected,
    moveSelectedBy,
    autoAssignSection,
    undo,
    redo,
  } = canvas;

  // ── Gesture handling (wheel / trackpad pinch & pan) ────────────────
  useGesture(
    {
      onWheel: ({ event, delta: [dx, dy], ctrlKey, metaKey, altKey }) => {
        event.preventDefault();
        const wheelEv = event as WheelEvent;
        const rect = containerRef.current?.getBoundingClientRect();
        const origin = rect
          ? { x: wheelEv.clientX - rect.left, y: wheelEv.clientY - rect.top }
          : undefined;

        if (ctrlKey || metaKey || altKey) {
          // Zoom around cursor
          const factor = 1 - dy * 0.01;
          zoomBy(factor, origin);
        } else {
          // Pan
          panBy(-dx, -dy);
        }
      },
    },
    {
      target: containerRef,
      eventOptions: { passive: false },
    }
  );

  // ── Keyboard shortcuts ─────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true";

      if (e.key === " " && !isEditing && !spaceDown.current) {
        spaceDown.current = true;
        if (containerRef.current) containerRef.current.style.cursor = "grab";
        e.preventDefault();
        return;
      }

      if (isEditing) return;

      const ctrl = e.ctrlKey || e.metaKey;

      // Tool switching
      if (!ctrl && (e.key === "v" || e.key === "V")) {
        setActiveTool("select");
        return;
      }
      if (!ctrl && (e.key === "h" || e.key === "H")) {
        setActiveTool("hand");
        return;
      }

      // History
      if (ctrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (ctrl && (e.key === "Z" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      // Selection
      else if (ctrl && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        selectAll();
      }
      // Clipboard & Duplication
      else if (ctrl && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        copySelected();
      } else if (ctrl && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        paste();
      } else if (ctrl && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        duplicateSelected();
      }
      // Group / Ungroup
      else if (ctrl && (e.key === "g" || e.key === "G") && !e.shiftKey) {
        e.preventDefault();
        groupSelected();
      } else if (ctrl && (e.key === "g" || e.key === "G") && e.shiftKey) {
        e.preventDefault();
        ungroupSelected();
      }
      // Lock toggle
      else if (ctrl && (e.key === "l" || e.key === "L")) {
        e.preventDefault();
        toggleLockSelected();
      }
      // Layer ordering
      else if (ctrl && e.key === "]" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        if (selectedIds.size === 1) bringForward(Array.from(selectedIds)[0]);
      } else if (ctrl && e.key === "[" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        if (selectedIds.size === 1) sendBackward(Array.from(selectedIds)[0]);
      } else if (ctrl && (e.key === "]" && (e.shiftKey || e.altKey))) {
        e.preventDefault();
        if (selectedIds.size === 1) bringToFront(Array.from(selectedIds)[0]);
      } else if (ctrl && (e.key === "[" && (e.shiftKey || e.altKey))) {
        e.preventDefault();
        if (selectedIds.size === 1) sendToBack(Array.from(selectedIds)[0]);
      }
      // Zoom
      else if (ctrl && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        zoomBy(1.2);
      } else if (ctrl && (e.key === "-" || e.key === "_")) {
        e.preventDefault();
        zoomBy(0.8);
      } else if (ctrl && e.key === "0") {
        e.preventDefault();
        resetZoom();
      } else if ((ctrl && e.shiftKey && (e.key === "H" || e.key === "h")) || (e.shiftKey && e.key === "1")) {
        e.preventDefault();
        fitToContent();
      }
      // Delete
      else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeSelected();
      }
      // Movement with arrow keys
      else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        moveSelectedBy(dx, dy);
      }
      // Escape
      else if (e.key === "Escape") {
        deselectAll();
        setContextMenu(null);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") {
        spaceDown.current = false;
        if (containerRef.current) {
          containerRef.current.style.cursor = activeTool === "hand" ? "grab" : "default";
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    activeTool,
    undo,
    redo,
    selectAll,
    copySelected,
    paste,
    duplicateSelected,
    groupSelected,
    ungroupSelected,
    toggleLockSelected,
    selectedIds,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    zoomBy,
    resetZoom,
    fitToContent,
    removeSelected,
    deselectAll,
    moveSelectedBy,
  ]);

  // ── Canvas pointer events (pan + rubber-band) ──────────────────────
  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Middle mouse button or Space key or Hand tool or Right mouse button -> Pan
      if (e.button === 1 || e.button === 2 || spaceDown.current || activeTool === "hand") {
        e.preventDefault();
        isPanning.current = true;
        panStart.current = { clientX: e.clientX, clientY: e.clientY };
        panStartTransform.current = { x: transform.x, y: transform.y };
        if (containerRef.current) containerRef.current.style.cursor = "grabbing";
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {}
        return;
      }

      if (e.button !== 0) return;

      // Click on empty canvas: deselect
      if (!e.shiftKey) {
        deselectAll();
      }

      // Record start position for rubber-band selection
      rubberBandStart.current = { clientX: e.clientX, clientY: e.clientY };
      isRubberBanding.current = false;
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}
    },
    [activeTool, transform, deselectAll]
  );

  const handleCanvasPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isPanning.current && panStart.current && panStartTransform.current) {
        const dx = e.clientX - panStart.current.clientX;
        const dy = e.clientY - panStart.current.clientY;
        setTransform((prev) => ({
          ...prev,
          x: panStartTransform.current!.x + dx,
          y: panStartTransform.current!.y + dy,
        }));
        return;
      }

      // Rubber-band marquee selection (only commit when moved beyond threshold)
      if (rubberBandStart.current) {
        const mdx = e.clientX - rubberBandStart.current.clientX;
        const mdy = e.clientY - rubberBandStart.current.clientY;
        const dist = Math.sqrt(mdx * mdx + mdy * mdy);

        if (!isRubberBanding.current && dist > RUBBER_BAND_THRESHOLD) {
          isRubberBanding.current = true;
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            const cx = (rubberBandStart.current.clientX - rect.left - transform.x) / transform.scale;
            const cy = (rubberBandStart.current.clientY - rect.top - transform.y) / transform.scale;
            setRubberBand({ startX: cx, startY: cy, x: cx, y: cy, width: 0, height: 0 });
          }
        }

        if (isRubberBanding.current && rubberBand) {
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return;
          const cx = (e.clientX - rect.left - transform.x) / transform.scale;
          const cy = (e.clientY - rect.top - transform.y) / transform.scale;
          setRubberBand((prev) =>
            prev
              ? {
                  ...prev,
                  x: Math.min(prev.startX, cx),
                  y: Math.min(prev.startY, cy),
                  width: Math.abs(cx - prev.startX),
                  height: Math.abs(cy - prev.startY),
                }
              : null
          );
        }
      }
    },
    [rubberBand, transform, setTransform]
  );

  const handleCanvasPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isPanning.current) {
        isPanning.current = false;
        panStart.current = null;
        panStartTransform.current = null;
        if (containerRef.current) {
          containerRef.current.style.cursor =
            spaceDown.current || activeTool === "hand" ? "grab" : "default";
        }
        return;
      }

      if (isRubberBanding.current && rubberBand) {
        isRubberBanding.current = false;
        rubberBandStart.current = null;
        if (rubberBand.width > 4 && rubberBand.height > 4) {
          selectInRect(rubberBand, e.shiftKey);
        }
        setRubberBand(null);
        return;
      }

      // Plain click on empty canvas
      isRubberBanding.current = false;
      rubberBandStart.current = null;
      setRubberBand(null);
    },
    [activeTool, rubberBand, selectInRect]
  );

  // ── Quick Add & Direct Input ─────────────────────────────────────
  const itemAddCountRef = useRef(0);
  const handleAddItem = useCallback(
    (
      type: CanvasObjectType,
      customContent?: Record<string, any>,
      customSize?: { w: number; h: number }
    ) => {
      itemAddCountRef.current += 1;
      const stagger = ((itemAddCountRef.current - 1) % 6) * 24;
      const { x, y } = viewportCenter(containerRef, transform);
      const size = customSize || DEFAULT_SIZES[type];
      const id = `${type}-${Date.now()}`;
      const baseContent = defaultContent(type, projectName, projectBrain);
      const content = { ...baseContent, ...customContent };
      const maxZ = items.reduce((m, i) => Math.max(m, i.zIndex ?? 0), 0);
      addItem({
        id,
        type,
        x: Math.round(x - size.w / 2 + stagger),
        y: Math.round(y - size.h / 2 + stagger),
        width: size.w,
        height: size.h,
        zIndex: type === "section" ? 0 : maxZ + 1,
        content,
      });
      setActiveTool("select");
    },
    [transform, items, projectName, projectBrain, addItem]
  );

  const handleQuickAdd = useCallback(
    (type: CanvasObjectType) => {
      handleAddItem(type);
    },
    [handleAddItem]
  );

  // ── Drag movement & Snap & Multi-drag (Atomic Commit) ────────────
  const handleObjectDragStart = useCallback(
    (id: string) => {
      setIsDraggingAny(true);
      dragStartPositions.current.clear();

      const toMoveIds = new Set<string>();
      if (selectedIds.has(id)) {
        selectedIds.forEach((selId) => toMoveIds.add(selId));
      } else {
        toMoveIds.add(id);
      }

      // If any selected item is a section or direction, add all items inside that section
      items.forEach((item) => {
        if (toMoveIds.has(item.id) && (item.type === "section" || item.type === "direction")) {
          items.forEach((child) => {
            if (child.parentId === item.id || child.sectionId === item.id) {
              toMoveIds.add(child.id);
            }
          });
        }
      });

      // Record starting positions
      items.forEach((item) => {
        if (toMoveIds.has(item.id)) {
          dragStartPositions.current.set(item.id, { x: item.x, y: item.y });
        }
      });

      setDraggingIds(toMoveIds);
    },
    [selectedIds, items]
  );

  const handleObjectDragMove = useCallback(
    (id: string, dx: number, dy: number) => {
      if (dragStartPositions.current.size === 0) {
        handleObjectDragStart(id);
      }

      const patches: { id: string; patch: Partial<CanvasItem> }[] = [];
      dragStartPositions.current.forEach((startPos, itemId) => {
        patches.push({
          id: itemId,
          patch: { x: startPos.x + dx, y: startPos.y + dy },
        });
      });

      if (patches.length > 0) {
        updateItems(patches, false); // Ephemeral update during movement
      }

      // Detect hover over a section if dragging a non-section object
      const primaryItem = items.find((i) => i.id === id);
      if (primaryItem && primaryItem.type !== "section" && primaryItem.type !== "direction") {
        const startPos = dragStartPositions.current.get(id);
        if (startPos) {
          const cx = startPos.x + dx + primaryItem.width / 2;
          const cy = startPos.y + dy + primaryItem.height / 2;
          const targetSection = items.find(
            (sec) =>
              (sec.type === "section" || sec.type === "direction") &&
              sec.id !== id &&
              sec.x <= cx &&
              cx <= sec.x + sec.width &&
              sec.y <= cy &&
              cy <= sec.y + sec.height
          );
          setHoveredSectionId(targetSection?.id ?? null);
        }
      } else {
        setHoveredSectionId(null);
      }
    },
    [handleObjectDragStart, updateItems, items]
  );

  const handleObjectDragEnd = useCallback(
    (id: string, dx: number, dy: number) => {
      setIsDraggingAny(false);
      setDraggingIds(new Set());
      setHoveredSectionId(null);

      const finalPatches: { id: string; patch: Partial<CanvasItem> }[] = [];
      dragStartPositions.current.forEach((startPos, itemId) => {
        finalPatches.push({
          id: itemId,
          patch: { x: startPos.x + dx, y: startPos.y + dy },
        });
      });

      dragStartPositions.current.clear();

      if (finalPatches.length > 0) {
        // Atomic history commit: continuous drag counts as 1 single undo state!
        updateItemsCommit(finalPatches);
      }

      // Auto-assign sections for moved items
      finalPatches.forEach((p) => {
        autoAssignSection(p.id);
      });
    },
    [updateItemsCommit, autoAssignSection]
  );

  // ── Drag and Drop from Explore / Library ───────────────────────────
  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleCanvasDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - transform.x) / transform.scale;
      const y = (e.clientY - rect.top - transform.y) / transform.scale;

      try {
        const rawData = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain");
        if (!rawData) return;
        const data = JSON.parse(rawData);

        const type = (data.type || "reference") as CanvasObjectType;
        const size = DEFAULT_SIZES[type] || { w: 260, h: 220 };
        const id = `${type}-${Date.now()}`;
        const maxZ = items.reduce((m, i) => Math.max(m, i.zIndex ?? 0), 0);

        addItem({
          id,
          type,
          x: x - size.w / 2,
          y: y - size.h / 2,
          width: size.w,
          height: size.h,
          zIndex: type === "section" ? 0 : maxZ + 1,
          content: data.content || data.metadata || { title: data.title, ...data },
        });
      } catch (err) {
        // Not a JSON payload, ignore
      }
    },
    [transform, items, addItem]
  );

  // ── Context Menu actions ───────────────────────────────────────────
  const handleContextAction = useCallback(
    (action: ContextMenuAction) => {
      if (!contextMenu) return;
      const id = contextMenu.itemId;
      switch (action) {
        case "duplicate":
          duplicateSelected(id);
          break;
        case "copy":
          copySelected(id);
          break;
        case "bringToFront":
          bringToFront(id);
          break;
        case "bringForward":
          bringForward(id);
          break;
        case "sendBackward":
          sendBackward(id);
          break;
        case "sendToBack":
          sendToBack(id);
          break;
        case "group":
          groupSelected(id);
          break;
        case "ungroup":
          ungroupSelected(id);
          break;
        case "lock":
          lockItem(id);
          break;
        case "unlock":
          unlockItem(id);
          break;
        case "archive":
          archiveItem(id);
          break;
        case "restore":
          restoreItem(id);
          break;
        case "createDirection":
          createDirectionFromSelected();
          break;
        case "delete":
          removeSelected(id);
          break;
        case "saveToLibrary": {
          const item = items.find((i) => i.id === id);
          if (item && onSaveToLibrary) onSaveToLibrary(item);
          break;
        }
      }
      setContextMenu(null);
    },
    [
      contextMenu,
      items,
      duplicateSelected,
      copySelected,
      bringToFront,
      bringForward,
      sendBackward,
      sendToBack,
      groupSelected,
      ungroupSelected,
      lockItem,
      unlockItem,
      archiveItem,
      restoreItem,
      createDirectionFromSelected,
      removeSelected,
      onSaveToLibrary,
    ]
  );

  // Sorted by zIndex for rendering, filtered by archive state.
  // Sections render behind their child objects so children are layered on top and receive direct interactions.
  const sortedItems = [...items].sort((a, b) => {
    const isSecA = a.type === "section" || a.type === "direction";
    const isSecB = b.type === "section" || b.type === "direction";
    if (isSecA !== isSecB) {
      if (b.parentId === a.id || b.sectionId === a.id) return -1;
      if (a.parentId === b.id || a.sectionId === b.id) return 1;
    }
    return (a.zIndex ?? 0) - (b.zIndex ?? 0);
  });
  const visibleItems = sortedItems.filter((i) => showArchived || !i.archived);

  // ── Multi-select bounding box ──────────────────────────────────────
  const multiSelectBounds = React.useMemo(() => {
    if (selectedIds.size < 2) return null;
    const sel = visibleItems.filter((i) => selectedIds.has(i.id));
    if (sel.length < 2) return null;
    const minX = Math.min(...sel.map((i) => i.x));
    const minY = Math.min(...sel.map((i) => i.y));
    const maxX = Math.max(...sel.map((i) => i.x + i.width));
    const maxY = Math.max(...sel.map((i) => i.y + i.height));
    return { x: minX - 4, y: minY - 4, w: maxX - minX + 8, h: maxY - minY + 8 };
  }, [selectedIds, visibleItems]);

  // ── Group visual boundaries ────────────────────────────────────────
  const groupBounds = React.useMemo(() => {
    const groups: Record<string, { x: number; y: number; w: number; h: number }> = {};
    visibleItems.forEach((item) => {
      if (!item.groupId) return;
      const gid = item.groupId;
      if (!groups[gid]) {
        groups[gid] = { x: item.x, y: item.y, w: item.x + item.width, h: item.y + item.height };
      } else {
        groups[gid].x = Math.min(groups[gid].x, item.x);
        groups[gid].y = Math.min(groups[gid].y, item.y);
        groups[gid].w = Math.max(groups[gid].w, item.x + item.width);
        groups[gid].h = Math.max(groups[gid].h, item.y + item.height);
      }
    });
    return Object.entries(groups).map(([id, b]) => ({
      id,
      x: b.x - 10,
      y: b.y - 24,
      width: b.w - b.x + 20,
      height: b.h - b.y + 34,
    }));
  }, [visibleItems]);

  const renderObjectContent = useCallback(
    (item: CanvasItem) => {
      const update = (patch: Record<string, any>) =>
        updateItem(item.id, { content: { ...item.content, ...patch } });

      const childCount = items.filter(
        (c) => c.parentId === item.id || c.sectionId === item.id
      ).length;

      switch (item.type) {
        case "text":
          return <TextObject content={item.content} onUpdate={update} />;
        case "note":
          return <NoteObject content={item.content} onUpdate={update} />;
        case "color":
          return <ColorObject content={item.content} onUpdate={update} />;
        case "palette":
          return <PaletteObject content={item.content} onUpdate={update} />;
        case "font":
          return <FontObject content={item.content} onUpdate={update} />;
        case "image":
          return <ImageObject content={item.content} onUpdate={update} />;
        case "reference":
          return <ReferenceObject content={item.content} onUpdate={update} />;
        case "brand_brain":
          return (
            <BrandBrainObject
              content={{ ...item.content, brain: item.content.brain ?? projectBrain }}
              onOpenBrainDrawer={onOpenBrainDrawer}
            />
          );
        case "section":
          return (
            <SectionObject
              content={item.content}
              memberCount={childCount}
              onUpdate={update}
              onPublish={() => onPublishDirection?.(item)}
              onViewClientPortal={() => onViewClientPortal?.(item)}
            />
          );
        case "direction":
          return (
            <DirectionObject
              content={item.content}
              memberCount={childCount}
              onUpdate={update}
              onPublish={() => onPublishDirection?.(item)}
              onViewClientPortal={() => onViewClientPortal?.(item)}
            />
          );
        default:
          return null;
      }
    },
    [projectBrain, onOpenBrainDrawer, onPublishDirection, onViewClientPortal, updateItem, items]
  );

  const canvasCursor = spaceDown.current || activeTool === "hand" ? "grab" : "default";

  return (
    <div className="relative w-full h-full flex flex-row overflow-hidden select-none" style={{ background: "#FBFBFA" }}>
      {/* Interactive canvas area */}
      <div
        ref={containerRef}
        className="relative flex-1 h-full overflow-hidden"
        style={{
          background: "#FBFBFA",
          backgroundImage: "radial-gradient(circle, #D4D4CE 0.9px, transparent 0.9px)",
          backgroundSize: "28px 28px",
          cursor: canvasCursor,
          touchAction: "none",
        }}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onDragOver={handleCanvasDragOver}
        onDrop={handleCanvasDrop}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Transform container */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: "0 0",
            willChange: "transform",
          }}
        >
          {/* Snap guides during drag */}
          <SnapGuides draggedIds={draggingIds} items={items} isDragging={isDraggingAny} />

          {/* Group visual boundaries */}
          {groupBounds.map((g) => (
            <div
              key={g.id}
              style={{
                position: "absolute",
                left: g.x,
                top: g.y,
                width: g.width,
                height: g.height,
                border: "1px dashed rgba(25,25,24,0.18)",
                borderRadius: 10,
                pointerEvents: "none",
                zIndex: 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  left: 8,
                  fontSize: 9,
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgba(25,25,24,0.32)",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              >
                Group
              </span>
            </div>
          ))}

          {/* Multi-select unified bounding box */}
          {multiSelectBounds && (
            <div
              style={{
                position: "absolute",
                left: multiSelectBounds.x,
                top: multiSelectBounds.y,
                width: multiSelectBounds.w,
                height: multiSelectBounds.h,
                border: "1.5px dashed rgba(25,25,24,0.35)",
                borderRadius: 8,
                pointerEvents: "none",
                zIndex: 9990,
              }}
            />
          )}

          {/* Rubber-band marquee (in canvas space) */}
          {rubberBand && <SelectionBox rect={rubberBand} />}

          {/* Empty state when no visible items */}
          {visibleItems.length === 0 && (
            <div
              style={{
                position: "absolute",
                top: 200,
                left: 200,
                pointerEvents: "none",
              }}
              className="text-center py-12 px-8 rounded-2xl border border-dashed border-border-subtle bg-surface/40 max-w-sm"
            >
              <p className="text-xs font-mono uppercase tracking-widest text-ink-tertiary mb-1">
                Empty Canvas
              </p>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Add elements using the toolbar below, or drag inspiration directly onto this canvas.
              </p>
            </div>
          )}

          {/* Canvas objects */}
          {visibleItems.map((item) => (
            <CanvasObject
              key={item.id}
              item={item}
              isSelected={selectedIds.has(item.id)}
              isHovered={hoveredSectionId === item.id}
              scale={transform.scale}
              onSelect={selectId}
              onUpdate={(id, patch, record) => updateItem(id, patch, record)}
              onUpdateCommit={(id, patch) => updateItem(id, patch, true)}
              onDragStart={handleObjectDragStart}
              onDragMove={handleObjectDragMove}
              onDragEnd={handleObjectDragEnd}
              onContextMenu={(e, id) => {
                if (!selectedIds.has(id)) {
                  selectId(id, false);
                }
                setContextMenu({ x: e.clientX, y: e.clientY, itemId: id });
              }}
            >
              {renderObjectContent(item)}
            </CanvasObject>
          ))}
        </div>

        {/* Minimal Opalite Floating Bottom Toolbar */}
        <div
          data-no-drag="true"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            bottom: 20,
            top: "auto",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
            userSelect: "none",
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-black/[0.12] bg-white/95 backdrop-blur-md shadow-card transition-all"
        >
          {/* Tool: Select */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTool("select");
            }}
            className={`h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-medium transition-all cursor-pointer ${
              activeTool === "select"
                ? "bg-ink text-white shadow-sm"
                : "text-ink-secondary hover:text-ink hover:bg-black/[0.05]"
            }`}
            title="Select tool (V)"
          >
            <MousePointer size={14} />
          </button>

          {/* Tool: Pan */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTool("hand");
            }}
            className={`h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-medium transition-all cursor-pointer ${
              activeTool === "hand"
                ? "bg-ink text-white shadow-sm"
                : "text-ink-secondary hover:text-ink hover:bg-black/[0.05]"
            }`}
            title="Hand / Pan tool (H or hold Space)"
          >
            <Hand size={14} />
          </button>

          <div className="w-px h-4 bg-border-subtle mx-0.5" />

          {/* Quick Add Menu */}
          <QuickAddMenu onAdd={handleQuickAdd} />

          <div className="w-px h-4 bg-border-subtle mx-0.5" />

          {/* Direct Creation Buttons */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAddItem("text");
            }}
            className="h-8 w-8 rounded-full text-ink-secondary hover:text-ink hover:bg-black/[0.05] transition-colors flex items-center justify-center active:scale-95 cursor-pointer"
            title="Add Text (T)"
          >
            <Type size={14} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAddItem("image");
            }}
            className="h-8 w-8 rounded-full text-ink-secondary hover:text-ink hover:bg-black/[0.05] transition-colors flex items-center justify-center active:scale-95 cursor-pointer"
            title="Add Image"
          >
            <Image size={14} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAddItem("font");
            }}
            className="h-8 w-8 rounded-full text-ink-secondary hover:text-ink hover:bg-black/[0.05] transition-colors flex items-center justify-center active:scale-95 cursor-pointer"
            title="Add Font / Typography"
          >
            <AlignLeft size={14} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAddItem("color");
            }}
            className="h-8 w-8 rounded-full text-ink-secondary hover:text-ink hover:bg-black/[0.05] transition-colors flex items-center justify-center active:scale-95 cursor-pointer"
            title="Add Color Swatch"
          >
            <Droplets size={14} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAddItem("palette");
            }}
            className="h-8 w-8 rounded-full text-ink-secondary hover:text-ink hover:bg-black/[0.05] transition-colors flex items-center justify-center active:scale-95 cursor-pointer"
            title="Add Palette"
          >
            <Layers size={14} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAddItem("reference");
            }}
            className="h-8 w-8 rounded-full text-ink-secondary hover:text-ink hover:bg-black/[0.05] transition-colors flex items-center justify-center active:scale-95 cursor-pointer"
            title="Add Reference"
          >
            <BookOpen size={14} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAddItem("note");
            }}
            className="h-8 w-8 rounded-full text-ink-secondary hover:text-ink hover:bg-black/[0.05] transition-colors flex items-center justify-center active:scale-95 cursor-pointer"
            title="Add Note (N)"
          >
            <StickyNote size={14} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAddItem("section");
            }}
            className="h-8 w-8 rounded-full text-ink-secondary hover:text-ink hover:bg-black/[0.05] transition-colors flex items-center justify-center active:scale-95 cursor-pointer"
            title="Add Section / Frame (S)"
          >
            <Layout size={14} />
          </button>
        </div>

        {/* Bottom-right: Zoom controls */}
        <div style={{ position: "absolute", bottom: 20, right: 20, zIndex: 50 }}>
          <ZoomControls
            scale={transform.scale}
            onZoomIn={() => zoomBy(1.25)}
            onZoomOut={() => zoomBy(0.8)}
            onReset={resetZoom}
            onFit={fitToContent}
            archivedCount={archivedCount}
            showArchived={showArchived}
            onToggleShowArchived={() => setShowArchived((v) => !v)}
          />
        </div>

        {/* Context menu */}
        {contextMenu && (() => {
          const ctxItem = items.find((i) => i.id === contextMenu.itemId);
          return (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              multiSelect={selectedIds.size > 1}
              itemType={ctxItem?.type}
              isLocked={ctxItem?.locked}
              isArchived={ctxItem?.archived}
              onAction={handleContextAction}
              onClose={() => setContextMenu(null)}
            />
          );
        })()}
      </div>

      {/* Figma-like Properties & Input Sidebar */}
      <FigmaSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((v) => !v)}
        items={items}
        selectedIds={selectedIds}
        onSelectId={selectId}
        onDeselectAll={deselectAll}
        onUpdateItem={updateItem}
        onRemoveItem={removeItem}
        onRemoveSelected={removeSelected}
        onDuplicateSelected={duplicateSelected}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
        onAddItem={handleAddItem}
        onSaveToLibrary={onSaveToLibrary}
        projectName={projectName}
        projectBrain={projectBrain}
        zoom={transform.scale}
        onResetZoom={resetZoom}
      />
    </div>
  );
}
