"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Search, X, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useProjects } from "@/lib/projects-context";
import { ClientList } from "@/components/clients/ClientList";
import { AddClientModal } from "@/components/clients/AddClientModal";

type View = "overview" | "leads" | "active" | "all" | "followups";

const VIEWS: { id: View; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "leads", label: "Leads" },
  { id: "active", label: "Active Clients" },
  { id: "all", label: "All Clients" },
  { id: "followups", label: "Follow-ups" },
];

export default function ClientsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-xs text-ink-tertiary">Loading clients…</div>}>
      <ClientsContent />
    </React.Suspense>
  );
}

function ClientsContent() {
  const searchParams = useSearchParams();
  const view = (searchParams.get("view") as View) || "overview";

  const { clients, projects } = useProjects();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const leads = clients.filter((c) => c.status === "Lead");
  const active = clients.filter((c) => c.status === "Active");
  const counts: Record<View, number> = {
    overview: clients.length,
    leads: leads.length,
    active: active.length,
    all: clients.length,
    followups: 0,
  };

  const recent = [...clients]
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
    .slice(0, 4);

  const q = searchQuery.trim().toLowerCase();
  const searchedAll = q
    ? clients.filter((c) =>
        [c.name, c.company || "", c.email || "", c.status].join(" ").toLowerCase().includes(q)
      )
    : clients;

  const stats = [
    { label: "Total clients", value: clients.length },
    { label: "Leads", value: leads.length },
    { label: "Active", value: active.length },
    { label: "Linked projects", value: projects.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="pb-5 border-b border-border-subtle">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary block mb-1">
              Client Directory
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">Clients</h1>
            <p className="mt-1 text-xs sm:text-sm text-ink-secondary">
              Your partnerships, contacts, and the brand work behind them.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#111827] hover:bg-[#1E1B4B] text-white text-xs sm:text-sm font-medium transition-all shadow-sm self-start sm:self-auto shrink-0"
          >
            <Plus size={15} className="text-white shrink-0" />
            <span>Add Client</span>
          </button>
        </div>

        {/* Sub-navigation */}
        <nav className="mt-5 flex items-center gap-1.5 p-1 rounded-full bg-stone-100/80 border border-black/[0.04] text-xs w-fit max-w-full overflow-x-auto">
          {VIEWS.map((v) => (
            <Link
              key={v.id}
              href={`/clients?view=${v.id}`}
              className={`px-3.5 py-1.5 rounded-full font-medium transition-all whitespace-nowrap flex items-center gap-1.5 text-xs ${
                view === v.id
                  ? "bg-white text-ink shadow-sm font-semibold"
                  : "text-ink-secondary hover:text-ink hover:bg-white/50"
              }`}
            >
              <span>{v.label}</span>
              <span className="font-mono text-[10px] text-ink-tertiary">({counts[v.id]})</span>
            </Link>
          ))}
        </nav>
      </header>

      {/* Overview */}
      {view === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {stats.map((s) => (
              <div key={s.label} className="rounded-[24px] border border-black/[0.06] bg-white p-5 shadow-sm">
                <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">{s.value}</p>
                <p className="text-[11px] font-mono text-ink-tertiary mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <section>
            <SectionHeader
              title="Recent clients"
              description="Recently updated records"
              actionHref="/clients?view=all"
              actionLabel="View all"
            />
            <ClientList
              clients={recent}
              projects={projects}
              emptyTitle="No clients yet"
              emptyBody="Add a client to begin tracking partnerships and brand workspaces."
            />
          </section>
        </div>
      )}

      {/* Leads */}
      {view === "leads" && (
        <ClientList
          clients={leads}
          projects={projects}
          emptyTitle="No leads yet"
          emptyBody="New, not-yet-started client relationships will appear here."
        />
      )}

      {/* Active clients */}
      {view === "active" && (
        <ClientList
          clients={active}
          projects={projects}
          emptyTitle="No active clients yet"
          emptyBody="Clients with an active engagement will appear here."
        />
      )}

      {/* All clients */}
      {view === "all" && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, company, email, or status…"
              className="w-full h-10 pl-9 pr-8 text-xs bg-white rounded-full border border-black/[0.06] placeholder:text-ink-tertiary focus:border-ink focus:outline-none transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink p-1"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <ClientList
            clients={searchedAll}
            projects={projects}
            emptyTitle={q ? "No clients match" : "No clients yet"}
            emptyBody={q ? "Try a different search or clear the filter." : "Add your first client to get started."}
          />
        </div>
      )}

      {/* Follow-ups (placeholder) */}
      {view === "followups" && (
        <div className="rounded-xl border border-dashed border-border-subtle bg-surface/50 p-14 text-center">
          <div className="mx-auto h-11 w-11 rounded-full bg-surface-muted flex items-center justify-center text-ink-tertiary mb-3">
            <CalendarClock size={18} />
          </div>
          <h3 className="text-sm font-semibold text-ink">No follow-ups scheduled</h3>
          <p className="mt-1 text-xs text-ink-secondary max-w-sm mx-auto leading-relaxed">
            Reminders and touchpoints for each client will live here. This area is ready to receive
            follow-up items in a later chunk.
          </p>
        </div>
      )}

      {isAddOpen && <AddClientModal onClose={() => setIsAddOpen(false)} />}
    </div>
  );
}
