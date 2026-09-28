"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { CanvasItem } from "@/lib/data";

export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

export interface SelectionState {
  ids: Set<string>;
}

export interface HistoryEntry {
  items: CanvasItem[];
}

export interface UseCanvasOptions {
  initialItems?: CanvasItem[];
  onItemsChange?: (items: CanvasItem[]) => void;
}

const MAX_SCALE = 4;
const MIN_SCALE = 0.08;
const HISTORY_LIMIT = 80;

function cloneItems(items: CanvasItem[]): CanvasItem[] {
  return JSON.parse(JSON.stringify(items));
}

export function useCanvas({ initialItems = [], onItemsChange }: UseCanvasOptions) {
  const [items, setItemsRaw] = useState<CanvasItem[]>(() => cloneItems(initialItems));
  const [transform, setTransform] = useState<CanvasTransform>({ x: 0, y: 0, scale: 1 });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [clipboard, setClipboard] = useState<CanvasItem[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  // Paste offset counter for staggering subsequent pastes
  const pasteCountRef = useRef(0);

  // History with deep immutable snapshots
  const historyRef = useRef<HistoryEntry[]>([{ items: cloneItems(initialItems) }]);
  const historyIndexRef = useRef(0);
  const suppressHistoryRef = useRef(false);

  // Keep onItemsChange callback in ref to prevent stale closures and unnecessary re-creations
  const onItemsChangeRef = useRef(onItemsChange);
  useEffect(() => {
    onItemsChangeRef.current = onItemsChange;
  }, [onItemsChange]);

  const setItems = useCallback(
    (updater: CanvasItem[] | ((prev: CanvasItem[]) => CanvasItem[]), recordHistory = true) => {
      setItemsRaw((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (recordHistory && !suppressHistoryRef.current) {
          // Trim forward history
          historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
          historyRef.current.push({ items: cloneItems(next) });
          if (historyRef.current.length > HISTORY_LIMIT) {
            historyRef.current.shift();
          } else {
            historyIndexRef.current++;
          }
        }
        // Asynchronously notify to prevent React warning
        if (typeof window !== "undefined") {
          queueMicrotask(() => {
            onItemsChangeRef.current?.(next);
          });
        }
        return next;
      });
    },
    []
  );

  // Sync when initialItems change (e.g. loaded from localStorage or added from Explore/Library)
  const syncedRef = useRef(false);
  const prevItemsLengthRef = useRef(initialItems.length);
  useEffect(() => {
    if (!syncedRef.current && initialItems.length > 0) {
      syncedRef.current = true;
      suppressHistoryRef.current = true;
      const cloned = cloneItems(initialItems);
      setItemsRaw(cloned);
      historyRef.current = [{ items: cloned }];
      historyIndexRef.current = 0;
      suppressHistoryRef.current = false;
      prevItemsLengthRef.current = initialItems.length;
    } else if (syncedRef.current && initialItems.length > prevItemsLengthRef.current) {
      // New items added to the project externally (e.g. via Explore "Add to Project" or Library)
      prevItemsLengthRef.current = initialItems.length;
      setItemsRaw((current) => {
        const currentIds = new Set(current.map((i) => i.id));
        const newItems = initialItems.filter((i) => !currentIds.has(i.id));
        if (newItems.length > 0) {
          const next = [...current, ...cloneItems(newItems)];
          if (!suppressHistoryRef.current) {
            historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
            historyRef.current.push({ items: cloneItems(next) });
            historyIndexRef.current = historyRef.current.length - 1;
          }
          return next;
        }
        return current;
      });
    }
  }, [initialItems]);

  // ── Transform helpers ──────────────────────────────────────────────
  const getDefaultOrigin = useCallback(() => {
    if (typeof window !== "undefined") {
      return { x: (window.innerWidth - 240) / 2, y: (window.innerHeight - 56) / 2 };
    }
    return { x: 400, y: 300 };
  }, []);

  const zoomTo = useCallback((newScale: number, origin?: { x: number; y: number }) => {
    setTransform((prev) => {
      const clampedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
      const targetOrigin = origin ?? getDefaultOrigin();
      const factor = clampedScale / prev.scale;
      const x = targetOrigin.x - (targetOrigin.x - prev.x) * factor;
      const y = targetOrigin.y - (targetOrigin.y - prev.y) * factor;
      return { x, y, scale: clampedScale };
    });
  }, [getDefaultOrigin]);

  const zoomBy = useCallback(
    (delta: number, origin?: { x: number; y: number }) => {
      setTransform((prev) => {
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * delta));
        const targetOrigin = origin ?? getDefaultOrigin();
        const factor = newScale / prev.scale;
        const x = targetOrigin.x - (targetOrigin.x - prev.x) * factor;
        const y = targetOrigin.y - (targetOrigin.y - prev.y) * factor;
        return { x, y, scale: newScale };
      });
    },
    [getDefaultOrigin]
  );

  const panBy = useCallback((dx: number, dy: number) => {
    setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const resetZoom = useCallback(() => {
    zoomTo(1);
  }, [zoomTo]);

  const fitToContent = useCallback(() => {
    const visibleItems = items.filter((i) => !i.archived);
    if (visibleItems.length === 0) {
      setTransform({ x: 0, y: 0, scale: 1 });
      return;
    }
    const minX = Math.min(...visibleItems.map((i) => i.x));
    const minY = Math.min(...visibleItems.map((i) => i.y));
    const maxX = Math.max(...visibleItems.map((i) => i.x + i.width));
    const maxY = Math.max(...visibleItems.map((i) => i.y + i.height));
    const contentW = maxX - minX + 120;
    const contentH = maxY - minY + 120;
    const vw = typeof window !== "undefined" ? window.innerWidth - 260 : 1000;
    const vh = typeof window !== "undefined" ? window.innerHeight - 80 : 700;
    const scale = Math.min(1.5, Math.max(0.2, Math.min(vw / contentW, vh / contentH)));
    const x = (vw - contentW * scale) / 2 - (minX - 60) * scale;
    const y = (vh - contentH * scale) / 2 - (minY - 60) * scale;
    setTransform({ x, y, scale });
  }, [items]);

  // ── Selection helpers ──────────────────────────────────────────────
  const selectId = useCallback((id: string, additive = false, isolateGroupMember = false) => {
    setSelectedIds((prev) => {
      const clickedItem = items.find((i) => i.id === id);
      const groupIds = (!isolateGroupMember && clickedItem?.groupId)
        ? items.filter((i) => i.groupId === clickedItem.groupId).map((i) => i.id)
        : [id];

      if (additive) {
        const next = new Set(prev);
        const allPresent = groupIds.every((gid) => next.has(gid));
        if (allPresent) {
          groupIds.forEach((gid) => next.delete(gid));
        } else {
          groupIds.forEach((gid) => next.add(gid));
        }
        return next;
      }
      return new Set(groupIds);
    });
  }, [items]);

  const selectIds = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.filter((i) => !i.archived).map((i) => i.id)));
  }, [items]);

  // ── CRUD ───────────────────────────────────────────────────────────
  const addItem = useCallback(
    (item: CanvasItem) => {
      setItems((prev) => {
        const maxZ = prev.reduce((m, i) => Math.max(m, i.zIndex ?? 0), 0);
        return [...prev, { ...item, zIndex: maxZ + 1 }];
      });
      setSelectedIds(new Set([item.id]));
    },
    [setItems]
  );

  const updateItem = useCallback(
    (id: string, patch: Partial<CanvasItem>, recordHistory = true) => {
      setItems(
        (prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        recordHistory
      );
    },
    [setItems]
  );

  const updateItems = useCallback(
    (patches: { id: string; patch: Partial<CanvasItem> }[], recordHistory = true) => {
      setItems(
        (prev) =>
          prev.map((i) => {
            const found = patches.find((p) => p.id === i.id);
            return found ? { ...i, ...found.patch } : i;
          }),
        recordHistory
      );
    },
    [setItems]
  );

  const updateItemsCommit = useCallback(
    (patches: { id: string; patch: Partial<CanvasItem> }[]) => {
      updateItems(patches, true);
    },
    [updateItems]
  );

  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const item = prev.find((i) => i.id === id);
        const toRemove = new Set<string>([id]);
        if (item && (item.type === "section" || item.type === "direction")) {
          prev.forEach((child) => {
            if (child.parentId === id || child.sectionId === id) {
              toRemove.add(child.id);
            }
          });
        }
        return prev.filter((i) => !toRemove.has(i.id));
      });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [setItems]
  );

  const removeSelected = useCallback((targetId?: string) => {
    let ids = new Set(selectedIds);
    if (targetId && !ids.has(targetId)) {
      ids = new Set([targetId]);
    }
    if (ids.size === 0) return;
    const toRemove = new Set<string>();

    ids.forEach((id) => {
      const item = items.find((i) => i.id === id);
      if (item && !item.locked) {
        toRemove.add(item.id);
        // If deleting a section or direction, cascading delete all its children
        if (item.type === "section" || item.type === "direction") {
          const dirX = item.x ?? 0;
          const dirY = item.y ?? 0;
          const dirW = item.width || 600;
          const dirH = item.height || 450;
          const explicitMemberIds: string[] = item.content?.memberIds || [];

          items.forEach((child) => {
            if (child.id === item.id) return;
            const isChild = child.parentId === item.id || child.sectionId === item.id;
            const isExplicit = explicitMemberIds.includes(child.id);
            const objCenterX = (child.x ?? 0) + (child.width || 100) / 2;
            const objCenterY = (child.y ?? 0) + (child.height || 80) / 2;
            const isContained =
              objCenterX >= dirX &&
              objCenterX <= dirX + dirW &&
              objCenterY >= dirY &&
              objCenterY <= dirY + dirH;

            if (isChild || isExplicit || isContained) {
              toRemove.add(child.id);
            }
          });
        }
      }
    });

    if (toRemove.size === 0) return;
    setItems((prev) => prev.filter((i) => !toRemove.has(i.id)));
    setSelectedIds(new Set());
  }, [selectedIds, items, setItems]);

  // ── Duplicate ──────────────────────────────────────────────────────
  const duplicateSelected = useCallback((targetId?: string) => {
    let ids = new Set(selectedIds);
    if (targetId && !ids.has(targetId)) {
      ids = new Set([targetId]);
    }
    if (ids.size === 0) return;
    const selectedItems = items.filter((i) => ids.has(i.id));
    const maxZ = items.reduce((m, i) => Math.max(m, i.zIndex ?? 0), 0);

    // Map old section IDs to new unique section IDs
    const sectionMap = new Map<string, string>();
    const groupMap = new Map<string, string>();
    const itemsToDuplicate: CanvasItem[] = [];
    const addedIds = new Set<string>();

    // Identify sections/directions and include their children for deep duplication
    selectedItems.forEach((item) => {
      itemsToDuplicate.push(item);
      addedIds.add(item.id);

      if (item.type === "section" || item.type === "direction") {
        const newSectionId = `${item.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        sectionMap.set(item.id, newSectionId);

        const dirX = item.x ?? 0;
        const dirY = item.y ?? 0;
        const dirW = item.width || 600;
        const dirH = item.height || 450;
        const explicitMemberIds: string[] = item.content?.memberIds || [];

        // Include all children of this section
        items.forEach((child) => {
          if (child.id === item.id || addedIds.has(child.id)) return;
          const isChild = child.parentId === item.id || child.sectionId === item.id;
          const isExplicit = explicitMemberIds.includes(child.id);
          const objCenterX = (child.x ?? 0) + (child.width || 100) / 2;
          const objCenterY = (child.y ?? 0) + (child.height || 80) / 2;
          const isContained =
            objCenterX >= dirX &&
            objCenterX <= dirX + dirW &&
            objCenterY >= dirY &&
            objCenterY <= dirY + dirH;

          if (isChild || isExplicit || isContained) {
            itemsToDuplicate.push(child);
            addedIds.add(child.id);
          }
        });
      }
    });

    itemsToDuplicate.forEach((item) => {
      if (item.groupId && !groupMap.has(item.groupId)) {
        groupMap.set(item.groupId, `group-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
      }
    });

    const newItems = itemsToDuplicate.map((i, idx) => {
      const isSection = i.type === "section" || i.type === "direction";
      const newId = isSection && sectionMap.has(i.id)
        ? sectionMap.get(i.id)!
        : `${i.type}-${Date.now()}-${idx}`;

      let newParentId = i.parentId ?? null;
      let newSectionId = i.sectionId ?? null;
      if (i.parentId && sectionMap.has(i.parentId)) {
        newParentId = sectionMap.get(i.parentId)!;
      }
      if (i.sectionId && sectionMap.has(i.sectionId)) {
        newSectionId = sectionMap.get(i.sectionId)!;
      }

      return {
        ...cloneItems([i])[0],
        id: newId,
        x: i.x + 32,
        y: i.y + 32,
        zIndex: maxZ + idx + 1,
        groupId: i.groupId ? groupMap.get(i.groupId) : undefined,
        parentId: newParentId,
        sectionId: newSectionId,
      };
    });

    setItems((prev) => [...prev, ...newItems]);
    setSelectedIds(new Set(newItems.map((i) => i.id)));
  }, [items, selectedIds, setItems]);

  // ── Copy / Paste ───────────────────────────────────────────────────
  const copySelected = useCallback((targetId?: string) => {
    let ids = new Set(selectedIds);
    if (targetId && !ids.has(targetId)) {
      ids = new Set([targetId]);
    }
    const toCopy = items.filter((i) => ids.has(i.id));
    if (toCopy.length > 0) {
      setClipboard(cloneItems(toCopy));
      pasteCountRef.current = 0;
      try {
        navigator.clipboard.writeText(JSON.stringify(toCopy, null, 2)).catch(() => {});
      } catch {}
    }
  }, [items, selectedIds]);

  const paste = useCallback(() => {
    if (clipboard.length === 0) return;
    pasteCountRef.current += 1;
    const offset = 24 * pasteCountRef.current;
    const maxZ = items.reduce((m, i) => Math.max(m, i.zIndex ?? 0), 0);

    const groupMap = new Map<string, string>();
    clipboard.forEach((item) => {
      if (item.groupId && !groupMap.has(item.groupId)) {
        groupMap.set(item.groupId, `group-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
      }
    });

    const newItems = clipboard.map((i, idx) => ({
      ...cloneItems([i])[0],
      id: `${i.type}-${Date.now()}-${idx}`,
      x: i.x + offset,
      y: i.y + offset,
      zIndex: maxZ + idx + 1,
      groupId: i.groupId ? groupMap.get(i.groupId) : undefined,
    }));
    setItems((prev) => [...prev, ...newItems]);
    setSelectedIds(new Set(newItems.map((i) => i.id)));
  }, [clipboard, items, setItems]);

  // ── Z-order ────────────────────────────────────────────────────────
  const bringForward = useCallback(
    (id: string) => {
      setItems((prev) => {
        const sorted = [...prev].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
        const idx = sorted.findIndex((i) => i.id === id);
        if (idx === -1 || idx === sorted.length - 1) return prev;
        const temp = sorted[idx];
        sorted[idx] = sorted[idx + 1];
        sorted[idx + 1] = temp;
        return sorted.map((item, index) => ({ ...item, zIndex: index + 1 }));
      });
    },
    [setItems]
  );

  const sendBackward = useCallback(
    (id: string) => {
      setItems((prev) => {
        const sorted = [...prev].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
        const idx = sorted.findIndex((i) => i.id === id);
        if (idx <= 0) return prev;
        const temp = sorted[idx];
        sorted[idx] = sorted[idx - 1];
        sorted[idx - 1] = temp;
        return sorted.map((item, index) => ({ ...item, zIndex: index }));
      });
    },
    [setItems]
  );

  const bringToFront = useCallback(
    (id: string) => {
      setItems((prev) => {
        const target = prev.find((i) => i.id === id);
        if (!target) return prev;
        const others = prev.filter((i) => i.id !== id);
        const reordered = [...others, target];
        return reordered.map((item, idx) => ({ ...item, zIndex: idx + 1 }));
      });
    },
    [setItems]
  );

  const sendToBack = useCallback(
    (id: string) => {
      setItems((prev) => {
        const target = prev.find((i) => i.id === id);
        if (!target) return prev;
        const others = prev.filter((i) => i.id !== id);
        const reordered = [target, ...others];
        return reordered.map((item, idx) => ({ ...item, zIndex: idx }));
      });
    },
    [setItems]
  );

  // ── Group / Ungroup ────────────────────────────────────────────────
  const groupSelected = useCallback((targetId?: string) => {
    let ids = new Set(selectedIds);
    if (targetId) {
      ids.add(targetId);
    }
    if (ids.size < 2 && targetId) {
      const target = items.find((i) => i.id === targetId);
      if (target && (target.type === "section" || target.type === "direction")) {
        const dirX = target.x ?? 0;
        const dirY = target.y ?? 0;
        const dirW = target.width || 600;
        const dirH = target.height || 450;
        items.forEach((child) => {
          if (child.id === target.id) return;
          const objCenterX = (child.x ?? 0) + (child.width || 100) / 2;
          const objCenterY = (child.y ?? 0) + (child.height || 80) / 2;
          if (
            child.parentId === target.id ||
            child.sectionId === target.id ||
            (objCenterX >= dirX && objCenterX <= dirX + dirW && objCenterY >= dirY && objCenterY <= dirY + dirH)
          ) {
            ids.add(child.id);
          }
        });
      }
    }
    if (ids.size < 2) return;
    const groupId = `group-${Date.now()}`;
    setItems((prev) =>
      prev.map((i) => (ids.has(i.id) ? { ...i, groupId } : i))
    );
    setSelectedIds(ids);
  }, [selectedIds, items, setItems]);

  const ungroupSelected = useCallback((targetId?: string) => {
    let ids = new Set(selectedIds);
    if (targetId) {
      ids.add(targetId);
    }
    if (ids.size === 0) return;

    const targetGroupIds = new Set<string>();
    items.forEach((i) => {
      if (ids.has(i.id) && i.groupId) {
        targetGroupIds.add(i.groupId);
      }
    });

    setItems((prev) =>
      prev.map((i) => {
        if (ids.has(i.id) || (i.groupId && targetGroupIds.has(i.groupId))) {
          return { ...i, groupId: undefined };
        }
        if (ids.has(i.parentId ?? "") || ids.has(i.sectionId ?? "")) {
          return { ...i, parentId: null, sectionId: null };
        }
        return i;
      })
    );
  }, [selectedIds, items, setItems]);

  // ── Lock / Unlock ──────────────────────────────────────────────────
  const lockItem = useCallback(
    (id: string) => {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, locked: true } : i))
      );
    },
    [setItems]
  );

  const unlockItem = useCallback(
    (id: string) => {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, locked: false } : i))
      );
    },
    [setItems]
  );

  const toggleLockSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    const selectedItems = items.filter((i) => selectedIds.has(i.id));
    const anyUnlocked = selectedItems.some((i) => !i.locked);
    setItems((prev) =>
      prev.map((i) => (selectedIds.has(i.id) ? { ...i, locked: anyUnlocked } : i))
    );
  }, [selectedIds, items, setItems]);

  // ── Archive / Restore ──────────────────────────────────────────────
  const archiveItem = useCallback(
    (id: string) => {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, archived: true } : i))
      );
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [setItems]
  );

  const restoreItem = useCallback(
    (id: string) => {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, archived: false } : i))
      );
    },
    [setItems]
  );

  const archiveSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    setItems((prev) =>
      prev.map((i) => (selectedIds.has(i.id) ? { ...i, archived: true } : i))
    );
    setSelectedIds(new Set());
  }, [selectedIds, setItems]);

  const archivedCount = items.filter((i) => i.archived).length;

  // ── Section containment ────────────────────────────────────────────
  const moveToSection = useCallback(
    (itemId: string, sectionId: string | null) => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? { ...i, parentId: sectionId ?? null, sectionId: sectionId ?? null }
            : i
        )
      );
    },
    [setItems]
  );

  /** After a drag ends, auto-assign parentId / sectionId based on center position */
  const autoAssignSection = useCallback(
    (itemId: string) => {
      setItems((prev) => {
        const item = prev.find((i) => i.id === itemId);
        if (!item || item.type === "section" || item.type === "direction") return prev;

        const cx = item.x + item.width / 2;
        const cy = item.y + item.height / 2;

        // Find containing section (prefer highest z-index / top-most section)
        const containingSection = [...prev]
          .filter((s) => s.type === "section" || s.type === "direction")
          .sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))
          .find(
            (s) =>
              s.id !== itemId &&
              cx >= s.x &&
              cx <= s.x + s.width &&
              cy >= s.y &&
              cy <= s.y + s.height
          );

        const newParentId = containingSection?.id ?? null;
        if ((item.parentId ?? null) === newParentId && (item.sectionId ?? null) === newParentId) {
          return prev;
        }

        return prev.map((i) =>
          i.id === itemId
            ? { ...i, parentId: newParentId, sectionId: newParentId }
            : i
        );
      }, false);
    },
    [setItems]
  );

  // ── Move selected (arrow keys, multi-drag) ─────────────────────────
  const moveSelectedBy = useCallback(
    (dx: number, dy: number) => {
      if (selectedIds.size === 0) return;
      setItems((prev) => {
        const toMove = new Set<string>();
        selectedIds.forEach((id) => toMove.add(id));
        prev.forEach((item) => {
          if (toMove.has(item.id) && (item.type === "section" || item.type === "direction")) {
            prev.forEach((child) => {
              if (child.parentId === item.id || child.sectionId === item.id) {
                toMove.add(child.id);
              }
            });
          }
        });
        return prev.map((i) => {
          if (!toMove.has(i.id) || i.locked) return i;
          return { ...i, x: i.x + dx, y: i.y + dy };
        });
      });
    },
    [selectedIds, setItems]
  );

  /** Move a section and all items contained in it */
  const moveSectionWithChildren = useCallback(
    (sectionId: string, dx: number, dy: number, recordHistory = true) => {
      setItems(
        (prev) =>
          prev.map((i) => {
            if (
              i.id === sectionId ||
              ((i.parentId === sectionId || i.sectionId === sectionId) && !i.locked)
            ) {
              return { ...i, x: i.x + dx, y: i.y + dy };
            }
            return i;
          }),
        recordHistory
      );
    },
    [setItems]
  );

  // ── Create Direction from selected ─────────────────────────────────
  const createDirectionFromSelected = useCallback(() => {
    if (selectedIds.size < 2) return;
    const selected = items.filter((i) => selectedIds.has(i.id));
    const memberIds = selected.map((i) => i.id);

    const cx = selected.reduce((s, i) => s + i.x + i.width / 2, 0) / selected.length;
    const cy = selected.reduce((s, i) => s + i.y + i.height / 2, 0) / selected.length;

    const typeCounts: Record<string, number> = {};
    selected.forEach((i) => {
      typeCounts[i.type] = (typeCounts[i.type] || 0) + 1;
    });
    const summary = Object.entries(typeCounts)
      .map(([t, c]) => `${c} ${t}${c > 1 ? "s" : ""}`)
      .join(", ");

    const id = `direction-${Date.now()}`;
    const directionItem: CanvasItem = {
      id,
      type: "direction",
      x: cx - 220,
      y: cy - 40,
      width: 440,
      height: 380,
      zIndex: 0,
      content: {
        name: `Direction ${items.filter((i) => i.type === "direction" || i.type === "section").length + 1}`,
        description: `Contains: ${summary}`,
        memberIds,
      },
    };

    setItems((prev) => [
      ...prev.map((i) =>
        selectedIds.has(i.id) ? { ...i, parentId: id, sectionId: id } : i
      ),
      directionItem,
    ]);
    setSelectedIds(new Set([id]));
  }, [items, selectedIds, setItems]);

  // ── Undo / Redo with deep cloning ───────────────────────────────────
  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const entry = historyRef.current[historyIndexRef.current];
    suppressHistoryRef.current = true;
    const restored = cloneItems(entry.items);
    setItemsRaw(restored);
    if (typeof window !== "undefined") {
      queueMicrotask(() => {
        onItemsChangeRef.current?.(restored);
      });
    }
    setSelectedIds((prev) => {
      const validIds = new Set(restored.map((i) => i.id));
      return new Set([...prev].filter((id) => validIds.has(id)));
    });
    suppressHistoryRef.current = false;
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const entry = historyRef.current[historyIndexRef.current];
    suppressHistoryRef.current = true;
    const restored = cloneItems(entry.items);
    setItemsRaw(restored);
    if (typeof window !== "undefined") {
      queueMicrotask(() => {
        onItemsChangeRef.current?.(restored);
      });
    }
    setSelectedIds((prev) => {
      const validIds = new Set(restored.map((i) => i.id));
      return new Set([...prev].filter((id) => validIds.has(id)));
    });
    suppressHistoryRef.current = false;
  }, []);

  // ── Rubber-band selection helper ───────────────────────────────────
  const selectInRect = useCallback(
    (rect: { x: number; y: number; width: number; height: number }, additive = false) => {
      const hit = items
        .filter((item) => {
          if (item.archived && !showArchived) return false;
          const iRight = item.x + item.width;
          const iBottom = item.y + item.height;
          const rRight = rect.x + rect.width;
          const rBottom = rect.y + rect.height;
          return (
            item.x < rRight &&
            iRight > rect.x &&
            item.y < rBottom &&
            iBottom > rect.y
          );
        })
        .map((i) => i.id);

      setSelectedIds((prev) => {
        if (additive) {
          const next = new Set(prev);
          hit.forEach((id) => next.add(id));
          return next;
        }
        return new Set(hit);
      });
    },
    [items, showArchived]
  );

  return {
    // State
    items,
    transform,
    selectedIds,
    clipboard,
    showArchived,
    archivedCount,
    // Transform
    zoomTo,
    zoomBy,
    panBy,
    resetZoom,
    fitToContent,
    setTransform,
    // Selection
    selectId,
    selectIds,
    deselectAll,
    selectAll,
    selectInRect,
    // CRUD
    addItem,
    updateItem,
    updateItems,
    updateItemsCommit,
    removeItem,
    removeSelected,
    // Operations
    duplicateSelected,
    copySelected,
    paste,
    // Z-order
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    // Group
    groupSelected,
    ungroupSelected,
    // Lock
    lockItem,
    unlockItem,
    toggleLockSelected,
    // Archive
    archiveItem,
    restoreItem,
    archiveSelected,
    setShowArchived,
    // Section
    moveToSection,
    autoAssignSection,
    moveSectionWithChildren,
    // Movement
    moveSelectedBy,
    // Direction
    createDirectionFromSelected,
    // History
    undo,
    redo,
  };
}
