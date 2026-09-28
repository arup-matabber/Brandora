"use client";
import React, { useMemo } from "react";
import { CanvasItem } from "@/lib/data";

const SNAP_THRESHOLD = 4; // pixels in canvas space

interface SnapLine {
  orientation: "h" | "v";
  position: number;
  start: number;
  end: number;
}

interface SnapGuidesProps {
  /** The item(s) currently being dragged */
  draggedIds: Set<string>;
  items: CanvasItem[];
  /** Whether the user is actively dragging */
  isDragging: boolean;
}

/** Computes edges and center for an item */
function getEdges(item: CanvasItem) {
  return {
    left: item.x,
    right: item.x + item.width,
    top: item.y,
    bottom: item.y + item.height,
    centerX: item.x + item.width / 2,
    centerY: item.y + item.height / 2,
  };
}

export function SnapGuides({ draggedIds, items, isDragging }: SnapGuidesProps) {
  const guides = useMemo(() => {
    if (!isDragging || draggedIds.size === 0) return [];

    const dragged = items.filter((i) => draggedIds.has(i.id));
    const others = items.filter((i) => !draggedIds.has(i.id) && !i.archived);

    if (dragged.length === 0 || others.length === 0) return [];

    const lines: SnapLine[] = [];

    for (const d of dragged) {
      const de = getEdges(d);
      for (const o of others) {
        const oe = getEdges(o);

        // Vertical guides (x alignment)
        const xChecks = [
          { a: de.left, b: oe.left },
          { a: de.left, b: oe.right },
          { a: de.right, b: oe.left },
          { a: de.right, b: oe.right },
          { a: de.centerX, b: oe.centerX },
          { a: de.left, b: oe.centerX },
          { a: de.right, b: oe.centerX },
          { a: de.centerX, b: oe.left },
          { a: de.centerX, b: oe.right },
        ];
        for (const { a, b } of xChecks) {
          if (Math.abs(a - b) < SNAP_THRESHOLD) {
            const minY = Math.min(de.top, oe.top) - 20;
            const maxY = Math.max(de.bottom, oe.bottom) + 20;
            lines.push({ orientation: "v", position: b, start: minY, end: maxY });
          }
        }

        // Horizontal guides (y alignment)
        const yChecks = [
          { a: de.top, b: oe.top },
          { a: de.top, b: oe.bottom },
          { a: de.bottom, b: oe.top },
          { a: de.bottom, b: oe.bottom },
          { a: de.centerY, b: oe.centerY },
          { a: de.top, b: oe.centerY },
          { a: de.bottom, b: oe.centerY },
          { a: de.centerY, b: oe.top },
          { a: de.centerY, b: oe.bottom },
        ];
        for (const { a, b } of yChecks) {
          if (Math.abs(a - b) < SNAP_THRESHOLD) {
            const minX = Math.min(de.left, oe.left) - 20;
            const maxX = Math.max(de.right, oe.right) + 20;
            lines.push({ orientation: "h", position: b, start: minX, end: maxX });
          }
        }
      }
    }

    // Deduplicate lines that are very close together
    const deduped: SnapLine[] = [];
    for (const line of lines) {
      const exists = deduped.some(
        (d) =>
          d.orientation === line.orientation &&
          Math.abs(d.position - line.position) < 1
      );
      if (!exists) deduped.push(line);
    }

    return deduped;
  }, [draggedIds, items, isDragging]);

  if (guides.length === 0) return null;

  return (
    <>
      {guides.map((g, idx) =>
        g.orientation === "v" ? (
          <div
            key={`v-${idx}`}
            style={{
              position: "absolute",
              left: g.position,
              top: g.start,
              width: 0,
              height: g.end - g.start,
              borderLeft: "1px solid rgba(25, 25, 24, 0.35)",
              pointerEvents: "none",
              zIndex: 8999,
            }}
          />
        ) : (
          <div
            key={`h-${idx}`}
            style={{
              position: "absolute",
              left: g.start,
              top: g.position,
              width: g.end - g.start,
              height: 0,
              borderTop: "1px solid rgba(25, 25, 24, 0.35)",
              pointerEvents: "none",
              zIndex: 8999,
            }}
          />
        )
      )}
    </>
  );
}
