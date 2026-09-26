"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, FolderOpen, ExternalLink } from "lucide-react";
import { useProjects } from "@/lib/projects-context";
import type { ReviewShare, BrandProject } from "@/lib/data";

export default function ClientRootPage() {
  const router = useRouter();
  const { reviewShares, projects } = useProjects();
  const [mounted, setMounted] = useState(false);
  const [tokenInput, setTokenInput] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeShares = reviewShares.filter((s) => s.active);

  const handleEnterToken = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = tokenInput.trim();
    if (cleaned) {
      router.push(`/client/${cleaned}`);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBFBFA]">
        <div className="w-5 h-5 border-2 border-[#191918]/20 border-t-[#191918] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FBFBFA] px-6 py-12">
      {/* Top Header */}
      <header className="max-w-2xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#969690]">
            Opalite
          </span>
          <span className="text-[#EBEBE7]">·</span>
          <span className="text-xs text-[#6B6B66]">Client Portal</span>
        </div>
        <Link
          href="/projects"
          className="text-xs text-[#969690] hover:text-[#191918] transition-colors"
        >
          Studio Workspace
        </Link>
      </header>

      {/* Main Container */}
      <main className="max-w-md w-full mx-auto text-center space-y-8 my-auto">
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-[#EBEBE7] shadow-xs flex items-center justify-center mx-auto text-[#191918]">
            <Sparkles size={20} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#191918]">
            Client Review Portal
          </h1>
          <p className="text-sm text-[#6B6B66] leading-relaxed">
            Review creative directions, typography, color palettes, and provide feedback directly to your designer.
          </p>
        </div>

        {/* Active shared projects list if available */}
        {activeShares.length > 0 ? (
          <div className="text-left space-y-3 pt-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#969690]">
              Active Review Portals ({activeShares.length})
            </p>
            <div className="space-y-2">
              {activeShares.map((share) => {
                const project = projects.find((p) => p.id === share.projectId);
                return (
                  <Link
                    key={share.id}
                    href={`/client/${share.token}`}
                    className="block p-4 rounded-2xl border border-[#EBEBE7] bg-white hover:border-[#191918]/25 hover:shadow-xs transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-semibold text-[#191918] group-hover:underline underline-offset-2">
                          {project?.name || "Shared Project"}
                        </h2>
                        <p className="text-xs text-[#6B6B66] mt-0.5">
                          {project?.client || "Client Review"} · {share.accessLevel} access
                        </p>
                      </div>
                      <ArrowRight
                        size={15}
                        className="text-[#969690] group-hover:text-[#191918] group-hover:translate-x-0.5 transition-all shrink-0 ml-3"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl border border-[#EBEBE7] bg-white text-left space-y-4 shadow-xs">
            <div>
              <h2 className="text-sm font-semibold text-[#191918]">Have a review link or token?</h2>
              <p className="text-xs text-[#6B6B66] mt-1">
                Enter your review token below or click the link shared by your designer.
              </p>
            </div>
            <form onSubmit={handleEnterToken} className="space-y-3">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste review token (e.g. 7f2a89...)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBEBE7] text-xs font-mono outline-none focus:border-[#191918] transition-colors"
              />
              <button
                type="submit"
                disabled={!tokenInput.trim()}
                className="w-full py-2.5 rounded-full bg-[#191918] disabled:opacity-40 text-white text-xs font-medium hover:bg-[#2E2E2C] transition-colors cursor-pointer"
              >
                Access Review
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] font-mono text-[#BCBCB6]">
        Opalite · Confidential Creative Direction Review
      </footer>
    </div>
  );
}
