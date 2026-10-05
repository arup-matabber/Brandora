import React from "react";
import { ActivityItemData } from "@/lib/data";

export interface ActivityItemProps {
  item: ActivityItemData;
}

export function ActivityItem({ item }: ActivityItemProps) {
  return (
    <div className="group flex items-center justify-between py-2.5 px-3 -mx-3 rounded-md transition-colors hover:bg-surface-subtle">
      <div className="flex items-center gap-3 min-w-0">
        <span className="h-1.5 w-1.5 rounded-full bg-border-dark group-hover:bg-ink transition-colors shrink-0" />
        <p className="text-xs text-ink-secondary truncate">
          <span>{item.action} </span>
          <span className="font-medium text-ink">{item.project}</span>
        </p>
      </div>
      <span className="text-[11px] text-ink-tertiary shrink-0 ml-4 tabular-nums">
        {item.timeAgo}
      </span>
    </div>
  );
}
