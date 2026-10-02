"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Trash2, Users } from "lucide-react";
import type { ClientRecord, BrandProject } from "@/lib/data";
import { Avatar } from "@/components/ui/Avatar";
import { useProjects } from "@/lib/projects-context";
import { ClientStatusBadge } from "./ClientStatusBadge";
import { DeleteClientModal } from "./DeleteClientModal";
import { clientInitials, formatClientDate } from "./helpers";

const GRID =
  "grid grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,1.1fr)_60px] gap-4 items-center";

interface ClientListProps {
  clients: ClientRecord[];
  projects: BrandProject[];
  emptyTitle?: string;
  emptyBody?: string;
}

export function ClientList({
  clients,
  projects,
  emptyTitle = "No clients yet",
  emptyBody = "Add your first client to start tracking partnerships and brand workspaces.",
}: ClientListProps) {
  const { deleteClient } = useProjects();
  const [clientToDelete, setClientToDelete] = useState<ClientRecord | null>(null);

  if (clients.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-subtle bg-surface/50 p-14 text-center">
        <div className="mx-auto h-11 w-11 rounded-full bg-surface-muted flex items-center justify-center text-ink-tertiary mb-3">
          <Users size={18} />
        </div>
        <h3 className="text-sm font-semibold text-ink">{emptyTitle}</h3>
        <p className="mt-1 text-xs text-ink-secondary max-w-sm mx-auto leading-relaxed">{emptyBody}</p>
      </div>
    );
  }

  const projectCount = (name: string) =>
    projects.filter((p) => (p.client || "").toLowerCase() === name.toLowerCase()).length;

  return (
    <>
      <div className="rounded-xl border border-border-subtle bg-surface overflow-hidden">
        {/* Column header */}
        <div className={`${GRID} px-4 py-2.5 border-b border-border-subtle`}>
          <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary">Name</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary">Company</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary">Status</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary">Projects</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary">Last Activity</span>
          <span />
        </div>

        <div className="divide-y divide-border-subtle">
          {clients.map((client) => {
            const count = projectCount(client.name);
            return (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className={`${GRID} group px-4 py-3 hover:bg-surface-subtle transition-colors`}
              >
                {/* Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar initials={clientInitials(client.name)} size="sm" name={client.name} />
                  <span className="text-sm font-semibold text-ink truncate">{client.name}</span>
                </div>

                {/* Company */}
                <span className="text-xs text-ink-secondary truncate">{client.company || "—"}</span>

                {/* Status */}
                <div>
                  <ClientStatusBadge status={client.status} />
                </div>

                {/* Projects */}
                <span className="text-xs font-mono text-ink-secondary">
                  {count}
                  {count === 1 ? " project" : " projects"}
                </span>

                {/* Last activity */}
                <span className="text-xs text-ink-tertiary truncate">
                  {formatClientDate(client.updatedAt)}
                </span>

                {/* Actions affordance */}
                <div className="flex items-center justify-end gap-1 justify-self-end">
                  <button
                    type="button"
                    title={`Delete ${client.name}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setClientToDelete(client);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full text-ink-tertiary hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ArrowUpRight
                    size={14}
                    className="text-ink-tertiary opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {clientToDelete && (
        <DeleteClientModal
          clientName={clientToDelete.name}
          onClose={() => setClientToDelete(null)}
          onConfirm={() => {
            deleteClient(clientToDelete.id);
            setClientToDelete(null);
          }}
        />
      )}
    </>
  );
}
