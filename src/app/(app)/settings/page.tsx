"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-8 max-w-2xl">
      <header className="pb-4 border-b border-border-subtle">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Settings
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Manage your creative workspace preferences and designer profile.
        </p>
      </header>

      <div className="space-y-6">
        <div className="rounded-xl border border-border-subtle bg-surface p-6">
          <h2 className="text-base font-semibold text-ink">Designer Profile</h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Your name and studio profile displayed across workspaces.
          </p>

          <div className="mt-4 space-y-3 pt-3 border-t border-border-subtle text-sm">
            <div className="flex justify-between py-1.5">
              <span className="text-ink-secondary text-xs">Full Name</span>
              <span className="font-medium text-ink text-xs">{user.fullName}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-ink-secondary text-xs">Workspace Studio</span>
              <span className="font-medium text-ink text-xs">{user.studio}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-ink-secondary text-xs">Role</span>
              <span className="font-medium text-ink text-xs">{user.role}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border-subtle bg-surface p-6">
          <h2 className="text-base font-semibold text-ink">Typography & Preferences</h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Workspace defaults and typeface settings.
          </p>
          <div className="mt-4 pt-3 border-t border-border-subtle text-xs text-ink-secondary flex items-center justify-between">
            <span>Primary UI Font</span>
            <span className="font-mono text-ink">Satoshi (System Native)</span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="outline" size="sm" onClick={logout}>
            Log out from Opalite
          </Button>
        </div>
      </div>
    </div>
  );
}
