"use client";

import React from "react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, ChevronDown, ChevronUp, GripVertical, Monitor, Tablet, Smartphone } from "lucide-react";
import { useBuilderStore, type ContainerPath } from "@/lib/store/builder";
import { cn } from "@/lib/utils";
import type { Block, ContainerBlockProps } from "@/types/cms";

type Device = "desktop" | "tablet" | "mobile";
const DEVICES: { key: Device; icon: typeof Monitor; label: string }[] = [
  { key: "desktop", icon: Monitor, label: "Desktop" },
  { key: "tablet", icon: Tablet, label: "Tablet" },
  { key: "mobile", icon: Smartphone, label: "Mobile" },
];

export function LayersPanel() {
  const { blocks, selectedBlockId, selectBlock, hoverBlock, setMobileSheet, moveBlock, updateBlock } = useBuilderStore();

  const handleSelect = (id: string | undefined) => {
    selectBlock(id);
    setMobileSheet(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = (event: DragEndEvent, path?: ContainerPath) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    moveBlock(String(active.id), String(over.id), path);
  };

  const toggleDevice = (block: Block, device: Device, path?: ContainerPath) => {
    const current = block.hideOn ?? [];
    const hideOn = current.includes(device) ? current.filter((d) => d !== device) : [...current, device];
    // Hidden on all three devices == the legacy full-hide flag, kept in sync
    // so the existing server-side `visible` filter still applies.
    const visible = hideOn.length < 3;
    updateBlock(block.id, { hideOn, visible }, path);
  };

  const moveUpDown = (block: Block, dir: "up" | "down", siblings: Block[], path?: ContainerPath) => {
    const idx = siblings.findIndex((b) => b.id === block.id);
    const targetIdx = dir === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= siblings.length) return;
    moveBlock(block.id, siblings[targetIdx].id, path);
  };

  if (!blocks.length) {
    return <p className="text-center text-xs text-muted-foreground py-6 px-3">No blocks on this page yet</p>;
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e)}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((block) => (
            <LayerRow
              key={block.id}
              block={block}
              depth={0}
              siblings={blocks}
              selectedBlockId={selectedBlockId}
              onSelect={handleSelect}
              onHover={hoverBlock}
              onToggleDevice={toggleDevice}
              onMove={moveUpDown}
              onDragEndInColumn={handleDragEnd}
              sensors={sensors}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

function LayerRow({
  block, depth, path, siblings, selectedBlockId, onSelect, onHover, onToggleDevice, onMove, onDragEndInColumn, sensors,
}: {
  block: Block;
  depth: number;
  path?: ContainerPath;
  siblings: Block[];
  selectedBlockId?: string;
  onSelect: (id: string | undefined) => void;
  onHover: (id: string | undefined) => void;
  onToggleDevice: (block: Block, device: Device, path?: ContainerPath) => void;
  onMove: (block: Block, dir: "up" | "down", siblings: Block[], path?: ContainerPath) => void;
  onDragEndInColumn: (event: DragEndEvent, path?: ContainerPath) => void;
  sensors: ReturnType<typeof useSensors>;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const isContainer = block.type === "container";
  const columns = isContainer ? (block as ContainerBlockProps).data.columns : [];
  const isSelected = selectedBlockId === block.id;
  const hideOn = block.hideOn ?? [];
  const idx = siblings.findIndex((b) => b.id === block.id);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-40")}>
      <div
        className={cn(
          "w-full flex items-center gap-1 py-1.5 pr-1 rounded text-xs transition-colors",
          isSelected ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-foreground",
        )}
        style={{ paddingLeft: 8 + depth * 14 }}
        onMouseEnter={() => onHover(block.id)}
        onMouseLeave={() => onHover(undefined)}
      >
        <button {...attributes} {...listeners} className="shrink-0 cursor-grab active:cursor-grabbing p-0.5 -ml-1 touch-none">
          <GripVertical className="h-3 w-3 opacity-50" />
        </button>

        {isContainer ? (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
            className="shrink-0 p-0.5"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </span>
        ) : (
          <span className="w-3 shrink-0" />
        )}

        <button onClick={() => onSelect(block.id)} className="flex-1 min-w-0 text-left truncate capitalize">
          {block.type.replace(/_/g, " ")}
        </button>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => onMove(block, "up", siblings, path)}
            disabled={idx <= 0}
            className="p-0.5 rounded hover:bg-black/10 disabled:opacity-20 disabled:pointer-events-none"
            title="Move up"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            onClick={() => onMove(block, "down", siblings, path)}
            disabled={idx >= siblings.length - 1}
            className="p-0.5 rounded hover:bg-black/10 disabled:opacity-20 disabled:pointer-events-none"
            title="Move down"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
          {DEVICES.map((d) => {
            const hidden = hideOn.includes(d.key);
            return (
              <button
                key={d.key}
                onClick={(e) => { e.stopPropagation(); onToggleDevice(block, d.key, path); }}
                title={`${hidden ? "Show" : "Hide"} on ${d.label}`}
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded shrink-0 transition-colors",
                  hidden ? "bg-transparent text-current opacity-30" : "bg-white text-black",
                )}
              >
                <d.icon className="h-3 w-3" />
              </button>
            );
          })}
        </div>
      </div>

      {isContainer && expanded && columns.map((col, i) => {
        const colPath: ContainerPath = { containerId: block.id, columnIndex: i };
        return (
          <div key={col.id}>
            <div
              style={{ paddingLeft: 8 + (depth + 1) * 14 }}
              className="text-[10px] uppercase tracking-wide text-muted-foreground py-1"
            >
              Column {i + 1}
            </div>
            {col.blocks.length ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => onDragEndInColumn(e, colPath)}>
                <SortableContext items={col.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  {col.blocks.map((child) => (
                    <LayerRow
                      key={child.id}
                      block={child}
                      depth={depth + 2}
                      path={colPath}
                      siblings={col.blocks}
                      selectedBlockId={selectedBlockId}
                      onSelect={onSelect}
                      onHover={onHover}
                      onToggleDevice={onToggleDevice}
                      onMove={onMove}
                      onDragEndInColumn={onDragEndInColumn}
                      sensors={sensors}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              <p style={{ paddingLeft: 8 + (depth + 2) * 14 }} className="text-[10px] text-muted-foreground py-1">
                Empty
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
