"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useBuilderStore, type ContainerPath } from "@/lib/store/builder";
import { BlockRenderer } from "./block-renderer";
import { BlockErrorBoundary } from "./block-error-boundary";
import { BlockToolbar } from "./block-toolbar";
import { BlockContextMenu } from "./block-context-menu";
import { cn } from "@/lib/utils";
import type { Block } from "@/types/cms";
import { useBlockDisplayName } from "../block-display-name";
import type { ClickedMenuLink } from "./menu-canvas-editor";

// The in-place menu editor (menus P3) loads only when a menu block is
// selected: it brings the full menu tree editor with it.
const MenuCanvasEditor = React.lazy(() => import("./menu-canvas-editor").then((m) => ({ default: m.MenuCanvasEditor })));
const isCanvasMenuBlock = (b: Block) => b.type === "navigation" || b.type === "header_nav";

import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

/** Below this height the block toolbar sits outside the block (it would cover it). */
const SHORT_BLOCK_PX = 120;
/** Room the toolbar needs above a block inside the canvas. */
const TOOLBAR_ROOM_PX = 44;

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

  // Short blocks (a Menu bar is about 35px tall) were hidden completely under
  // their own toolbar. Below this height the toolbar sits flush against the
  // block's outer edge: above it when the canvas has room there, else below
  // (the first block). Taller blocks keep the toolbar inside, as before.
  const toolbarShown = isEditing && (isSelected || isHovered);
  const [placement, setPlacement] = React.useState<"inside" | "above" | "below">("inside");
  React.useLayoutEffect(() => {
    if (!toolbarShown) return;
    const el = elRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.height >= SHORT_BLOCK_PX) { setPlacement("inside"); return; }
      let top = 0;
      for (let p = el.parentElement; p; p = p.parentElement) {
        if (/(auto|scroll|hidden)/.test(getComputedStyle(p).overflowY)) { top = p.getBoundingClientRect().top; break; }
      }
      setPlacement(rect.top - top >= TOOLBAR_ROOM_PX ? "above" : "below");
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [toolbarShown]);
  const name = useBlockDisplayName(block.type);

  // Menus P3: a selected menu block gets the in-place menu editor under it;
  // a click on one of its links opens the rename box right on that link.
  const menuEditing = isEditing && isSelected && isCanvasMenuBlock(block);
  const [clickedLink, setClickedLink] = React.useState<ClickedMenuLink | null>(null);

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
          // The in-place menu editor (and its drawer, portalled but still a
          // React child) handles its own clicks: links there must work.
          if ((e.target as HTMLElement).closest?.("[data-menu-canvas-editor]")) return;
          // Inline-editable text stops its click from bubbling, so a tap on a
          // heading never selected its block (the phone editor's Edit tab
          // stayed disabled). Capture runs outer -> inner, so the innermost
          // block tapped ends up selected.
          if (!(e.target as HTMLElement).closest("[data-block-toolbar]")) selectBlock(block.id);
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
          // A link inside a menu block (not in the editor's own controls):
          // rename it in place (menus P3).
          if (link && isCanvasMenuBlock(block)) {
            const r = link.getBoundingClientRect();
            setClickedLink({
              text: (link.textContent ?? "").trim(),
              href: link.getAttribute("href") ?? "",
              rect: { left: r.left, top: r.top, width: r.width, height: r.height },
              at: Date.now(),
            });
          }
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
        {toolbarShown && placement !== "below" && (
          <BlockToolbar block={block} dragListeners={listeners ?? undefined} dragAttributes={attributes} path={path} pinned={isSelected} placement={placement} />
        )}
        {(toolbarShown && placement === "below") || menuEditing ? (
          // Below the block: the toolbar (first, short blocks) and the menu
          // editor, stacked, flush with the block's bottom edge.
          <div className="absolute left-0 right-0 top-full z-30 flex flex-col items-start" onClick={(e) => e.stopPropagation()}>
            {toolbarShown && placement === "below" && (
              <BlockToolbar block={block} dragListeners={listeners ?? undefined} dragAttributes={attributes} path={path} pinned={isSelected} placement="flow" />
            )}
            {menuEditing && (
              <React.Suspense fallback={null}>
                <MenuCanvasEditor block={block} path={path} clicked={clickedLink} onClickedDone={() => setClickedLink(null)} />
              </React.Suspense>
            )}
          </div>
        ) : null}
        {isEditing && !isSelected && (
          <span data-block-label className="lg:hidden absolute top-1 left-1 z-10 rounded-md bg-black/40 text-white text-[10px] font-medium px-1.5 py-0.5 select-none pointer-events-none">
            {name}
          </span>
        )}
        {isHiddenInEditor && (
          <span className="absolute top-1 right-1 z-10 rounded-md bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 select-none pointer-events-none">
            Hidden
          </span>
        )}
        <BlockErrorBoundary blockId={block.id} blockType={block.type}>
          <BlockRenderer block={block} isPreview={!isEditing} path={path} />
        </BlockErrorBoundary>
      </div>
    </BlockContextMenu>
  );
}
