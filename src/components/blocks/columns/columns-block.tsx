"use client";

import React from "react";
import type { ColumnsBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";

const GAP_CLASS = { sm: "gap-4", md: "gap-8", lg: "gap-12" };
const VALIGN_CLASS = { top: "items-start", middle: "items-center", bottom: "items-end" };

export function ColumnsBlock({ block }: { block: ColumnsBlockProps }) {
  const { data } = block;
  const colClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[data.columns];

  return (
    <div className={cn("max-w-7xl mx-auto grid grid-cols-1", colClass, GAP_CLASS[data.gap], VALIGN_CLASS[data.verticalAlign])}>
      {Array.from({ length: data.columns }).map((_, i) => (
        <div
          key={i}
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: data.content[i] ?? "<p>Column content here…</p>" }}
        />
      ))}
    </div>
  );
}
