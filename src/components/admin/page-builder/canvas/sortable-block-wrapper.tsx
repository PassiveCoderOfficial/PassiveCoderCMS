"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useBuilderStore } from "@/lib/store/builder";
import { BlockRenderer } from "./block-renderer";
import { BlockToolbar } from "./block-toolbar";
import { cn } from "@/lib/utils";
import type { Block } from "@/types/cms";

import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

interface SortableBlockWrapperProps {
  block: Block;
  isEditing: boolean;
}

export function SortableBlockWrapper({ block, isEditing }: SortableBlockWrapperProps) {
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
        isEditing && "outline-2 outline-transparent",
        isEditing && isHovered && !isSelected && "outline-blue-300 outline-dashed",
        isEditing && isSelected && "outline-blue-500 outline-solid",
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
        <BlockToolbar block={block} dragListeners={listeners ?? undefined} dragAttributes={attributes} />
      )}
      <BlockRenderer block={block} isPreview={!isEditing} />
    </div>
  );
}
