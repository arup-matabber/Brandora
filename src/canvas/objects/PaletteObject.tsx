"use client";
import React, { useState } from "react";
import { ColorPicker } from "@/canvas/ColorPicker";

export interface PaletteColor {
  hex: string;
  label: string;
}

interface PaletteObjectProps {
  content: { name?: string; colors?: (PaletteColor | string)[] };
  onUpdate: (patch: { name?: string; colors?: PaletteColor[] }) => void;
}

const DEFAULT_COLORS: PaletteColor[] = [
  { hex: "#191918", label: "Primary" },
  { hex: "#5A5A55", label: "Secondary" },
  { hex: "#BCBCB6", label: "Accent" },
  { hex: "#FBFBFA", label: "Background" },
];

function normalizeColors(raw?: (PaletteColor | string)[]): PaletteColor[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_COLORS;
  return raw.map((c, i) => {
    if (typeof c === "string") {
      return { hex: c || "#191918", label: `Color ${i + 1}` };
    }
    if (c && typeof c === "object") {
      return {
        hex: c.hex ?? "#191918",
        label: c.label ?? `Color ${i + 1}`,
      };
    }
    return { hex: "#191918", label: `Color ${i + 1}` };
  });
}

export function PaletteObject({ content, onUpdate }: PaletteObjectProps) {
  const [colors, setColors] = useState<PaletteColor[]>(() =>
    normalizeColors(content.colors)
  );
  const [name, setName] = useState(content.name ?? "Palette");
  const [activePickerIdx, setActivePickerIdx] = useState<number | null>(null);

  // Sync state when content prop updates externally (e.g. from sidebar)
  React.useEffect(() => {
    if (content.colors) {
      setColors(normalizeColors(content.colors));
    }
    if (content.name && content.name !== name) {
      setName(content.name);
    }
  }, [content.colors, content.name]);

  const handleColorChange = (idx: number, newHex: string) => {
    const next = colors.map((c, i) => (i === idx ? { ...c, hex: newHex } : c));
    setColors(next);
    onUpdate({ colors: next, name });
  };

  return (
    <div
      className="w-full h-full rounded-lg overflow-visible flex flex-col"
      style={{ border: "1px solid #EBEBE7", background: "#FFFFFF", position: "relative" }}
    >
      {/* Palette name */}
      <div className="px-3 pt-2.5 pb-1.5 border-b border-border-subtle shrink-0">
        <span className="text-[11px] font-mono uppercase tracking-widest text-ink-tertiary">
          {name}
        </span>
      </div>

      {/* Color strips */}
      <div className="flex flex-1 min-h-0">
        {colors.map((color, idx) => {
          const hex = color?.hex ?? "#191918";
          const label = color?.label ?? `Color ${idx + 1}`;
          const displayHex = hex.toUpperCase();

          return (
            <div key={idx} className="flex-1 flex flex-col relative">
              {/* Swatch — click to open picker */}
              <button
                type="button"
                data-no-drag="true"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePickerIdx(activePickerIdx === idx ? null : idx);
                }}
                style={{
                  flex: 1,
                  background: hex,
                  border: "none",
                  cursor: "pointer",
                  display: "block",
                  minHeight: 0,
                }}
              />

              {/* Label strip */}
              <div
                className="px-1.5 py-1 shrink-0"
                style={{
                  background: "rgba(255,255,255,0.95)",
                  borderTop: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <p className="font-mono text-[9px] text-ink truncate">{displayHex}</p>
                <p className="text-[9px] text-ink-tertiary truncate">{label}</p>
              </div>

              {/* Color Picker popover */}
              {activePickerIdx === idx && (
                <>
                  <div
                    data-no-drag="true"
                    style={{ position: "fixed", inset: 0, zIndex: 9998 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePickerIdx(null);
                    }}
                  />
                  <div
                    data-no-drag="true"
                    style={{
                      position: "absolute",
                      bottom: "calc(100% + 8px)",
                      left: "50%",
                      transform: "translateX(-50%)",
                      zIndex: 9999,
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <ColorPicker
                      hex={hex}
                      onChange={(newHex) => handleColorChange(idx, newHex)}
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
