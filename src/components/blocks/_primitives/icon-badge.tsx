"use client";

import React from "react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

/** Lucide icon by name (e.g. "Zap") on a round accent-coloured badge; null for unknown names. */
export function IconBadge({ name, size = "md", className }: { name?: string; size?: "sm" | "md" | "lg"; className?: string }) {
  if (!name) return null;
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>>)[name];
  if (!Icon) return null;
  const box = { sm: "w-10 h-10", md: "w-14 h-14", lg: "w-[4.5rem] h-[4.5rem]" }[size];
  const glyph = { sm: "w-5 h-5", md: "w-7 h-7", lg: "w-9 h-9" }[size];
  return (
    <span aria-hidden="true" data-pc-icon-badge={name}
      className={cn("inline-flex items-center justify-center rounded-full text-white shadow-lg shrink-0", box, className)}
      style={{ background: "var(--sc-accent, hsl(var(--primary)))" }}>
      <Icon className={glyph} strokeWidth={2.2} />
    </span>
  );
}
