"use client";
import React, { useState, useRef, useEffect } from "react";

interface TextObjectProps {
  content: {
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: number | string;
    lineHeight?: number | string;
    textAlign?: "left" | "center" | "right";
    letterSpacing?: string;
    color?: string;
  };
  onUpdate: (patch: Record<string, any>) => void;
}

export function TextObject({ content, onUpdate }: TextObjectProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(content.text ?? "Start typing...");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setText(content.text ?? "Start typing...");
  }, [content.text]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const val = ref.current?.innerText ?? text;
    setText(val);
    onUpdate({ text: val });
  };

  return (
    <div
      className="w-full h-full flex items-start p-3"
      onDoubleClick={() => setEditing(true)}
    >
      <div
        ref={ref}
        contentEditable={editing}
        suppressContentEditableWarning
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") commit();
          e.stopPropagation();
        }}
        onClick={(e) => editing && e.stopPropagation()}
        style={{
          outline: "none",
          fontSize: content.fontSize ?? 14,
          fontWeight: content.fontWeight ?? 400,
          lineHeight: content.lineHeight ?? 1.5,
          color: content.color ?? "#191918",
          fontFamily: content.fontFamily ?? "inherit",
          textAlign: content.textAlign ?? "left",
          letterSpacing: content.letterSpacing ?? "normal",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          width: "100%",
          minHeight: 20,
          cursor: editing ? "text" : "default",
        }}
      >
        {text}
      </div>
    </div>
  );
}
