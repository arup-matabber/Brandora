"use client";

import React from "react";
import { TypographyLaboratory } from "@/components/typography/TypographyLaboratory";
import { NormalizedInspirationItem } from "@/lib/inspiration/types";

interface TypographyExploreProps {
  items?: NormalizedInspirationItem[];
  savedIds?: Set<string>;
  onSave?: (item: NormalizedInspirationItem) => void;
  onAddToProject?: (item: NormalizedInspirationItem) => void;
  onAddToCanvas?: (item: NormalizedInspirationItem) => void;
  projectName?: string;
}

export function TypographyExplore({
  projectName = "ORBLINN",
}: TypographyExploreProps) {
  return <TypographyLaboratory projectName={projectName} />;
}
