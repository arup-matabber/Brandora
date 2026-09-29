"use client";
import React, { useState, useRef, useEffect } from "react";

interface NoteObjectProps {
  content: {
    text?: string;
    bg?: string;
    color?: string;
    borderColor?: string;
    fontSize?: number;
  };
  onUpdate: (patch: Record<string, any>) => void;
}

export function NoteObject({ content, onUpdate }: NoteObjectProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(content.text ?? "");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(content.text ?? "");
  }, [content.text]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    onUpdate({ text });
  };

  const bg = content.bg ?? "rgba(251,251,250,0.95)";
  const borderColor = content.borderColor ?? "#EBEBE7";
  const textColor = content.color ?? "#191918";
  const fontSize = content.fontSize ?? 13;

  return (
    <div
      className="w-full h-full rounded-lg"
      style={{
        background: bg,
        border: `1px solid ${borderColor}`,
        padding: "10px 12px",
      }}
      onDoubleClick={() => setEditing(true)}
    >
      {editing ? (
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") commit();
            e.stopPropagation();
          }}
          onClick={(e) => e.stopPropagation()}
          placeholder="Write a note..."
          style={{
            width: "100%",
            height: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            fontSize,
            lineHeight: 1.55,
            color: textColor,
            fontFamily: "inherit",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            fontSize,
            lineHeight: 1.55,
            color: textColor,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflow: "hidden",
            cursor: "default",
          }}
        >
          {text || (
            <span style={{ color: "#8F8E88", fontStyle: "italic" }}>
              Double-click to write note...
            </span>
          )}
        </div>
      )}
    </div>
  );
}
