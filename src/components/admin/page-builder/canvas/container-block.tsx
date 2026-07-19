"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useBuilderStore } from "@/lib/store/builder";
import { SortableBlockWrapper } from "./sortable-block-wrapper";
import { cn } from "@/lib/utils";
import type { ContainerBlockProps } from "@/types/cms";

const GAP_CLASS = { none: "gap-0", sm: "gap-3", md: "gap-6", lg: "gap-10" };
const ALIGN_CLASS = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" };
const JUSTIFY_CLASS = { start: "justify-start", center: "justify-center", end: "justify-end", between: "justify-between" };

function ColumnDropZone({
  containerId,
  columnIndex,
  isEditing,
}: {
  containerId: string;
  columnIndex: number;
  isEditing: boolean;
}) {
  const { blocks } = useBuilderStore();
  const container = blocks.find((b) => b.id === containerId) as ContainerBlockProps | undefined;
  const column = container?.data.columns[columnIndex];
  const { setNodeRef, isOver } = useDroppable({
    id: `column:${containerId}:${columnIndex}`,
    data: { containerId, columnIndex },
  });

  if (!column) return null;
  const path = { containerId, columnIndex };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 min-w-0 flex flex-col gap-2 rounded",
        isEditing && "min-h-[64px] outline-1 outline-dashed outline-transparent",
        isEditing && isOver && "outline-orange-400 bg-orange-50/40",
        isEditing && column.blocks.length === 0 && "outline-gray-300",
      )}
      style={{ flexBasis: `${column.widthPct}%` }}
    >
      {column.blocks.length === 0 && isEditing && (
        <div className="flex items-center justify-center h-16 text-xs text-muted-foreground select-none">
          Drop a block here
        </div>
      )}
      <SortableContext items={column.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        {column.blocks.map((block) => (
          <SortableBlockWrapper key={block.id} block={block} isEditing={isEditing} path={path} />
        ))}
      </SortableContext>
    </div>
  );
}

export function ContainerBlock({ block, isPreview = false }: { block: ContainerBlockProps; isPreview?: boolean }) {
  const { data } = block;
  const isEditing = !isPreview;

  return (
    <div
      className={cn(
        "max-w-7xl mx-auto flex",
        data.direction === "column" ? "flex-col" : data.wrapOnMobile ? "flex-col md:flex-row" : "flex-row",
        GAP_CLASS[data.gap],
        ALIGN_CLASS[data.align],
        JUSTIFY_CLASS[data.justify],
      )}
    >
      {data.columns.map((col, i) => (
        <ColumnDropZone key={col.id} containerId={block.id} columnIndex={i} isEditing={isEditing} />
      ))}
    </div>
  );
}
