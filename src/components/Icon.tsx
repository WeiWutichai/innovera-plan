"use client";

import { icons, type LucideProps } from "lucide-react";
import type { ComponentType } from "react";

// Map the prototype's kebab-case lucide names to lucide-react's PascalCase set,
// so templates can keep using names like "layout-dashboard".
function toPascal(name: string): string {
  return name
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

// lucide-react 0.469 renamed a few icons; the prototype uses the old kebab names.
// Map the old name to the current registry key so they keep resolving (and we
// avoid importing the deprecated-alias namespace, which would bloat the bundle).
const RENAMES: Record<string, string> = {
  "alert-triangle": "TriangleAlert",
  "bar-chart-3": "ChartColumn",
  "gantt-chart": "ChartNoAxesGantt",
};

export interface IconProps extends Omit<LucideProps, "ref"> {
  name: string;
  size?: number;
}

/** Thin wrapper over lucide-react that accepts kebab-case icon names. */
export function Icon({ name, size = 18, ...rest }: IconProps) {
  const key = RENAMES[name] ?? toPascal(name);
  const Cmp = icons[key as keyof typeof icons] as ComponentType<LucideProps> | undefined;
  if (!Cmp) return null;
  return <Cmp size={size} strokeWidth={2} {...rest} />;
}
