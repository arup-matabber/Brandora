"use client";
import React from "react";
import { ImageIcon, Upload } from "lucide-react";

interface ImageObjectProps {
  content: { filename?: string; url?: string; caption?: string };
  onUpdate: (patch: { filename?: string; url?: string; caption?: string }) => void;
}

export function ImageObject({ content, onUpdate }: ImageObjectProps) {
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onUpdate({ filename: file.name, url });
  };

  return (
    <div
      className="w-full h-full rounded-lg overflow-hidden flex flex-col"
      style={{ border: "1px solid #EBEBE7", background: "#F6F6F4" }}
    >
      {content.url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={content.url}
            alt={content.filename ?? "Image"}
            className="flex-1 w-full object-cover"
            style={{ minHeight: 0 }}
            draggable={false}
          />
          {content.filename && (
            <div
              className="px-3 py-1.5 text-[11px] text-ink-tertiary font-mono truncate"
              style={{ borderTop: "1px solid #EBEBE7", background: "#FFFFFF" }}
            >
              {content.filename}
            </div>
          )}
        </>
      ) : (
        <label
          className="flex-1 flex flex-col items-center justify-center gap-2 cursor-pointer group"
          data-no-drag="true"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFilePick}
          />
          <div className="h-9 w-9 rounded-full bg-surface border border-border-subtle flex items-center justify-center text-ink-tertiary group-hover:text-ink transition-colors">
            <ImageIcon size={16} />
          </div>
          <span className="text-xs text-ink-tertiary group-hover:text-ink transition-colors">
            Click to add image
          </span>
        </label>
      )}
    </div>
  );
}
