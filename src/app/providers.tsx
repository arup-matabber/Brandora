"use client";

import React from "react";
import { AuthProvider } from "@/lib/auth-context";
import { ProjectsProvider } from "@/lib/projects-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProjectsProvider>{children}</ProjectsProvider>
    </AuthProvider>
  );
}
