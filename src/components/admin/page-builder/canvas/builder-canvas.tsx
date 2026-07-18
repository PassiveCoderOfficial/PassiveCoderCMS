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
import { useBuilderStore } from "@/lib/store/builder";
import { SortableBlockWrapper } from "./sortable-block-wrapper";
import { BlockRenderer } from "./block-renderer";
import { TemplatePicker } from "./template-picker";
import { InsertSectionButton } from "./insert-section-button";
import { InlineEditContext, type InlineEditContextValue } from "@/components/blocks/inline-text";
import { cn } from "@/lib/utils";
import type { Block, ContainerBlockProps } from "@/types/cms";

// One level deep — a container's own columns cannot hold another container.
function findBlockAnywhere(blocks: Block[], id: string): Block | undefined {
  const direct = blocks.find((b) => b.id === id);
  if (direct) return direct;
  for (const b of blocks) {
    if (b.type === "container") {
      for (const col of (b as ContainerBlockProps).data.columns) {
        const found = col.blocks.find((c) => c.id === id);
        if (found) return found;
      }
    }
  }
  return undefined;
}

export function BuilderCanvas() {
  const { blocks, mode, breakpoint, moveBlock, selectBlock, selectedBlockId, updateBlock } = useBuilderStore();
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
    const block = findBlockAnywhere(blocks, String(event.active.id));
    if (block) setActiveBlock(block);
  }, [blocks]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) { setActiveBlock(null); return; }

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    const store = useBuilderStore.getState();

    // Dropped directly on a column's empty-space droppable (id "column:<containerId>:<index>")
    // rather than on a sibling block — relocate into that column.
    const columnMatch = overIdStr.match(/^column:(.+):(\d+)$/);
    if (columnMatch) {
      store.moveBlockToColumn(activeIdStr, { containerId: columnMatch[1], columnIndex: Number(columnMatch[2]) });
      setActiveBlock(null);
      return;
    }

    // Which array (root, or which container column) does the active block
    // actually live in? moveBlock needs that path to find both ids.
    let path: { containerId: string; columnIndex: number } | undefined;
    if (!store.blocks.some((b) => b.id === activeIdStr)) {
      for (const b of store.blocks) {
        if (b.type !== "container") continue;
        const container = b as ContainerBlockProps;
        const colIdx = container.data.columns.findIndex((c) => c.blocks.some((cb) => cb.id === activeIdStr));
        if (colIdx !== -1) { path = { containerId: b.id, columnIndex: colIdx }; break; }
      }
    }

    const siblingArr = path
      ? (store.blocks.find((b) => b.id === path!.containerId) as ContainerBlockProps | undefined)
          ?.data.columns[path.columnIndex]?.blocks ?? []
      : store.blocks;

    if (siblingArr.some((b) => b.id === overIdStr)) {
      // over is a sibling in the same list active is already in — plain reorder.
      moveBlock(activeIdStr, overIdStr, path);
    } else {
      // over is a block living in a different column/root — relocate active
      // there (appends; fine-grained position-among-siblings is a follow-up).
      let overPath: { containerId: string; columnIndex: number } | undefined;
      for (const b of store.blocks) {
        if (b.type !== "container") continue;
        const container = b as ContainerBlockProps;
        const colIdx = container.data.columns.findIndex((c) => c.blocks.some((cb) => cb.id === overIdStr));
        if (colIdx !== -1) { overPath = { containerId: b.id, columnIndex: colIdx }; break; }
      }
      if (overPath) {
        store.moveBlockToColumn(activeIdStr, overPath);
      }
    }
    setActiveBlock(null);
  }, [moveBlock]);

  const containerWidth = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  }[breakpoint];

  if (blocks.length === 0) {
    return mode === "edit" ? (
      <TemplatePicker />
    ) : (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center p-8">
        <p className="text-muted-foreground text-sm max-w-sm">This page is empty.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-full bg-white transition-all duration-300",
        mode === "preview" && "pointer-events-none",
      )}
      style={{ width: containerWidth, margin: "0 auto" }}
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
