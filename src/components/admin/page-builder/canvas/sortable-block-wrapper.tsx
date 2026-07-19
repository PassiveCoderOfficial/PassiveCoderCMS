"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useBuilderStore, type ContainerPath } from "@/lib/store/builder";
import { BlockRenderer } from "./block-renderer";
import { BlockToolbar } from "./block-toolbar";
import { cn } from "@/lib/utils";
import type { Block } from "@/types/cms";

import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

interface SortableBlockWrapperProps {
  block: Block;
  isEditing: boolean;
  /** Set when this block lives inside a container column, not at page root. */
  path?: ContainerPath;
}

export function SortableBlockWrapper({ block, isEditing, path }: SortableBlockWrapperProps) {
  const { selectedBlockId, hoveredBlockId, selectBlock, hoverBlock } = useBuilderStore();
  const isSelected = selectedBlockId === block.id;
  const isHovered = hoveredBlockId === block.id;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    disabled: !isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!block.visible) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isEditing && "outline-2 outline-transparent outline-offset-[-2px]",
        isEditing && isHovered && !isSelected && "outline-orange-300 outline-dashed",
        isEditing && isSelected && "outline-4 outline-orange-600 outline-solid shadow-[0_0_0_4px_rgba(234,88,12,0.15)]",
        isDragging && "opacity-30",
      )}
      onClick={(e) => {
        if (!isEditing) return;
        e.stopPropagation();
        selectBlock(block.id);
      }}
      onMouseEnter={() => isEditing && hoverBlock(block.id)}
      onMouseLeave={() => isEditing && hoverBlock(undefined)}
    >
      {isEditing && (isSelected || isHovered) && (
        <BlockToolbar block={block} dragListeners={listeners ?? undefined} dragAttributes={attributes} path={path} pinned={isSelected} />
      )}
      {isEditing && !isSelected && (
        <span className="lg:hidden absolute top-1 left-1 z-10 rounded-md bg-black/40 text-white text-[10px] font-medium px-1.5 py-0.5 select-none pointer-events-none capitalize">
          {block.type.replace(/_/g, " ")}
        </span>
      )}
      <BlockRenderer block={block} isPreview={!isEditing} />
    </div>
  );
}
