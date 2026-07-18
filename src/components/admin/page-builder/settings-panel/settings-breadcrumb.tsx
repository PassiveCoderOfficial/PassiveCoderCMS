"use client";

import React from "react";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { useBuilderStore } from "@/lib/store/builder";

export function SettingsBreadcrumb({ blockId }: { blockId: string }) {
  const { getBlockPath, selectBlock } = useBuilderStore();
  const path = getBlockPath(blockId);
  if (!path) return null;

  // Expand the (block, block) path into (block, column, block) crumbs when
  // nested, so the column position is its own clickable/visible segment.
  const crumbs = path.length === 2
    ? [
        { key: path[0].id, label: path[0].type.replace(/_/g, " "), onClick: () => selectBlock(path[0].id) },
        { key: `${path[0].id}-col`, label: `Column ${(path[1].columnIndex ?? 0) + 1}`, onClick: () => selectBlock(path[0].id) },
        { key: path[1].id, label: path[1].type.replace(/_/g, " "), onClick: () => selectBlock(path[1].id) },
      ]
    : [{ key: path[0].id, label: path[0].type.replace(/_/g, " "), onClick: () => selectBlock(path[0].id) }];

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
