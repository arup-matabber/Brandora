"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useProjects } from "@/lib/projects-context";
import type { ClientStatus } from "./ClientStatusBadge";

interface AddClientModalProps {
  onClose: () => void;
  onCreated?: (name: string) => void;
}

const STATUS_OPTIONS: ClientStatus[] = ["Lead", "Active", "Inactive"];

const fieldClass =
  "w-full rounded-lg border border-border-subtle bg-surface-subtle px-3 py-2 text-xs text-ink outline-none focus:border-ink transition-colors placeholder:text-ink-tertiary";
const labelClass = "block text-[10px] font-mono uppercase tracking-widest text-ink-tertiary mb-1.5";

export function AddClientModal({ onClose, onCreated }: AddClientModalProps) {
  const { createClient } = useProjects();

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<ClientStatus>("Lead");
  const [notes, setNotes] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createClient({
      name: name.trim(),
      company: company.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      status,
      notes: notes.trim() || undefined,
    });
    onCreated?.(name.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-surface border border-border-subtle rounded-2xl shadow-lifted overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink-tertiary">
              New record
            </span>
            <h3 className="text-sm font-semibold text-ink mt-0.5">Add Client</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-ink-tertiary hover:text-ink hover:bg-surface-subtle"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit}>
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label className={labelClass}>Name</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Client or studio name"
                className={fieldClass}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ClientStatus)}
                  className={fieldClass}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@studio.com"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+00 000 000 000"
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Context, preferences, follow-ups…"
                rows={3}
                className={`${fieldClass} resize-none`}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-border-subtle bg-surface-subtle/30 flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={!name.trim()}>
              <span>Add client</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
