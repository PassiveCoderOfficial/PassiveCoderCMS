"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, RotateCcw } from "lucide-react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { BLOCK_ELEMENTS } from "@/modules/page-builder/block-elements";
import type { Block, BlockElements } from "@/types/cms";
import { cn } from "@/lib/utils";

/**
 * Reorder / hide a block's own pieces (badge, headline, buttons…). One editor
 * for every block type listed in BLOCK_ELEMENTS; the block renders them via
 * orderElements(). Renders nothing for types that don't support it yet.
 */
export function ElementsEditor({ block }: { block: Block }) {
  const { updateBlock } = useBuilderStore();
  const defs = BLOCK_ELEMENTS[block.type];
  if (!defs) return null;

  const movable = defs.filter((d) => !d.fixed).map((d) => d.key);
  const fixed = defs.filter((d) => d.fixed).map((d) => d.key);
  const saved = (block.elements?.order ?? []).filter((k) => movable.includes(k));
  const order = [...saved, ...movable.filter((k) => !saved.includes(k))];
  const hidden = new Set(block.elements?.hidden ?? []);
  const label = (k: string) => defs.find((d) => d.key === k)?.label ?? k;
  const isDefault = !block.elements?.order?.length && !block.elements?.hidden?.length;

  const save = (next: BlockElements) => {
    const clean: BlockElements = {};
    if (next.order?.length) clean.order = next.order;
    if (next.hidden?.length) clean.hidden = next.hidden;
    updateBlock(block.id, { elements: Object.keys(clean).length ? clean : undefined });
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = order.slice();
    [next[i], next[j]] = [next[j], next[i]];
    save({ order: next, hidden: [...hidden] });
  };
  const toggle = (k: string) => {
    const h = new Set(hidden);
    if (h.has(k)) h.delete(k); else h.add(k);
    save({ order: saved.length ? order : undefined, hidden: [...h] });
  };

  return (
    <div className="space-y-2 border-t pt-4">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">Elements</Label>
        {!isDefault && (
          <button type="button" onClick={() => save({})} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">Change the order of this section&apos;s parts, or hide the ones you don&apos;t need.</p>
      <ul className="space-y-1">
        {[...order, ...fixed].map((k, i) => (
          <li key={k} className={cn("flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs", hidden.has(k) && "opacity-50")}>
            <span className="flex-1 truncate">{label(k)}</span>
            {i < order.length && (
              <>
                <button type="button" aria-label={`Move ${label(k)} up`} disabled={i === 0} onClick={() => move(i, -1)} className="p-1 rounded hover:bg-muted disabled:opacity-30">
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button type="button" aria-label={`Move ${label(k)} down`} disabled={i === order.length - 1} onClick={() => move(i, 1)} className="p-1 rounded hover:bg-muted disabled:opacity-30">
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button type="button" aria-label={hidden.has(k) ? `Show ${label(k)}` : `Hide ${label(k)}`} onClick={() => toggle(k)} className="p-1 rounded hover:bg-muted">
              {hidden.has(k) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
