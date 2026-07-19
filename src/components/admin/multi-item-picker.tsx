"use client";

import React, { useEffect, useState } from "react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChevronUp, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ItemBoxSource } from "@/types/cms";

type PickerSource = Exclude<ItemBoxSource, "inline">;

interface Option {
  id: string;
  label: string;
}

// Same list-shape fetches item-box-settings.tsx / item-box-block-client.tsx
// already do per source, centralized here since the picker needs the full
// available list regardless of which source is active.
async function fetchOptions(source: PickerSource, groupId?: string): Promise<Option[]> {
  if (source === "services" || source === "features" || source === "portfolio" || source === "testimonials") {
    if (!groupId) return [];
    const endpoint = { services: "/api/services", features: "/api/features", portfolio: "/api/portfolio", testimonials: "/api/testimonials" }[source];
    const itemsKey = { services: "service_items", features: "feature_items", portfolio: "portfolio_items", testimonials: "testimonials" }[source];
    const groups = await fetch(endpoint).then((r) => r.json());
    const group = (Array.isArray(groups) ? groups : []).find((g: { id: string }) => g.id === groupId);
    const rows = (group?.[itemsKey] ?? []) as { id: string; title?: string; name?: string }[];
    return rows.map((r) => ({ id: r.id, label: r.title ?? r.name ?? "Untitled" }));
  }
  // blog/pages
  const type = source === "blog" ? "post" : "page";
  const rows = await fetch(`/api/pages?type=${type}`).then((r) => r.json());
  return (Array.isArray(rows) ? rows : []).map((r: { id: string; title: string }) => ({ id: r.id, label: r.title }));
}

/** Pick a subset of a content source's items and set their display order —
 *  reusable for any block that fetches a list from a group/pages/posts and
 *  currently just renders "all of them, most-recent/sort_order first". */
export function MultiItemPicker({
  source, groupId, value, onChange,
}: {
  source: PickerSource;
  groupId?: string;
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [options, setOptions] = useState<Option[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchOptions(source, groupId).then((opts) => { if (!cancelled) setOptions(opts); }).catch(() => { if (!cancelled) setOptions([]); });
    return () => { cancelled = true; };
  }, [source, groupId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  if (options === null) {
    return <p className="text-[11px] text-muted-foreground">Loading items…</p>;
  }
  if (!options.length) {
    return <p className="text-[11px] text-muted-foreground">No items found for this source yet.</p>;
  }

  const byId = new Map(options.map((o) => [o.id, o]));
  const selected = value.filter((id) => byId.has(id));
  const unselected = options.filter((o) => !selected.includes(o.id));

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  const move = (id: string, dir: "up" | "down") => {
    const idx = selected.indexOf(id);
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= selected.length) return;
    const next = [...selected];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = selected.indexOf(String(active.id));
    const newIndex = selected.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(selected, oldIndex, newIndex));
  };

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground">
        {selected.length ? `${selected.length} selected, in this order — drag or use the arrows to reorder.` : "None selected — showing all items in default order."}
      </p>

      {selected.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={selected} strategy={verticalListSortingStrategy}>
            <div className="space-y-1 border rounded-lg p-1.5 bg-muted/20">
              {selected.map((id, i) => (
                <SelectedRow
                  key={id}
                  id={id}
                  label={byId.get(id)?.label ?? "Untitled"}
                  canMoveUp={i > 0}
                  canMoveDown={i < selected.length - 1}
                  onMove={(dir) => move(id, dir)}
                  onRemove={() => toggle(id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {unselected.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {unselected.map((o) => (
            <label key={o.id} className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-muted/40 cursor-pointer text-xs">
              <input type="checkbox" checked={false} onChange={() => toggle(o.id)} className="h-3.5 w-3.5" />
              <span className="truncate">{o.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function SelectedRow({
  id, label, canMoveUp, canMoveDown, onMove, onRemove,
}: {
  id: string;
  label: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (dir: "up" | "down") => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("flex items-center gap-1.5 px-1.5 py-1 rounded bg-background border text-xs", isDragging && "opacity-40")}
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none shrink-0">
        <GripVertical className="h-3 w-3 opacity-50" />
      </button>
      <span className="flex-1 truncate">{label}</span>
      <button onClick={() => onMove("up")} disabled={!canMoveUp} className="p-0.5 rounded hover:bg-muted disabled:opacity-20 disabled:pointer-events-none">
        <ChevronUp className="h-3 w-3" />
      </button>
      <button onClick={() => onMove("down")} disabled={!canMoveDown} className="p-0.5 rounded hover:bg-muted disabled:opacity-20 disabled:pointer-events-none">
        <ChevronDown className="h-3 w-3" />
      </button>
      <button onClick={onRemove} className="p-0.5 rounded hover:bg-muted">
        <X className="h-3 w-3 text-destructive" />
      </button>
    </div>
  );
}
