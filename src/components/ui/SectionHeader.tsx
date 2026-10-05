"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export interface SectionHeaderProps {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  actionHref,
  actionLabel,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`flex items-baseline justify-between mb-4 ${className}`}>
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-secondary">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs text-ink-tertiary">{description}</p>
        )}
      </div>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="group inline-flex items-center gap-1 text-xs font-medium text-ink-secondary hover:text-ink transition-colors"
        >
          <span>{actionLabel}</span>
          <ArrowUpRight
            size={13}
            className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-ink-tertiary group-hover:text-ink"
          />
        </Link>
      )}
    </div>
  );
}
