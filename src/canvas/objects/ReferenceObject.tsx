"use client";
import React, { useState } from "react";
import { ImageIcon } from "lucide-react";

interface ReferenceObjectProps {
  content: { title?: string; source?: string; note?: string; url?: string };
  onUpdate: (patch: { title?: string; source?: string; note?: string; url?: string }) => void;
}

export function ReferenceObject({ content, onUpdate }: ReferenceObjectProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(content.title ?? "");
  const [source, setSource] = useState(content.source ?? "");
  const [note, setNote] = useState(content.note ?? "");

  const commit = () => {
    setEditing(false);
    onUpdate({ title, source, note });
  };

  return (
    <div
      className="w-full h-full rounded-lg overflow-hidden flex flex-col"
      style={{ border: "1px solid #EBEBE7", background: "#FFFFFF" }}
    >
      {/* Image area */}
      <div
        className="flex items-center justify-center"
        style={{
          flex: "1 1 60%",
          background: "#F6F6F4",
          borderBottom: "1px solid #EBEBE7",
        }}
      >
        {content.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={content.url}
            alt={title || "Reference"}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-ink-faint">
            <ImageIcon size={20} />
            <span className="text-[10px] font-mono uppercase tracking-wide">Reference</span>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div
        className="px-3 py-2.5 flex flex-col gap-1"
        style={{ flex: "0 0 auto" }}
        onDoubleClick={() => setEditing(true)}
      >
        {editing ? (
          <>
            <input
              autoFocus
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Escape") commit();
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              data-no-drag="true"
              className="w-full text-xs font-medium text-ink bg-transparent border-b border-border-subtle outline-none pb-0.5"
            />
            <input
              placeholder="Source (e.g. Pinterest, Behance)"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              data-no-drag="true"
              className="w-full text-[11px] text-ink-tertiary bg-transparent outline-none"
            />
            <input
              placeholder="Note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              data-no-drag="true"
              className="w-full text-[11px] text-ink-secondary bg-transparent outline-none"
            />
          </>
        ) : (
          <>
            <p className="text-xs font-medium text-ink leading-snug">
              {title || "Double-click to add title"}
            </p>
            {source && (
              <p className="text-[11px] text-ink-tertiary">{source}</p>
            )}
            {note && (
              <p className="text-[11px] text-ink-secondary italic">{note}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
