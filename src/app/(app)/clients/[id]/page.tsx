"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Clock,
  CalendarClock,
  FolderOpen,
  CheckCircle2,
  Sparkles,
  Trash2,
  User,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { ActivityItem } from "@/components/ui/ActivityItem";
import { ClientStatusBadge } from "@/components/clients/ClientStatusBadge";
import { DeleteClientModal } from "@/components/clients/DeleteClientModal";
import { ClientReviewViewer } from "@/components/clients/ClientReviewViewer";
import { ShareReviewModal } from "@/components/clients/ShareReviewModal";
import { clientInitials, formatClientDate } from "@/components/clients/helpers";
import { useProjects } from "@/lib/projects-context";
import type { DirectionVersion, ClientReview, BrandProject } from "@/lib/data";

function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  href?: string;
}) {
  return (
    <div>
      <dt className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary mb-1 flex items-center gap-1.5">
        {icon}
        {label}
      </dt>
      <dd className="text-sm text-ink break-words">
        {value ? (
          href ? (
            <a href={href} className="hover:underline underline-offset-2">
              {value}
            </a>
          ) : (
            value
          )
        ) : (
          <span className="text-ink-tertiary">—</span>
        )}
      </dd>
    </div>
  );
}

function Placeholder({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border-subtle bg-surface/50 p-5 text-center">
      <div className="mx-auto h-9 w-9 rounded-full bg-surface-muted flex items-center justify-center text-ink-tertiary mb-2.5">
        {icon}
      </div>
      <h3 className="text-xs font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-[11px] text-ink-tertiary leading-relaxed">{body}</p>
    </div>
  );
}

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const {
    getClient,
    projects,
    activity,
    updateClient,
    deleteClient,
    getReviewsForClient,
    getDirectionVersions,
  } = useProjects();
  const client = getClient(id);

  const [notes, setNotes] = useState<string | null>(null);
  const [notesSaved, setNotesSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [shareProject, setShareProject] = useState<BrandProject | null>(null);
  const [activeReviewItem, setActiveReviewItem] = useState<{
    review: ClientReview;
    version: DirectionVersion;
    project?: BrandProject;
  } | null>(null);
  // Dates are computed from Date.now()/locale, which differ between server and
  // client — render them only after mount to avoid a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!client) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-semibold text-ink">Client not found</h2>
        <p className="mt-2 text-xs text-ink-secondary">
          This client record does not exist or has been removed.
        </p>
        <Link href="/clients" className="mt-4">
          <Button variant="primary" size="sm">
            Back to Clients
          </Button>
        </Link>
      </div>
    );
  }

  const clientProjects = projects.filter(
    (p) => (p.client || "").toLowerCase() === client.name.toLowerCase()
  );
  const clientActivity = activity.filter((a) => clientProjects.some((p) => p.name === a.project));

  const notesValue = notes ?? client.notes ?? "";
  const notesChanged = notesValue.trim() !== (client.notes ?? "").trim();

  const saveNotes = () => {
    updateClient(client.id, { notes: notesValue.trim() || undefined });
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 1500);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Back + header */}
      <div>
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-xs text-ink-tertiary hover:text-ink transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          <span>Back to Clients</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border-subtle">
          <div className="flex items-center gap-4">
            <Avatar initials={clientInitials(client.name)} size="lg" name={client.name} />
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-semibold tracking-tight text-ink">{client.name}</h1>
                <ClientStatusBadge status={client.status} />
              </div>
              <p className="text-sm text-ink-secondary mt-0.5 truncate">
                {client.company || "—"}
                {client.contact ? ` · ${client.contact}` : ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-200/80 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Delete client</span>
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left (2/3): information + notes */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl border border-border-subtle bg-surface p-5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary block mb-4">
              Client Information
            </span>
            <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
              <InfoRow icon={<User size={13} />} label="Contact" value={client.contact} />
              <InfoRow icon={<Building2 size={13} />} label="Company" value={client.company} />
              <InfoRow
                icon={<Mail size={13} />}
                label="Email"
                value={client.email}
                href={client.email ? `mailto:${client.email}` : undefined}
              />
              <InfoRow
                icon={<Phone size={13} />}
                label="Phone"
                value={client.phone}
                href={client.phone ? `tel:${client.phone}` : undefined}
              />
              <InfoRow
                icon={<CalendarClock size={13} />}
                label="Client since"
                value={mounted ? formatClientDate(client.createdAt) : "—"}
              />
              <InfoRow
                icon={<Clock size={13} />}
                label="Last updated"
                value={mounted ? formatClientDate(client.updatedAt) : "—"}
              />
            </dl>
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary">
                Notes
              </span>
              {notesSaved && <span className="text-[11px] text-ink-tertiary">Saved ✓</span>}
            </div>
            <textarea
              value={notesValue}
              onChange={(e) => {
                setNotes(e.target.value);
                setNotesSaved(false);
              }}
              rows={5}
              placeholder="Add notes, preferences, or context about this client…"
              className="w-full rounded-lg border border-border-subtle bg-surface-subtle px-3 py-2 text-xs text-ink outline-none focus:border-ink transition-colors resize-none placeholder:text-ink-tertiary"
            />
            <div className="mt-3 flex justify-end">
              <Button variant="primary" size="sm" onClick={saveNotes} disabled={!notesChanged}>
                <span>Save notes</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Right (1/3): projects + activity */}
        <div className="space-y-5">
          <div className="rounded-xl border border-border-subtle bg-surface">
            <div className="px-5 py-3 border-b border-border-subtle">
              <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary">
                Projects
              </span>
            </div>
            <div className="divide-y divide-border-subtle">
              {clientProjects.length ? (
                clientProjects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 px-5 py-3 hover:bg-surface-subtle transition-colors group">
                    <Link
                      href={`/project/${p.id}`}
                      className="flex-1 flex items-center gap-2 min-w-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink truncate group-hover:underline underline-offset-2">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-ink-tertiary truncate">
                          {p.type} · {p.status}
                        </p>
                      </div>
                      <FolderOpen
                        size={14}
                        className="text-ink-tertiary shrink-0 group-hover:text-ink transition-colors"
                      />
                    </Link>
                    <button
                      type="button"
                      title="Share client review"
                      onClick={() => setShareProject(p)}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] text-ink-tertiary hover:text-ink px-2.5 py-1 rounded-full border border-transparent hover:border-border-subtle hover:bg-surface transition-all cursor-pointer shrink-0"
                    >
                      <Share2 size={12} />
                      Share
                    </button>
                  </div>
                ))
              ) : (
                <div className="px-5 py-6 text-center">
                  <p className="text-xs text-ink-tertiary">No projects yet for this client.</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface">
            <div className="px-5 py-3 border-b border-border-subtle">
              <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary">
                Activity
              </span>
            </div>
            <div className="p-4">
              {clientActivity.length ? (
                <div className="divide-y divide-border-subtle">
                  {clientActivity.map((a) => (
                    <ActivityItem key={a.id} item={a} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-tertiary text-center py-3">No recent activity.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Client Reviews Section */}
      <div className="rounded-xl border border-border-subtle bg-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-ink-tertiary" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary">
              Client Reviews ({getReviewsForClient(client.id).length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            {getReviewsForClient(client.id).length > 0 && (
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 font-medium">
                Client-Safe Presentation
              </span>
            )}
            {clientProjects.length > 0 && (
              <button
                type="button"
                onClick={() => setShareProject(clientProjects[0])}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full border border-border-subtle hover:border-ink/30 hover:bg-surface-subtle text-ink-secondary hover:text-ink transition-all cursor-pointer"
              >
                <Share2 size={12} />
                Share Review
              </button>
            )}
          </div>
        </div>

        {getReviewsForClient(client.id).length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3.5">
            {getReviewsForClient(client.id).map(({ review, version, project }) => (
              <div
                key={review.id}
                className="rounded-[20px] border border-black/[0.06] bg-[#FBFBFA] p-4 flex flex-col justify-between hover:border-black/[0.12] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60">
                      v{version.version} · Published
                    </span>
                    <span className="text-[10px] font-mono text-ink-tertiary">
                      {mounted ? formatClientDate(review.publishedAt) : "Recently"}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-ink">{version.snapshot.name}</h4>
                  <p className="text-xs text-ink-secondary mt-1 line-clamp-2">
                    {version.snapshot.description || "Creative direction published for client review."}
                  </p>
                  {project && (
                    <p className="text-[11px] font-mono text-ink-tertiary mt-2">
                      Project: {project.name}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-black/[0.04] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-ink-tertiary">
                    {version.snapshot.members?.length || 0} element{version.snapshot.members?.length !== 1 ? "s" : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveReviewItem({ review, version, project })}
                    className="inline-flex items-center gap-1 text-xs font-medium px-3.5 py-1.5 rounded-full bg-ink hover:bg-[#1E1B4B] text-white transition-colors cursor-pointer shadow-sm"
                  >
                    <span>View Review</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border-subtle bg-surface-subtle/40 p-8 text-center">
            <p className="text-xs font-medium text-ink">No published reviews yet</p>
            <p className="mt-1 text-[11px] text-ink-tertiary max-w-sm mx-auto">
              When you publish a creative direction from a project canvas, its frozen review snapshot will appear here for client presentation.
            </p>
          </div>
        )}
      </div>

      {/* Placeholders for subsequent chunks */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Placeholder
          icon={<CheckCircle2 size={16} />}
          title="Approvals"
          body="Formal approvals and sign-offs will appear here."
        />
        <Placeholder
          icon={<CalendarClock size={16} />}
          title="Follow-ups"
          body="Scheduled touchpoints and reminders will appear here."
        />
      </div>

      {showDeleteModal && (
        <DeleteClientModal
          clientName={client.name}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => {
            deleteClient(client.id);
            router.push("/clients");
          }}
        />
      )}

      {shareProject && (
        <ShareReviewModal
          projectId={shareProject.id}
          projectName={shareProject.name}
          clientId={client.id}
          onClose={() => setShareProject(null)}
        />
      )}

      {activeReviewItem && (
        <ClientReviewViewer
          version={activeReviewItem.version}
          allVersions={getDirectionVersions(activeReviewItem.review.directionId)}
          project={activeReviewItem.project}
          onClose={() => setActiveReviewItem(null)}
          onSelectVersion={(v) =>
            setActiveReviewItem((prev) => (prev ? { ...prev, version: v } : null))
          }
        />
      )}
    </div>
  );
}
