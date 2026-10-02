"use client";

import React from "react";

export type ClientStatus = "Lead" | "Active" | "Inactive";

const DOT: Record<ClientStatus, string> = {
  Active: "bg-ink",
  Lead: "bg-ink-tertiary",
  Inactive: "bg-border-dark",
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border-subtle bg-surface-subtle text-[10px] font-mono uppercase tracking-wider text-ink-secondary whitespace-nowrap">
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} />
      {status}
    </span>
  );
}
