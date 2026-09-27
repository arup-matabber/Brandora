"use client";

import React from "react";
import { TypographyLaboratory } from "@/components/typography/TypographyLaboratory";
import { useProjects } from "@/lib/projects-context";

export default function TypographyPage() {
  const { projects } = useProjects();
  const activeProject = projects.length > 0 ? projects[0] : null;

  return (
    <div className="py-2">
      <TypographyLaboratory projectName={activeProject?.name || "ORBLINN"} />
    </div>
  );
}
