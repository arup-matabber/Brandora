"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Type,
  StickyNote,
  Image,
  AlignLeft,
  Droplets,
  Layers,
  BookOpen,
  Sparkles,
  Layout,
  Navigation,
} from "lucide-react";
import { CanvasObjectType } from "@/lib/data";

interface QuickAddMenuProps {
  onAdd: (type: CanvasObjectType) => void;
}

interface QuickAddItem {
  type: CanvasObjectType;
  label: string;
  icon: React.ReactNode;
  group: "explore" | "organise" | "brand";
}

const ITEMS: QuickAddItem[] = [
  { type: "text", label: "Text", icon: <Type size={14} />, group: "explore" },
  { type: "note", label: "Note", icon: <StickyNote size={14} />, group: "explore" },
  { type: "image", label: "Image", icon: <Image size={14} />, group: "explore" },
  { type: "font", label: "Font", icon: <AlignLeft size={14} />, group: "explore" },
  { type: "color", label: "Color", icon: <Droplets size={14} />, group: "explore" },
  { type: "palette", label: "Palette", icon: <Layers size={14} />, group: "explore" },
  { type: "reference", label: "Reference", icon: <BookOpen size={14} />, group: "explore" },
  { type: "section", label: "Section", icon: <Layout size={14} />, group: "organise" },
  { type: "direction", label: "Direction", icon: <Navigation size={14} />, group: "organise" },
  { type: "brand_brain", label: "Brand Brain", icon: <Sparkles size={14} />, group: "brand" },
];

export function QuickAddMenu({ onAdd }: QuickAddMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const closeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeKey);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeKey);
    };
  }, [open]);

  const groups: { key: QuickAddItem["group"]; label: string }[] = [
    { key: "explore", label: "Add to canvas" },
    { key: "organise", label: "Organise" },
    { key: "brand", label: "Brand" },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-8 w-8 rounded-full flex items-center justify-center text-white shadow-subtle transition-transform hover:scale-105 active:scale-95"
        style={{ background: "#191918" }}
        title="Quick Add (press +)"
      >
        <Plus
          size={15}
          style={{
            transition: "transform 0.2s",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {open && (
        <div
          className="absolute bottom-11 left-1/2 -translate-x-1/2 w-52 rounded-xl border border-border-subtle bg-surface shadow-lifted overflow-hidden"
          style={{ zIndex: 9999 }}
        >
          {groups.map((group, gi) => {
            const groupItems = ITEMS.filter((i) => i.group === group.key);
            return (
              <div key={group.key}>
                {gi > 0 && <div className="border-t border-border-subtle mx-2" />}
                <div className="px-3 pt-2.5 pb-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary">
                    {group.label}
                  </span>
                </div>
                {groupItems.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      onAdd(item.type);
                      setOpen(false);
                    }}
                    className="w-full px-3 py-2 flex items-center gap-2.5 text-[13px] text-ink hover:bg-surface-subtle transition-colors"
                  >
                    <span className="text-ink-tertiary">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            );
          })}
          <div className="pb-2" />
        </div>
      )}
    </div>
  );
}
