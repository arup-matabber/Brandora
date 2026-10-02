"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  CheckCircle2,
  RotateCcw,
  Send,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Comment, DirectionVersion, BrandProject } from "@/lib/data";
import { useProjects } from "@/lib/projects-context";

interface DesignerCommentViewerProps {
  version: DirectionVersion;
  project?: BrandProject;
  projectId?: string;
}

export function DesignerCommentViewer({ version, project, projectId }: DesignerCommentViewerProps) {
  const { getComments, addComment, resolveComment, getApproval } = useProjects();

  const allComments = getComments(version.directionId, version.id);
  const approval = getApproval(version.directionId, version.id);
  const topLevel = allComments.filter((c) => !c.parentId);
  const getReplies = (id: string) => allComments.filter((c) => c.parentId === id);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [expanded, setExpanded] = useState(true);

  const handleDesignerReply = (parentId: string) => {
    if (!replyBody.trim()) return;
    addComment({
      projectId: projectId || project?.id || version.directionId,
      directionId: version.directionId,
      versionId: version.id,
      authorId: "designer",
      authorName: "You",
      body: replyBody.trim(),
      parentId,
    });
    setReplyBody("");
    setReplyingTo(null);
  };

  const statusInfo = approval
    ? approval.status === "APPROVED"
      ? { icon: <CheckCircle2 size={14} className="text-emerald-600" />, label: "Approved", color: "text-emerald-700 bg-emerald-50 border-emerald-200/60" }
      : approval.status === "CHANGES_REQUESTED"
      ? { icon: <RotateCcw size={14} className="text-amber-600" />, label: "Changes Requested", color: "text-amber-700 bg-amber-50 border-amber-200/60" }
      : null
    : null;

  return (
    <div className="space-y-4">
      {/* Approval status */}
      {statusInfo && (
        <div className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-full border w-fit ${statusInfo.color}`}>
          {statusInfo.icon}
          <span>{statusInfo.label}</span>
          {approval?.clientName && (
            <span className="text-[10px] font-mono opacity-70">· {approval.clientName}</span>
          )}
        </div>
      )}
      {approval?.status === "CHANGES_REQUESTED" && approval.comment && (
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 px-4 py-3 text-sm text-amber-800 leading-relaxed">
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-600/80 block mb-1">Client feedback</span>
          "{approval.comment}"
        </div>
      )}

      {/* Comments toggle */}
      <button
        type="button"
        onClick={() => setExpanded((s) => !s)}
        className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-ink-tertiary hover:text-ink transition-colors cursor-pointer"
      >
        <MessageSquare size={12} />
        Comments ({allComments.length})
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {expanded && (
        <div className="space-y-4">
          {topLevel.length === 0 ? (
            <p className="text-xs text-ink-tertiary py-2">No comments yet.</p>
          ) : (
            topLevel.map((comment) => {
              const replies = getReplies(comment.id);
              const isDesigner = comment.authorId === "designer";
              return (
                <div key={comment.id} className={`space-y-2 ${comment.resolved ? "opacity-40" : ""}`}>
                  <div className="flex gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5 ${isDesigner ? "bg-ink text-white" : "bg-stone-200 text-ink-secondary"}`}>
                      {isDesigner ? "D" : comment.authorName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-ink">
                          {isDesigner ? "You (Designer)" : comment.authorName}
                        </span>
                        <span className="text-[10px] text-ink-tertiary font-mono">
                          {new Date(comment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        {comment.resolved && (
                          <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/60">resolved</span>
                        )}
                      </div>
                      <p className="text-xs text-ink leading-relaxed">{comment.body}</p>
                      {!comment.resolved && (
                        <div className="flex items-center gap-3 mt-1.5">
                          <button
                            type="button"
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className="text-[11px] text-ink-tertiary hover:text-ink transition-colors cursor-pointer"
                          >
                            Reply
                          </button>
                          <button
                            type="button"
                            onClick={() => resolveComment(comment.id)}
                            className="text-[11px] text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                          >
                            Resolve
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Replies */}
                  {replies.length > 0 && (
                    <div className="ml-9 pl-3 border-l border-border-subtle space-y-2">
                      {replies.map((reply) => {
                        const replyIsDesigner = reply.authorId === "designer";
                        return (
                          <div key={reply.id} className="flex gap-2">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0 mt-0.5 ${replyIsDesigner ? "bg-ink text-white" : "bg-stone-200 text-ink-secondary"}`}>
                              {replyIsDesigner ? "D" : reply.authorName.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-[11px] font-semibold text-ink">
                                {replyIsDesigner ? "You" : reply.authorName}
                              </span>
                              <p className="text-xs text-ink leading-relaxed">{reply.body}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Designer reply input */}
                  {replyingTo === comment.id && (
                    <div className="ml-9 flex gap-2">
                      <textarea
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        rows={2}
                        placeholder="Write a reply…"
                        autoFocus
                        className="flex-1 rounded-xl border border-border-subtle bg-surface-subtle px-3 py-2 text-xs text-ink outline-none focus:border-ink/30 resize-none placeholder:text-ink-tertiary"
                      />
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => handleDesignerReply(comment.id)}
                          className="p-1.5 rounded-full bg-ink text-white hover:bg-[#2E2E2C] transition-colors cursor-pointer"
                        >
                          <Send size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setReplyingTo(null); setReplyBody(""); }}
                          className="p-1.5 rounded-full border border-border-subtle text-ink-tertiary hover:text-ink transition-colors cursor-pointer"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
