"use client";

import React, { useState } from "react";
import { GripVertical, Copy, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Settings, BookmarkPlus } from "lucide-react";
import { useBuilderStore, type ContainerPath } from "@/lib/store/builder";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Block, ContainerBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { SavePresetDialog } from "./save-preset-dialog";

import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type { DraggableAttributes } from "@dnd-kit/core";

interface BlockToolbarProps {
  block: Block;
  dragListeners?: SyntheticListenerMap;
  dragAttributes?: DraggableAttributes;
  /** Set when this block lives inside a container column, not at page root. */
  path?: ContainerPath;
  /** Keep visible without hover — set when this block is the current selection,
   *  so editors can tell what's selected without having to keep the mouse over it. */
  pinned?: boolean;
}

export function BlockToolbar({ block, dragListeners, dragAttributes, path, pinned }: BlockToolbarProps) {
  const { blocks, removeBlock, duplicateBlock, updateBlock, moveBlock, selectBlock, setMobileSheet } = useBuilderStore();
  const [saveOpen, setSaveOpen] = useState(false);
  const siblings = path
    ? ((blocks.find((b) => b.id === path.containerId) as ContainerBlockProps | undefined)
        ?.data.columns[path.columnIndex]?.blocks ?? [])
    : blocks;
  const idx = siblings.findIndex((b) => b.id === block.id);
  const canMoveUp = idx > 0;
  const canMoveDown = idx < siblings.length - 1;

  const actions = [
    // Selects the block and (on mobile) opens its settings sheet — setMobileSheet
    // is a no-op on desktop where the settings panel is always docked.
    { icon: Settings, label: "Edit settings", onClick: () => { selectBlock(block.id); setMobileSheet("settings"); }, variant: "primary" },
    { icon: GripVertical, label: "Drag to reorder", isDragHandle: true },
    { icon: block.visible ? Eye : EyeOff, label: block.visible ? "Hide block" : "Show block", onClick: () => updateBlock(block.id, { visible: !block.visible }, path) },
    { icon: ChevronUp, label: "Move up", onClick: () => canMoveUp && moveBlock(block.id, siblings[idx - 1].id, path), disabled: !canMoveUp },
    { icon: ChevronDown, label: "Move down", onClick: () => canMoveDown && moveBlock(block.id, siblings[idx + 1].id, path), disabled: !canMoveDown },
    { icon: Copy, label: "Duplicate", onClick: () => duplicateBlock(block.id, path) },
    ...(block.type === "container"
      ? [{ icon: BookmarkPlus, label: "Save as section", onClick: () => setSaveOpen(true) }]
      : []),
    { icon: Trash2, label: "Delete", onClick: () => removeBlock(block.id, path), variant: "destructive" },
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          // Mobile: sits INSIDE the block's top edge (top-1) so it can never
          // slide behind the fixed top bar for the first block — always
          // reachable. Desktop: floats just above the block on hover.
          "absolute top-1 lg:top-auto lg:-top-8 left-1 right-1 lg:left-0 lg:right-auto z-20 flex items-center gap-0.5 rounded-lg lg:rounded-t px-1 py-1 lg:py-0.5 transition-opacity shadow-lg lg:shadow-none overflow-x-auto",
          pinned ? "bg-orange-600 opacity-100" : "bg-gray-900 opacity-0 group-hover:opacity-100",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="hidden lg:inline text-[10px] text-gray-400 mr-1 select-none px-1 truncate max-w-[100px] shrink-0">
          {block.type.replace(/_/g, " ")}
        </span>
        <div className="flex items-center gap-0.5 shrink-0 ml-auto lg:ml-0">
          {actions.map((action, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    "flex h-8 w-8 lg:h-6 lg:w-6 items-center justify-center rounded text-white hover:bg-white/20 transition-colors shrink-0",
                    action.variant === "destructive" && "hover:text-red-100 hover:bg-red-900/40",
                    action.variant === "primary" && "hover:bg-white/25 hover:text-white",
                    action.disabled && "opacity-30 pointer-events-none",
                    action.isDragHandle && "cursor-grab active:cursor-grabbing touch-none",
                  )}
                  onClick={action.onClick}
                  {...(action.isDragHandle ? { ...dragListeners, ...dragAttributes } : {})}
                >
                  <action.icon className="h-4 w-4 lg:h-3 lg:w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">{action.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
      {block.type === "container" && (
        <SavePresetDialog block={block} open={saveOpen} onOpenChange={setSaveOpen} />
      )}
    </TooltipProvider>
  );
}
