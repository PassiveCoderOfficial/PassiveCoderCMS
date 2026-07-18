"use client";

import React from "react";
import { GripVertical, Copy, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Settings } from "lucide-react";
import { useBuilderStore, type ContainerPath } from "@/lib/store/builder";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Block, ContainerBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";

import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type { DraggableAttributes } from "@dnd-kit/core";

interface BlockToolbarProps {
  block: Block;
  dragListeners?: SyntheticListenerMap;
  dragAttributes?: DraggableAttributes;
  /** Set when this block lives inside a container column, not at page root. */
  path?: ContainerPath;
}

export function BlockToolbar({ block, dragListeners, dragAttributes, path }: BlockToolbarProps) {
  const { blocks, removeBlock, duplicateBlock, updateBlock, moveBlock, selectBlock } = useBuilderStore();
  const siblings = path
    ? ((blocks.find((b) => b.id === path.containerId) as ContainerBlockProps | undefined)
        ?.data.columns[path.columnIndex]?.blocks ?? [])
    : blocks;
  const idx = siblings.findIndex((b) => b.id === block.id);
  const canMoveUp = idx > 0;
  const canMoveDown = idx < siblings.length - 1;

  const actions = [
    { icon: Settings, label: "Edit settings", onClick: () => selectBlock(block.id), variant: "primary" },
    { icon: GripVertical, label: "Drag to reorder", isDragHandle: true },
    { icon: block.visible ? Eye : EyeOff, label: block.visible ? "Hide block" : "Show block", onClick: () => updateBlock(block.id, { visible: !block.visible }, path) },
    { icon: ChevronUp, label: "Move up", onClick: () => canMoveUp && moveBlock(block.id, siblings[idx - 1].id, path), disabled: !canMoveUp },
    { icon: ChevronDown, label: "Move down", onClick: () => canMoveDown && moveBlock(block.id, siblings[idx + 1].id, path), disabled: !canMoveDown },
    { icon: Copy, label: "Duplicate", onClick: () => duplicateBlock(block.id, path) },
    { icon: Trash2, label: "Delete", onClick: () => removeBlock(block.id, path), variant: "destructive" },
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "absolute -top-8 left-0 z-20 flex items-center gap-0.5 rounded-t bg-gray-900 px-1 py-0.5",
          "opacity-0 group-hover:opacity-100 transition-opacity",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[10px] text-gray-400 mr-1 select-none px-1 truncate max-w-[120px]">
          {block.type.replace(/_/g, " ")}
        </span>
        {actions.map((action, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded text-gray-300 hover:text-white hover:bg-gray-700 transition-colors",
                  action.variant === "destructive" && "hover:text-red-400 hover:bg-red-900/40",
                  action.variant === "primary" && "hover:bg-blue-600 hover:text-white",
                  action.disabled && "opacity-30 pointer-events-none",
                  action.isDragHandle && "cursor-grab active:cursor-grabbing",
                )}
                onClick={action.onClick}
                {...(action.isDragHandle ? { ...dragListeners, ...dragAttributes } : {})}
              >
                <action.icon className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">{action.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
