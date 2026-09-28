"use client";
import React, { useRef, useCallback } from "react";
import { Lock } from "lucide-react";
import type { CanvasItem } from "@/lib/data";

interface ResizeHandle {
  cursor: string;
  style: React.CSSProperties;
  onDrag: (dx: number, dy: number, item: CanvasItem) => Partial<CanvasItem>;
}

function getResizeHandles(): ResizeHandle[] {
  return [
    // corners
    {
      cursor: "nw-resize",
      style: { top: -3.5, left: -3.5 },
      onDrag: (dx, dy, item) => ({
        x: item.x + dx,
        y: item.y + dy,
        width: Math.max(80, item.width - dx),
        height: Math.max(40, item.height - dy),
      }),
    },
    {
      cursor: "ne-resize",
      style: { top: -3.5, right: -3.5 },
      onDrag: (dx, dy, item) => ({
        y: item.y + dy,
        width: Math.max(80, item.width + dx),
        height: Math.max(40, item.height - dy),
      }),
    },
    {
      cursor: "se-resize",
      style: { bottom: -3.5, right: -3.5 },
      onDrag: (dx, dy, item) => ({
        width: Math.max(80, item.width + dx),
        height: Math.max(40, item.height + dy),
      }),
    },
    {
      cursor: "sw-resize",
      style: { bottom: -3.5, left: -3.5 },
      onDrag: (dx, dy, item) => ({
        x: item.x + dx,
        width: Math.max(80, item.width - dx),
        height: Math.max(40, item.height + dy),
      }),
    },
    // edges
    {
      cursor: "n-resize",
      style: { top: -3.5, left: "calc(50% - 3.5px)" },
      onDrag: (dx, dy, item) => ({
        y: item.y + dy,
        height: Math.max(40, item.height - dy),
      }),
    },
    {
      cursor: "s-resize",
      style: { bottom: -3.5, left: "calc(50% - 3.5px)" },
      onDrag: (dx, dy, item) => ({
        height: Math.max(40, item.height + dy),
      }),
    },
    {
      cursor: "e-resize",
      style: { top: "calc(50% - 3.5px)", right: -3.5 },
      onDrag: (dx, dy, item) => ({
        width: Math.max(80, item.width + dx),
      }),
    },
    {
      cursor: "w-resize",
      style: { top: "calc(50% - 3.5px)", left: -3.5 },
      onDrag: (dx, dy, item) => ({
        x: item.x + dx,
        width: Math.max(80, item.width - dx),
      }),
    },
  ];
}

interface CanvasObjectProps {
  item: CanvasItem;
  isSelected: boolean;
  isHovered?: boolean;
  scale: number;
  children: React.ReactNode;
  onSelect: (id: string, additive: boolean) => void;
  onUpdate: (id: string, patch: Partial<CanvasItem>, recordHistory?: boolean) => void;
  onUpdateCommit: (id: string, patch: Partial<CanvasItem>) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onDragStart?: (id: string) => void;
  onDragMove?: (id: string, dx: number, dy: number) => void;
  onDragEnd?: (id: string, dx: number, dy: number) => void;
}

