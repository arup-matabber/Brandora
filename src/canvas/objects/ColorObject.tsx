"use client";
import React, { useState } from "react";
import { ColorPicker } from "@/canvas/ColorPicker";

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!result) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function getLuminance(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
}

interface ColorObjectProps {
  content: { hex?: string; name?: string };
  onUpdate: (patch: { hex?: string; name?: string }) => void;
}

export function ColorObject({ content, onUpdate }: ColorObjectProps) {
  const [hex, setHex] = useState(content.hex ?? "#191918");
  const [pickerOpen, setPickerOpen] = useState(false);

  // Sync state when content prop updates externally (e.g. from sidebar or palette)
  React.useEffect(() => {
    if (content.hex && content.hex !== hex) {
      setHex(content.hex);
    }
  }, [content.hex]);

  const luminance = getLuminance(hex);
  const textColor = luminance > 160 ? "#191918" : "#FFFFFF";
  const rgb = hexToRgb(hex);

  const handleChange = (newHex: string) => {
    setHex(newHex);
    onUpdate({ hex: newHex });
  };

  return (
    <div
      className="w-full h-full rounded-lg overflow-visible flex flex-col"
      style={{ border: "1px solid rgba(0,0,0,0.08)", position: "relative" }}
    >
      {/* Color swatch — takes most of the height */}
      <button
        type="button"
        data-no-drag="true"
        onClick={(e) => {
          e.stopPropagation();
          setPickerOpen((p) => !p);
        }}
        style={{
          flex: 1,
          background: hex,
          border: "none",
          cursor: "pointer",
          display: "block",
          minHeight: "60%",
          borderRadius: "7px 7px 0 0",
        }}
      />

      {/* Footer */}
      <div
        className="px-3 py-2 flex flex-col gap-0.5"
        style={{ background: "#FFFFFF", borderTop: "1px solid #EBEBE7", borderRadius: "0 0 7px 7px" }}
      >
        <span
          className="font-mono text-[12px] text-ink"
          style={{ cursor: "default" }}
        >
          {hex.toUpperCase()}
        </span>
        {rgb && (
          <span className="text-[10px] text-ink-tertiary font-mono">
            {rgb.r} · {rgb.g} · {rgb.b}
          </span>
        )}
      </div>

      {/* Figma-style Color Picker popover */}
      {pickerOpen && (
        <>
          {/* Backdrop to close */}
          <div
            data-no-drag="true"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9998,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setPickerOpen(false);
            }}
          />
          <div
            data-no-drag="true"
            style={{
              position: "absolute",
              top: 0,
              left: "calc(100% + 8px)",
              zIndex: 9999,
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <ColorPicker hex={hex} onChange={handleChange} />
          </div>
        </>
      )}
    </div>
  );
}
