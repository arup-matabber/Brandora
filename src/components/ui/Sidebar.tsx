"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Layers,
  Compass,
  FolderOpen,
  Users,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { NavigationItem } from "./NavigationItem";
import { Avatar } from "./Avatar";
import { useAuth } from "@/lib/auth-context";
import { useProjects } from "@/lib/projects-context";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { projects } = useProjects();

  const navItems = [
    { href: "/home", label: "Home", icon: Home },
    {
      href: "/projects",
      label: "Projects",
      icon: Layers,
      badge: projects.length > 0 ? projects.length : undefined,
    },
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/library", label: "Library", icon: FolderOpen },
    { href: "/clients", label: "Clients", icon: Users },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[230px] flex-col border-r border-border-subtle bg-paper px-3 py-4 select-none">
      {/* Workspace Header / Wordmark */}
      <div className="px-2 pt-1 pb-3">
        <Link
          href="/home"
          className="flex items-center gap-2.5 group rounded-full p-1 -ml-1 transition-opacity duration-150 hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-1"
        >
          <div className="h-6 w-6 rounded-xl bg-ink flex items-center justify-center text-[11px] font-bold text-white tracking-tighter shadow-sm">
            O
          </div>
          <span className="font-semibold text-xs tracking-wider uppercase text-ink">
            Opalite
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-1 py-2">
        {navItems.map((item) => (
          <NavigationItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={pathname === item.href || (item.href === "/home" && pathname === "/")}
          />
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Area: Settings & Profile */}
      <div className="pt-3 space-y-2 border-t border-border-subtle">
        <NavigationItem
          href="/settings"
          label="Settings"
          icon={Settings}
          isActive={pathname === "/settings"}
        />

        {/* User Account / Workspace Footer */}
        <div className="flex items-center justify-between p-2 rounded-2xl bg-stone-100/50 border border-black/[0.04] hover:bg-stone-100/80 transition-colors duration-150 group">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar initials={user.initials} size="sm" name={user.fullName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-ink">
                {user.fullName}
              </p>
              <p className="truncate text-[10px] text-ink-tertiary">
                {user.role}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="w-7 h-7 rounded-full flex items-center justify-center text-ink-tertiary hover:text-ink hover:bg-white transition-colors duration-150 shadow-none hover:shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
          >
            <LogOut size={12} />
          </button>
        </div>
      </div>
    </aside>
  );
}