export function CanvasObject({
  item,
  isSelected,
  isHovered = false,
  scale,
  children,
  onSelect,
  onUpdate,
  onUpdateCommit,
  onContextMenu,
  onDragStart,
  onDragMove,
  onDragEnd,
}: CanvasObjectProps) {
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const resizeRef = useRef<{
    handleIdx: number;
    startX: number;
    startY: number;
    origItem: CanvasItem;
  } | null>(null);

  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const deferredSingleSelectRef = useRef(false);

  const isLocked = !!item.locked;
  const isArchived = !!item.archived;
  const isSection = item.type === "section";

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Don't drag if clicking interactive elements
      const target = e.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest("[contenteditable]") ||
        target.closest("select") ||
        target.getAttribute("data-no-drag") === "true"
      ) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();

      if (e.shiftKey) {
        onSelect(item.id, true);
        deferredSingleSelectRef.current = false;
      } else {
        if (isSelected) {
          // If already selected, defer collapsing selection so multi-drag works smoothly
          deferredSingleSelectRef.current = true;
        } else {
          onSelect(item.id, false);
          deferredSingleSelectRef.current = false;
        }
      }

      // Don't allow drag/resize on locked items
      if (isLocked) return;

      isDraggingRef.current = false;
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: item.x,
        origY: item.y,
      };
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}
    },
    [item.id, item.x, item.y, onSelect, isSelected, isLocked]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isLocked) return;

      if (resizeRef.current) {
        const { handleIdx, startX, startY, origItem } = resizeRef.current;
        const dx = (e.clientX - startX) / scale;
        const dy = (e.clientY - startY) / scale;
        const handles = getResizeHandles();
        const patch = handles[handleIdx].onDrag(dx, dy, origItem);
        onUpdate(item.id, patch, false);
        return;
      }

      if (!dragRef.current) return;
      const dx = (e.clientX - dragRef.current.startX) / scale;
      const dy = (e.clientY - dragRef.current.startY) / scale;
      if (!isDraggingRef.current && Math.abs(dx) + Math.abs(dy) > 2) {
        isDraggingRef.current = true;
        deferredSingleSelectRef.current = false;
        onDragStart?.(item.id);
      }
      if (isDraggingRef.current) {
        onUpdate(
          item.id,
          {
            x: dragRef.current.origX + dx,
            y: dragRef.current.origY + dy,
          },
          false
        );
        // Notify parent for multi-drag
        onDragMove?.(item.id, dx, dy);
      }
    },
    [item.id, scale, onUpdate, isLocked, onDragStart, onDragMove]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isLocked) return;

      if (resizeRef.current) {
        const { handleIdx, startX, startY, origItem } = resizeRef.current;
        const dx = (e.clientX - startX) / scale;
        const dy = (e.clientY - startY) / scale;
        const handles = getResizeHandles();
        const patch = handles[handleIdx].onDrag(dx, dy, origItem);
        onUpdateCommit(item.id, patch);
        resizeRef.current = null;
        isResizingRef.current = false;
        return;
      }

      if (isDraggingRef.current && dragRef.current) {
        const dx = (e.clientX - dragRef.current.startX) / scale;
        const dy = (e.clientY - dragRef.current.startY) / scale;
        onUpdateCommit(item.id, {
          x: dragRef.current.origX + dx,
          y: dragRef.current.origY + dy,
        });
        onDragEnd?.(item.id, dx, dy);
      } else if (deferredSingleSelectRef.current) {
        // Plain click on an already selected item without dragging: isolate selection
        onSelect(item.id, false);
      }

      deferredSingleSelectRef.current = false;
      dragRef.current = null;
      isDraggingRef.current = false;
    },
    [item.id, scale, onUpdateCommit, isLocked, onDragEnd, onSelect]
  );

  const handles = isSelected && !isLocked ? getResizeHandles() : [];

  // Subtle Opalite charcoal selection outline or hover container emphasis
  const selectionOutline = isSelected
    ? "1.5px solid rgba(25, 25, 24, 0.65)"
    : isHovered && isSection
    ? "2px solid rgba(25, 25, 24, 0.45)"
    : "none";
  const selectionShadow = isSelected
    ? "0 0 0 3px rgba(25, 25, 24, 0.06)"
    : isHovered && isSection
    ? "0 0 0 4px rgba(25, 25, 24, 0.04)"
    : undefined;

  // Render sections with base zIndex 0, normal objects default to 1+
  const resolvedZIndex = isSection
    ? (item.zIndex ?? 0)
    : (item.zIndex ?? 1);

  return (
    <div
      style={{
        position: "absolute",
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        zIndex: resolvedZIndex,
        outline: selectionOutline,
        boxShadow: selectionShadow,
        borderRadius: isSection ? 12 : 8,
        userSelect: "none",
        touchAction: "none",
        opacity: isArchived ? 0.4 : 1,
        transition: "opacity 0.15s ease",
        cursor: isLocked ? "default" : undefined,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onContextMenu={(e) => {
        e.preventDefault();
        if (!isSelected) {
          onSelect(item.id, false);
        }
        onContextMenu(e, item.id);
      }}
    >
      {children}

      {/* Lock indicator */}
      {isLocked && (
        <div
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            width: 18,
            height: 18,
            borderRadius: 9,
            background: "#FBFBFA",
            border: "1px solid #D0D0CA",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9998,
            pointerEvents: "none",
          }}
        >
          <Lock size={9} style={{ color: "#9E9E98" }} />
        </div>
      )}

      {/* Archived badge */}
      {isArchived && (
        <div
          style={{
            position: "absolute",
            top: -10,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "1px 6px",
            borderRadius: 4,
            background: "#F6F6F4",
            border: "1px solid #E5E5E0",
            fontSize: 9,
            fontFamily: "monospace",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#9E9E98",
            whiteSpace: "nowrap",
            zIndex: 9998,
            pointerEvents: "none",
          }}
        >
          Archived
        </div>
      )}

      {/* Resize handles — fixed screen size regardless of zoom */}
      {isSelected &&
        !isLocked &&
        handles.map((handle, idx) => {
          const HANDLE_PX = 7;
          const invScale = 1 / scale;
          return (
            <div
              key={idx}
              data-no-drag="true"
              style={{
                position: "absolute",
                width: HANDLE_PX,
                height: HANDLE_PX,
                background: "#FFFFFF",
                border: "1.5px solid rgba(25, 25, 24, 0.65)",
                borderRadius: 2,
                cursor: handle.cursor,
                zIndex: 9999,
                transform: `scale(${invScale})`,
                transformOrigin: "center center",
                ...handle.style,
              }}
              onPointerDown={(e) => {
                if (isLocked) return;
                e.stopPropagation();
                e.preventDefault();
                isResizingRef.current = true;
                resizeRef.current = {
                  handleIdx: idx,
                  startX: e.clientX,
                  startY: e.clientY,
                  origItem: { ...item },
                };
                try {
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                } catch {}
              }}
            />
          );
        })}
    </div>
  );
}
