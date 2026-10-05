import React from "react";

export interface AvatarProps {
  initials: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ initials, name, size = "md", className = "" }: AvatarProps) {
  const sizeClasses = {
    sm: "h-6 w-6 text-[10px]",
    md: "h-8 w-8 text-xs",
    lg: "h-10 w-10 text-sm",
  };

  return (
    <div
      title={name}
      className={`inline-flex items-center justify-center rounded-full bg-surface-muted text-ink font-medium tracking-tight border border-border-subtle select-none ${sizeClasses[size]} ${className}`}
    >
      {initials}
    </div>
  );
}
