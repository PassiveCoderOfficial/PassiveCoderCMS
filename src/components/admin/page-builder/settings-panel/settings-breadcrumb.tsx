"use client";

import React from "react";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { useBuilderStore } from "@/lib/store/builder";

export function SettingsBreadcrumb({ blockId }: { blockId: string }) {
  const { getBlockPath, selectBlock } = useBuilderStore();
  const path = getBlockPath(blockId);
  if (!path) return null;

  // Every entry except the last is an ancestor container — expand each one
  // into (container, column) crumbs, so a block nested arbitrarily deep
  // (containers inside containers) still gets one clickable segment per
  // level instead of the breadcrumb only ever supporting a single container.
  const crumbs = path.flatMap((entry, i) => {
    const isLast = i === path.length - 1;
    const own = { key: entry.id, label: entry.type.replace(/_/g, " "), onClick: () => selectBlock(entry.id) };
    if (isLast) return [own];
    return [
      own,
      { key: `${entry.id}-col`, label: `Column ${(entry.columnIndex ?? 0) + 1}`, onClick: () => selectBlock(entry.id) },
    ];
  });

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b bg-muted/30 text-[11px] text-muted-foreground overflow-x-auto">
      <LayoutGrid className="h-3 w-3 shrink-0" />
      {crumbs.map((crumb, i) => (
        <React.Fragment key={crumb.key}>
          {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
          <button
            onClick={crumb.onClick}
            className={i === crumbs.length - 1
              ? "font-semibold text-foreground capitalize whitespace-nowrap"
              : "hover:text-foreground capitalize whitespace-nowrap"}
          >
            {crumb.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
