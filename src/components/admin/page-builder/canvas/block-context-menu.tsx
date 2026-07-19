"use client";

import React, { useState } from "react";
import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { useBlockActions } from "./use-block-actions";
import { SavePresetDialog } from "./save-preset-dialog";
import { cn } from "@/lib/utils";
import type { Block } from "@/types/cms";
import type { ContainerPath } from "@/lib/store/builder";

interface BlockContextMenuProps {
  block: Block;
  path?: ContainerPath;
  children: React.ReactNode;
  /** Controlled from outside for long-press on mobile — right-click uses
   *  Radix's own native trigger and ignores these. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Right-click (desktop, native) + long-press (mobile, controlled) menu with
 *  the same actions as the hover toolbar — see use-block-actions.ts. */
export function BlockContextMenu({ block, path, children, open, onOpenChange }: BlockContextMenuProps) {
  const [saveOpen, setSaveOpen] = useState(false);
  const actions = useBlockActions(block, path, () => setSaveOpen(true));

  return (
    <>
      <ContextMenu open={open} onOpenChange={onOpenChange}>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-52">
          {actions.map((action, i) => (
            action.isDragHandle ? null : (
              <React.Fragment key={i}>
                {action.variant === "destructive" && <ContextMenuSeparator />}
                <ContextMenuItem
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={cn(action.variant === "destructive" && "text-destructive focus:text-destructive")}
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </ContextMenuItem>
              </React.Fragment>
            )
          ))}
        </ContextMenuContent>
      </ContextMenu>
      {block.type === "container" && (
        <SavePresetDialog block={block} open={saveOpen} onOpenChange={setSaveOpen} />
      )}
    </>
  );
}
