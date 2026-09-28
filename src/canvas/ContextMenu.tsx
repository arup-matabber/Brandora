"use client";
import React, { useEffect, useRef } from "react";
import {
  Copy,
  Trash2,
  Layers,
  ChevronsUp,
  ChevronsDown,
  ChevronUp,
  ChevronDown,
  Group,
  Lock,
  Unlock,
  Archive,
  RotateCcw,
  Navigation,
  Ungroup,
} from "lucide-react";

export type ContextMenuAction =
  | "edit"
  | "duplicate"
  | "copy"
  | "bringToFront"
  | "bringForward"
  | "sendBackward"
  | "sendToBack"
  | "group"
  | "ungroup"
  | "lock"
  | "unlock"
  | "archive"
  | "restore"
  | "createDirection"
  | "delete"
  | "saveToLibrary";

interface ContextMenuProps {
  x: number;
  y: number;
  multiSelect: boolean;
  itemType?: string;
  isLocked?: boolean;
  isArchived?: boolean;
  onAction: (action: ContextMenuAction) => void;
  onClose: () => void;
}

interface MenuItem {
  action: ContextMenuAction;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
}

export function ContextMenu({
  x,
  y,
  multiSelect,
  itemType,
  isLocked,
  isArchived,
  onAction,
  onClose,
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const canSaveToLibrary =
    !multiSelect && ["font", "color", "palette", "reference", "direction"].includes(itemType ?? "");

  const isSectionType = itemType === "section";

  const items: (MenuItem | "divider")[] = [];

  if (multiSelect) {
    items.push(
      { action: "duplicate", label: "Duplicate", icon: <Copy size={13} /> },
      { action: "group", label: "Group", icon: <Group size={13} /> },
      { action: "createDirection", label: "Create Direction", icon: <Navigation size={13} /> },
      "divider",
      isLocked
        ? { action: "unlock", label: "Unlock all", icon: <Unlock size={13} /> }
        : { action: "lock", label: "Lock all", icon: <Lock size={13} /> },
      { action: "archive", label: "Archive selection", icon: <Archive size={13} /> },
      "divider",
      { action: "delete", label: "Delete", icon: <Trash2 size={13} />, danger: true },
    );
  } else {
    items.push(
      { action: "duplicate", label: "Duplicate", icon: <Copy size={13} /> },
      { action: "copy", label: "Copy", icon: <Copy size={13} /> },
      "divider",
      { action: "bringToFront", label: "Bring to Front", icon: <ChevronsUp size={13} /> },
      { action: "bringForward", label: "Bring Forward", icon: <ChevronUp size={13} /> },
      { action: "sendBackward", label: "Send Backward", icon: <ChevronDown size={13} /> },
      { action: "sendToBack", label: "Send to Back", icon: <ChevronsDown size={13} /> },
      "divider",
      { action: "group", label: "Group with selection", icon: <Group size={13} /> },
      { action: "ungroup", label: "Ungroup", icon: <Ungroup size={13} /> },
    );

    // Lock / Unlock
    items.push("divider");
    if (isLocked) {
      items.push({ action: "unlock", label: "Unlock", icon: <Unlock size={13} /> });
    } else {
      items.push({ action: "lock", label: "Lock", icon: <Lock size={13} /> });
    }

    // Archive / Restore (not for sections)
    if (!isSectionType) {
      if (isArchived) {
        items.push({ action: "restore", label: "Restore", icon: <RotateCcw size={13} /> });
      } else {
        items.push({ action: "archive", label: "Archive", icon: <Archive size={13} /> });
      }
    }

    // Save to library
    if (canSaveToLibrary) {
      items.push({
        action: "saveToLibrary",
        label: "Save to Library",
        icon: <Layers size={13} />,
      });
    }

    items.push("divider");
    items.push({ action: "delete", label: "Delete", icon: <Trash2 size={13} />, danger: true });
  }

  // Clamp to viewport
  const menuWidth = 200;
  const menuHeight = items.length * 32 + 8;
  const clampedX = Math.min(x, (typeof window !== "undefined" ? window.innerWidth : 1400) - menuWidth - 8);
  const clampedY = Math.min(y, (typeof window !== "undefined" ? window.innerHeight : 900) - menuHeight - 8);

  return (
    <div
      ref={ref}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        left: clampedX,
        top: clampedY,
        width: menuWidth,
        zIndex: 99999,
      }}
      className="rounded-lg border border-border-subtle bg-surface shadow-lifted py-1 overflow-hidden"
    >
      {items.map((item, idx) => {
        if (item === "divider") {
          return <div key={idx} className="my-0.5 border-t border-border-subtle" />;
        }
        return (
          <button
            key={item.action + idx}
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onAction(item.action);
              onClose();
            }}
            className={`w-full px-3 py-1.5 text-left flex items-center gap-2.5 text-[12px] transition-colors cursor-pointer ${
              item.danger
                ? "text-red-600 hover:bg-red-50"
                : "text-ink hover:bg-surface-subtle"
            }`}
          >
            <span className={item.danger ? "text-red-500" : "text-ink-tertiary"}>
              {item.icon}
            </span>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
