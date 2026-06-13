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
import type { Block } from "@/types/cms";

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
    const block = blocks.find((b) => b.id === event.active.id);
    if (block) setActiveBlock(block);
  }, [blocks]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      moveBlock(String(active.id), String(over.id));
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
