"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useBuilderStore, type ContainerPath } from "@/lib/store/builder";
import { BlockRenderer } from "./block-renderer";
import { BlockToolbar } from "./block-toolbar";
import { BlockContextMenu } from "./block-context-menu";
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
  const [longPressOpen, setLongPressOpen] = React.useState(false);
  const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    disabled: !isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Selecting a block from the Layers tab (or anywhere off-screen) should
  // bring it into view. Clicking a block directly in the canvas also selects
  // it, though — and it's already visible then, so re-centering it on every
  // click made the page appear to jump to wherever was clicked, which is
  // disorienting rather than helpful. Only scroll when the block isn't
  // already substantially in view.
  const elRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!isSelected) return;
    const el = elRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    // "Substantially in view" = most of the block's height already visible,
    // not just a sliver — a tall block with only its top edge on screen still
    // deserves a scroll so its settings context is legible.
    const visibleTop = Math.max(rect.top, 0);
    const visibleBottom = Math.min(rect.bottom, viewportHeight);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const enoughVisible = visibleHeight >= Math.min(rect.height, viewportHeight) * 0.6;
    if (!enoughVisible) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [isSelected]);

  const clearLongPress = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  const handleTouchStart = () => {
    if (!isEditing) return;
    clearLongPress();
    longPressTimer.current = setTimeout(() => {
      selectBlock(block.id);
      setLongPressOpen(true);
    }, 500);
  };

  // Preview mode simulates the live site — hidden blocks stay hidden there.
  // In edit mode, render hidden blocks greyed-out so there's always a way
  // back (via this toolbar's eye icon or the Layers panel) instead of the
  // block disappearing with no visible affordance to restore it.
  if (!block.visible && !isEditing) return null;
  const isHiddenInEditor = isEditing && !block.visible;

  return (
    <BlockContextMenu block={block} path={path} open={longPressOpen} onOpenChange={setLongPressOpen}>
      <div
        ref={(node) => { setNodeRef(node); elRef.current = node; }}
        style={style}
        // Stable handles for tests and automation. "relative group" is a
        // styling class that also matches unrelated panel markup, so counting
        // it produced wrong block counts; data-block-id is unambiguous.
        data-testid="canvas-block"
        data-block-id={block.id}
        data-block-type={block.type}
        data-selected={isSelected || undefined}
        className={cn(
          "relative group",
          isEditing && "outline-2 outline-transparent outline-offset-[-2px]",
          isEditing && isHovered && !isSelected && "outline-orange-300 outline-dashed",
          isEditing && isSelected && "outline-4 outline-orange-600 outline-solid shadow-[0_0_0_4px_rgba(234,88,12,0.15)]",
          isDragging && "opacity-30",
          isHiddenInEditor && "opacity-40 grayscale",
        )}
        onClickCapture={(e) => {
          if (!isEditing) return;
          // Nav/footer blocks render real Next.js <Link>s — they have no idea
          // they're inside the editor, so a click on any menu item or footer
          // link navigated the whole admin session away to that page (or off
          // the site). Must intercept in the CAPTURE phase, before the click
          // reaches the <Link>: Next's own onClick handler lives on the
          // anchor itself and calls router.push() directly (not the browser's
          // native <a> navigation), so calling preventDefault from a bubbling
          // handler on this wrapper ran too late — Link's handler had already
          // fired and pushed the route by the time it got here.
          const link = (e.target as HTMLElement).closest("a");
          if (link) e.preventDefault();
        }}
        onClick={(e) => {
          if (!isEditing) return;
          e.stopPropagation();
          selectBlock(block.id);
        }}
        onMouseEnter={() => isEditing && hoverBlock(block.id)}
        onMouseLeave={() => isEditing && hoverBlock(undefined)}
        onTouchStart={handleTouchStart}
        onTouchMove={clearLongPress}
        onTouchEnd={clearLongPress}
      >
        {isEditing && (isSelected || isHovered) && (
          <BlockToolbar block={block} dragListeners={listeners ?? undefined} dragAttributes={attributes} path={path} pinned={isSelected} />
        )}
        {isEditing && !isSelected && (
          <span className="lg:hidden absolute top-1 left-1 z-10 rounded-md bg-black/40 text-white text-[10px] font-medium px-1.5 py-0.5 select-none pointer-events-none capitalize">
            {block.type.replace(/_/g, " ")}
          </span>
        )}
        {isHiddenInEditor && (
          <span className="absolute top-1 right-1 z-10 rounded-md bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 select-none pointer-events-none">
            Hidden
          </span>
        )}
        <BlockRenderer block={block} isPreview={!isEditing} />
      </div>
    </BlockContextMenu>
  );
}
