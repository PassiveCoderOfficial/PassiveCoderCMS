import { GripVertical, Copy, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Settings, BookmarkPlus, PanelTop, type LucideIcon } from "lucide-react";
import { useBuilderStore, type ContainerPath } from "@/lib/store/builder";
import type { Block, ContainerBlockProps } from "@/types/cms";

export interface BlockAction {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  isDragHandle?: boolean;
  disabled?: boolean;
  variant?: "primary" | "destructive";
}

/** Single source of truth for a block's move/hide/duplicate/delete/save-as-
 *  section actions — consumed by both the hover toolbar (block-toolbar.tsx)
 *  and the right-click/long-press context menu (block-context-menu.tsx) so
 *  the two never drift out of sync with each other. */
export function useBlockActions(
  block: Block,
  path: ContainerPath | undefined,
  onSaveAsSection: () => void,
  /** Opens the header/footer builder for site chrome blocks. Optional so
   *  surfaces without a page to return to (the header builder's own canvas)
   *  simply don't offer it. */
  onEditSiteChrome?: (target: "header" | "footer") => void,
): BlockAction[] {
  const { blocks, removeBlock, duplicateBlock, updateBlock, moveBlock, selectBlock, setMobileSheet } = useBuilderStore();
  const siblings = path
    ? ((blocks.find((b) => b.id === path.containerId) as ContainerBlockProps | undefined)
        ?.data.columns[path.columnIndex]?.blocks ?? [])
    : blocks;
  const idx = siblings.findIndex((b) => b.id === block.id);
  const canMoveUp = idx > 0;
  const canMoveDown = idx < siblings.length - 1;

  return [
    // Selects the block and (on mobile) opens its settings sheet — setMobileSheet
    // is a no-op on desktop where the settings panel is always docked.
    { icon: Settings, label: "Edit settings", onClick: () => { selectBlock(block.id); setMobileSheet("settings"); }, variant: "primary" },
    { icon: GripVertical, label: "Drag to reorder", isDragHandle: true },
    { icon: block.visible ? Eye : EyeOff, label: block.visible ? "Hide block" : "Show block", onClick: () => updateBlock(block.id, { visible: !block.visible }, path) },
    { icon: ChevronUp, label: "Move up", onClick: () => canMoveUp && moveBlock(block.id, siblings[idx - 1].id, path), disabled: !canMoveUp },
    { icon: ChevronDown, label: "Move down", onClick: () => canMoveDown && moveBlock(block.id, siblings[idx + 1].id, path), disabled: !canMoveDown },
    { icon: Copy, label: "Duplicate", onClick: () => duplicateBlock(block.id, path) },
    // Navigation and footer blocks are site chrome: the same menu and links
    // appear on every page, and they are edited in the header/footer builder
    // rather than per page. Without this the only route there is the sidebar,
    // which means guessing that a block you can see and click is edited
    // somewhere else entirely.
    ...(onEditSiteChrome && (block.type === "navigation" || block.type === "footer")
      ? [{
          icon: PanelTop,
          label: block.type === "navigation" ? "Edit site header" : "Edit site footer",
          onClick: () => onEditSiteChrome(block.type === "navigation" ? "header" : "footer"),
        }]
      : []),
    ...(block.type === "container"
      ? [{ icon: BookmarkPlus, label: "Save as section", onClick: onSaveAsSection }]
      : []),
    { icon: Trash2, label: "Delete", onClick: () => removeBlock(block.id, path), variant: "destructive" as const },
  ];
}
