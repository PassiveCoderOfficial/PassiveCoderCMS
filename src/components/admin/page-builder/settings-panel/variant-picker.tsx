"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { getVariantsForBlock, hasVariants } from "@/modules/page-builder/block-variants";
import { VariantThumbnail } from "./variant-thumbnail";
import { cn } from "@/lib/utils";
import { Check, Moon } from "lucide-react";
import type { Block } from "@/types/cms";

/**
 * Layout-variant picker for the selected block.
 *
 * Until now variants could only be set by a template at seed time — there was
 * no way to change a block's layout while editing, so most of the variants the
 * blocks implement were unreachable. This exposes them all.
 *
 * Renders nothing for block types with no variants, so it can sit
 * unconditionally at the top of the Style tab.
 */
export function VariantPicker({ block }: { block: Block }) {
  const { updateBlock } = useBuilderStore();

  if (!hasVariants(block.type)) return null;
  const variants = getVariantsForBlock(block.type);
  const current = block.templateVariant ?? "";

  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-semibold">Layout</p>
        <p className="text-[10px] text-muted-foreground leading-snug">
          Changes how this block is arranged. Your content stays the same.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {variants.map((v) => {
          const active = current === v.key;
          return (
            <button
              key={v.key || "default"}
              type="button"
              // Empty string rather than undefined: `Object.assign` in the
              // store would write an explicit `undefined` key into the saved
              // JSON, whereas "" reads as "no variant" to every block's
              // dispatch and serialises cleanly.
              onClick={() => updateBlock(block.id, { templateVariant: v.key } as Partial<Block>)}
              title={v.description}
              className={cn(
                "group relative rounded-lg border p-1 text-left transition-all",
                active
                  ? "border-primary ring-1 ring-primary/40 bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-muted/40",
              )}
            >
              <VariantThumbnail kind={v.thumb} dark={v.dark} />
              <div className="flex items-center gap-1 px-0.5 pt-1">
                <span className="flex-1 truncate text-[10px] font-medium leading-tight">{v.label}</span>
                {v.dark && (
                  <Moon className="h-2.5 w-2.5 shrink-0 text-muted-foreground" aria-label="Suits dark palettes" />
                )}
                {active && <Check className="h-3 w-3 shrink-0 text-primary" />}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground leading-snug">
        {variants.find((v) => v.key === current)?.description}
      </p>
    </div>
  );
}
