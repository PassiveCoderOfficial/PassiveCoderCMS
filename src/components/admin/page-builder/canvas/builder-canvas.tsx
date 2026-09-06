"use client";

import React, { useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useBuilderStore, type ContainerPath } from "@/lib/store/builder";
import { SortableBlockWrapper } from "./sortable-block-wrapper";
import { BlockRenderer } from "./block-renderer";
import { InsertSectionButton } from "./insert-section-button";
import { InlineEditContext, type InlineEditContextValue } from "@/components/blocks/inline-text";
import { cn } from "@/lib/utils";
import type { Block, ContainerBlockProps } from "@/types/cms";

/** Path to the ARRAY a block currently lives in — every ancestor container
 *  step, but not the block's own entry. `undefined` means the block lives at
 *  page root. Built from the store's own arbitrary-depth path resolver so
 *  this stays correct as containers nest inside containers. */
function pathToBlock(blockId: string): ContainerPath | undefined {
  const entries = useBuilderStore.getState().getBlockPath(blockId);
  if (!entries) return undefined;
  const ancestors = entries.slice(0, -1);
  if (ancestors.length === 0) return undefined;
  return ancestors.map((e) => ({ containerId: e.id, columnIndex: e.columnIndex ?? 0 }));
}

export function BuilderCanvas({ surfaceClassName = "bg-white" }: {
  /** Ground the blocks are previewed against. Defaults to white, which is
   *  right for a page. The header builder overrides it: overlay headers render
   *  light text on no background of their own and are invisible on white. */
  surfaceClassName?: string;
} = {}) {
  const { blocks, mode, moveBlock, selectBlock, selectedBlockId, updateBlock } = useBuilderStore();
  const [activeBlock, setActiveBlock] = React.useState<Block | null>(null);

  const inlineEdit = React.useMemo<InlineEditContextValue>(() => ({
    updateField: (blockId, field, value) => {
      const block = useBuilderStore.getState().blocks.find((b) => b.id === blockId);
      if (!block) return;
      const data = { ...(block.data as Record<string, unknown>) };
      const parts = field.split(".");
      if (parts.length === 2) {
        data[parts[0]] = { ...((data[parts[0]] as Record<string, unknown>) ?? {}), [parts[1]]: value };
      } else {
        data[field] = value;
      }
      updateBlock(blockId, { data } as Partial<Block>);
    },
  }), [updateBlock]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const block = useBuilderStore.getState().getBlock(String(event.active.id));
    if (block) setActiveBlock(block);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) { setActiveBlock(null); return; }

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    const store = useBuilderStore.getState();

    // Dropped directly on a column's empty-space droppable
    // (id "column:<containerId>:<index>") rather than on a sibling block —
    // relocate into that column. The droppable id only names its OWN
    // container/index, not the ancestor chain above it, so resolve the full
    // path via that container's own current position in the tree.
    const columnMatch = overIdStr.match(/^column:(.+):(\d+)$/);
    if (columnMatch) {
      const containerId = columnMatch[1];
      const columnIndex = Number(columnMatch[2]);
      const ancestorPath = pathToBlock(containerId) ?? [];
      store.moveBlockToColumn(activeIdStr, [...ancestorPath, { containerId, columnIndex }]);
      setActiveBlock(null);
      return;
    }

    // Which array (root, or which container column, at any depth) does the
    // active block actually live in? moveBlock needs that path to find both ids.
    const path = pathToBlock(activeIdStr);
    const activeStep = path ? path[path.length - 1] : undefined;
    const siblingArr = activeStep
      ? (store.getBlock(activeStep.containerId) as ContainerBlockProps | undefined)
          ?.data.columns[activeStep.columnIndex]?.blocks ?? []
      : store.blocks;

    if (siblingArr.some((b) => b.id === overIdStr)) {
      // over is a sibling in the same list active is already in — plain reorder.
      moveBlock(activeIdStr, overIdStr, path);
    } else {
      // over is a block living in a different column/root — relocate active
      // there (appends; fine-grained position-among-siblings is a follow-up).
      // overIdStr's own ancestor chain (root -> its container's column) is
      // exactly the destination path.
      const overPath = pathToBlock(overIdStr);
      if (overPath) store.moveBlockToColumn(activeIdStr, overPath);
    }
    setActiveBlock(null);
  }, [moveBlock]);

  // Canvas is always full-width of whatever frame the shell gives it. The
  // desktop shell wraps this in a fixed-width box for the Tablet/Mobile
  // breakpoint previews; the mobile shell gives it the full phone width (the
  // device itself is the preview). Setting width here too would double-apply.

  if (blocks.length === 0) {
    return mode === "edit" ? (
      // Every tenant already picked a real site template at signup (real
      // pages, real copy, the tenant's own brand colors) — this used to
      // offer a SECOND, older template system on top of that for any blank
      // page (a freshly created page, or an empty header/footer), picking
      // from industry starters like "Restaurant / Café" or "Wedding
      // Planner" that have nothing to do with the site already built. Worse,
      // the header/footer builder used the exact same picker, offering those
      // industry page starters as if a nav bar could BE a restaurant page.
      // A blank canvas now just opens straight to adding a section — the
      // same "+" used between existing sections everywhere else.
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-3 text-center p-8">
        <p className="text-muted-foreground text-sm max-w-sm">Nothing here yet.</p>
        <InsertSectionButton prominent />
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center p-8">
        <p className="text-muted-foreground text-sm max-w-sm">This page is empty.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        // isolate caps every descendant's z-index (including blocks like the
        // nav's z-[9999] mega-menu, authored for a real page's stacking
        // context) so it can never render above the builder's own chrome —
        // toolbars, the left panel, dialogs — regardless of the block's own
        // z-index value.
        "cms-builder-canvas min-h-full w-full transition-all duration-300 isolate",
        surfaceClassName,
        // transform-gpu makes this element the containing block for any
        // `position: fixed` descendant (a transformed ancestor takes over from
        // the viewport, per CSS Transforms). Blocks authored for a real page
        // legitimately use `fixed` — the navigation bar's overlay-hero mode
        // does — and without this they escape the canvas entirely and render
        // across the dashboard's own header, on top of the search field and
        // toolbar. Same class of bug the nav's mega-menu already had to fix
        // by anchoring to its <nav> instead of the viewport; this closes it
        // for every block at the canvas boundary rather than one at a time.
        "transform-gpu",
        mode === "preview" && "pointer-events-none",
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) selectBlock(undefined);
      }}
    >
      <InlineEditContext.Provider value={mode === "edit" ? inlineEdit : null}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            {mode === "edit" && <InsertSectionButton />}
            {blocks.map((block) => (
              <React.Fragment key={block.id}>
                <SortableBlockWrapper block={block} isEditing={mode === "edit"} />
                {mode === "edit" && <InsertSectionButton afterId={block.id} />}
              </React.Fragment>
            ))}
          </SortableContext>
          <DragOverlay>
            {activeBlock && (
              <div className="opacity-80 shadow-2xl rounded-lg overflow-hidden">
                <BlockRenderer block={activeBlock} isPreview />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </InlineEditContext.Provider>
    </div>
  );
}
