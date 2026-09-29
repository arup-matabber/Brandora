"use client";
import React, { useState } from "react";
import { Send, Layers, ExternalLink, Check } from "lucide-react";

interface DirectionObjectProps {
  content: {
    name?: string;
    description?: string;
    published?: boolean;
    publishedVersion?: number;
    lastPublishedAt?: string;
    reviewStatus?: string;
    approvedBy?: string;
    approvedAt?: string;
    memberIds?: string[];
  };
  memberCount?: number;
  onUpdate: (patch: {
    name?: string;
    description?: string;
    published?: boolean;
    publishedVersion?: number;
    lastPublishedAt?: string;
    reviewStatus?: string;
    approvedBy?: string;
    approvedAt?: string;
    memberIds?: string[];
  }) => void;
  onPublish?: () => void;
  onViewClientPortal?: () => void;
}

export function DirectionObject({
  content,
  memberCount: propMemberCount,
  onUpdate,
  onPublish,
  onViewClientPortal,
}: DirectionObjectProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(content.name ?? "Direction 01");
  const [description, setDescription] = useState(content.description ?? "");
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublishClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPublishing(true);
    onPublish?.();
    setTimeout(() => setIsPublishing(false), 2000);
  };

  // Sync state when content prop updates externally (e.g. from sidebar)
  React.useEffect(() => {
    if (content.name && content.name !== name) {
      setName(content.name);
    }
    if (content.description !== undefined && content.description !== description) {
      setDescription(content.description);
    }
  }, [content.name, content.description]);

  const commit = () => {
    setEditing(false);
    onUpdate({ name, description });
  };

  const memberCount = propMemberCount ?? content.memberIds?.length ?? 0;

  return (
    <div
      className="w-full h-full rounded-xl flex flex-col overflow-hidden"
      style={{
        border: "1.5px solid #191918",
        background: "rgba(251,251,250,0.97)",
      }}
    >
      {/* Header band */}
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderBottom: "1px solid #EBEBE7" }}
      >
        <div
          className="flex items-center gap-2"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
        >
          <span
            className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded"
            style={{ background: "#191918", color: "#FFFFFF" }}
          >
            Direction
          </span>
          {editing ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") commit();
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              data-no-drag="true"
              className="text-sm font-semibold text-ink bg-transparent border-b border-border-subtle outline-none"
              style={{ width: 180 }}
            />
          ) : (
            <span className="text-sm font-semibold text-ink tracking-tight">{name}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {content.published && content.publishedVersion ? (
            <div className="flex items-center gap-1.5">
              {content.reviewStatus === "APPROVED" ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold flex items-center gap-1">
                  ✓ Approved
                </span>
              ) : content.reviewStatus === "CHANGES_REQUESTED" ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-semibold flex items-center gap-1">
                  Revisions Requested
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium">
                  v{content.publishedVersion} Published
                </span>
              )}
              {onViewClientPortal && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewClientPortal();
                  }}
                  data-no-drag="true"
                  className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-black/[0.08] hover:border-black/20 bg-white text-ink hover:bg-stone-50 transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="Open in Client Portal"
                >
                  <ExternalLink size={9} />
                  <span>Portal</span>
                </button>
              )}
              <button
                type="button"
                onClick={handlePublishClick}
                data-no-drag="true"
                className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-ink hover:bg-[#1E1B4B] text-white transition-colors cursor-pointer shadow-sm active:scale-95"
              >
                {isPublishing ? <Check size={10} className="text-emerald-400" /> : <Send size={10} />}
                <span>{isPublishing ? "Published!" : `Publish v${(content.publishedVersion || 1) + 1}`}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-ink-tertiary border border-black/[0.06]">
                Draft
              </span>
              <button
                type="button"
                onClick={handlePublishClick}
                data-no-drag="true"
                className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-ink hover:bg-[#1E1B4B] text-white transition-colors cursor-pointer shadow-sm active:scale-95"
              >
                {isPublishing ? <Check size={10} className="text-emerald-400" /> : <Send size={10} />}
                <span>{isPublishing ? "Published!" : "Publish for Client"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Member summary */}
      {memberCount > 0 && (
        <div
          className="px-4 py-1.5 flex items-center gap-1.5"
          style={{ borderBottom: "1px solid #F0F0EC", background: "#F9F9F7" }}
        >
          <Layers size={10} style={{ color: "#9E9E98" }} />
          <span
            style={{
              fontSize: 10,
              color: "#9E9E98",
              fontFamily: "monospace",
            }}
          >
            {memberCount} creative element{memberCount !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Body */}
      <div
        className="flex-1 px-4 py-3"
        onDoubleClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
      >
        {editing ? (
          <textarea
            placeholder="Describe this direction..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Escape") commit();
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            data-no-drag="true"
            className="w-full h-full resize-none bg-transparent outline-none text-xs text-ink-secondary leading-relaxed"
          />
        ) : (
          <p className="text-xs text-ink-secondary leading-relaxed">
            {description || "Double-click to describe this creative direction..."}
          </p>
        )}
      </div>
    </div>
  );
}
