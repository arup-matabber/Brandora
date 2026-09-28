"use client";
import React from "react";

interface SelectionBoxProps {
  rect: { x: number; y: number; width: number; height: number } | null;
}

export function SelectionBox({ rect }: SelectionBoxProps) {
  if (!rect || rect.width === 0 || rect.height === 0) return null;

  const left = rect.width >= 0 ? rect.x : rect.x + rect.width;
  const top = rect.height >= 0 ? rect.y : rect.y + rect.height;
  const width = Math.abs(rect.width);
  const height = Math.abs(rect.height);

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        border: "1px solid rgba(25,25,24,0.4)",
        background: "rgba(25,25,24,0.04)",
        borderRadius: 3,
        pointerEvents: "none",
        zIndex: 9000,
      }}
    />
  );
}
