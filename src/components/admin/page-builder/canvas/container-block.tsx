"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useBuilderStore, type ContainerPath } from "@/lib/store/builder";
import { SortableBlockWrapper } from "./sortable-block-wrapper";
import { InsertSectionButton } from "./insert-section-button";
import { cn } from "@/lib/utils";
import type { Block, ContainerBlockProps } from "@/types/cms";

const GAP_CLASS = { none: "gap-0", sm: "gap-3", md: "gap-6", lg: "gap-10" };
const ALIGN_CLASS = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" };
const JUSTIFY_CLASS = { start: "justify-start", center: "justify-center", end: "justify-end", between: "justify-between" };

/** Resolves the container the LAST step of `path` names — walking every
 *  earlier step first to find the right block array to search in. Mirrors
 *  the store's own targetContainerAndColumn, needed here because this
 *  component can't reach into the store's internals directly. */
function resolveContainer(blocks: Block[], path: ContainerPath): ContainerBlockProps | undefined {
  if (path.length === 0) return undefined;
  let arr = blocks;
  for (let i = 0; i < path.length - 1; i++) {
    const step = path[i];
    const container = arr.find((b) => b.id === step.containerId) as ContainerBlockProps | undefined;
    const column = container?.data.columns[step.columnIndex];
    if (!column) return undefined;
    arr = column.blocks;
  }
  const last = path[path.length - 1];
  return arr.find((b) => b.id === last.containerId) as ContainerBlockProps | undefined;
}

function ColumnDropZone({
  containerPath,
  columnIndex,
  isEditing,
}: {
  /** Full path to the container this column belongs to. */
  containerPath: ContainerPath;
  columnIndex: number;
  isEditing: boolean;
}) {
  const { blocks } = useBuilderStore();
  const container = resolveContainer(blocks, containerPath);
  const column = container?.data.columns[columnIndex];
  const containerId = containerPath[containerPath.length - 1].containerId;
  const { setNodeRef, isOver } = useDroppable({
    id: `column:${containerId}:${columnIndex}`,
    data: { containerId, columnIndex },
  });

  if (!column) return null;
  // This column's own path, for children being added/edited inside it.
  const path: ContainerPath = [...containerPath, { containerId, columnIndex }];

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
        <div className="flex flex-col items-center justify-center gap-1 h-16 text-xs text-muted-foreground select-none">
          <span>Drop a block here</span>
          {/* Dragging is not the only way in — an empty column offers the
              same picker the page-level "+" does, scoped to this column. */}
          <InsertSectionButton path={path} compact />
        </div>
      )}
      <SortableContext items={column.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        {/* Containers may nest inside containers — the published site
            renders nested containers up to MAX_CONTAINER_DEPTH (see
            page-renderer.tsx); this component recurses the same way here,
            with no depth limit needed client-side since nesting only grows
            one level at a time through this same UI, never from untrusted
            JSON the way the server's recursive render has to guard against. */}
        {column.blocks.map((block) => (
          <React.Fragment key={block.id}>
            <SortableBlockWrapper block={block} isEditing={isEditing} path={path} />
            {isEditing && <InsertSectionButton path={path} afterId={block.id} compact />}
          </React.Fragment>
        ))}
      </SortableContext>
    </div>
  );
}

export function ContainerBlock({
  block, isPreview = false, path,
}: {
  block: ContainerBlockProps;
  isPreview?: boolean;
  /** This container's OWN path — where it sits in the tree, not its columns'
   *  path. Undefined/empty means this container lives at page root. Needed
   *  so a container nested inside another container's column can find
   *  itself, and so its columns' paths chain correctly for their children. */
  path?: ContainerPath;
}) {
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
        <ColumnDropZone
          key={col.id}
          containerPath={[...(path ?? []), { containerId: block.id, columnIndex: i }]}
          columnIndex={i}
          isEditing={isEditing}
        />
      ))}
    </div>
  );
}
