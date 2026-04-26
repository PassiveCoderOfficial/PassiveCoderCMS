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
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import type { Block } from "@/types/cms";
import { createBlock } from "@/modules/page-builder/block-registry";

export function BuilderCanvas() {
  const { blocks, mode, breakpoint, moveBlock, selectBlock, selectedBlockId } = useBuilderStore();
  const [activeBlock, setActiveBlock] = React.useState<Block | null>(null);

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
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Plus className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Start building your page</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          Click a block from the left panel to add it to your page, or drag and drop blocks here.
        </p>
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((block) => (
            <SortableBlockWrapper key={block.id} block={block} isEditing={mode === "edit"} />
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
    </div>
  );
}
