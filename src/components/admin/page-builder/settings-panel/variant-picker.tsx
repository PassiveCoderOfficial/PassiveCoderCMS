"use client";

import React, { memo, useCallback, useMemo, useRef } from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { getVariantsForBlock, hasVariants, type BlockVariant } from "@/modules/page-builder/block-variants";
import { VariantThumbnail } from "./variant-thumbnail";
import { BlockPreview, useSettled } from "../previews/block-preview";
import { usePreviewHover, type HoverPreviewPayload } from "../previews/preview-hover";
import { activeVariantKey, blockWithVariant, variantPatch } from "../previews/variant-preview";
import { cn } from "@/lib/utils";
import { Check, Moon } from "lucide-react";
import type { Block } from "@/types/cms";

/**
 * Layout-variant picker for the selected block.
 *
 * Every option is a live, scaled-down render of THIS block with ITS content
 * in that layout: the block the click would produce (same patch, same
 * merge), drawn by the canvas's own renderer in the site's theme. So what the
 * picker shows is what the block becomes. Hovering (or focusing) an option
 * shows it larger beside the panel. The old wireframe only appears if a
 * layout fails to render.
 *
 * Renders nothing for block types with no variants, so it can sit
 * unconditionally at the top of the Style tab.
 */
export function VariantPicker({ block }: { block: Block }) {
  if (!hasVariants(block.type)) return null;
  // Keyed by block: switching selection starts from the new block at once
  // instead of showing the previous one's layouts while previews settle.
  return <VariantGrid key={block.id} block={block} />;
}

function VariantGrid({ block }: { block: Block }) {
  const updateBlock = useBuilderStore((s) => s.updateBlock);
  const variants = useMemo(() => getVariantsForBlock(block.type), [block.type]);
  const active = activeVariantKey(block, variants);
  // Previews follow edits a moment later, so typing in a field never waits
  // on a grid of re-renders.
  const source = useSettled(block);
  const hover = usePreviewHover();

  const latest = useRef(block);
  latest.current = block;
  const select = useCallback((key: string) => {
    const b = latest.current;
    updateBlock(b.id, variantPatch(b, key, variants));
  }, [updateBlock, variants]);

  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-semibold">Layout</p>
        <p className="text-[10px] text-muted-foreground leading-snug">
          Changes how this block is arranged. Your content stays the same.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1.5" data-preview-scope="">
        {variants.map((v) => (
          <VariantTile
            key={v.key || "default"}
            source={source}
            variant={v}
            variants={variants}
            active={active === v.key}
            onSelect={select}
            onHover={hover.show}
            onFocusPreview={hover.showFocus}
            onLeave={hover.leave}
            onBlurPreview={hover.hide}
          />
        ))}
      </div>
      {hover.card}

      <p className="text-[10px] text-muted-foreground leading-snug">
        {active === null
          ? "None of these matches this block's saved layout exactly. Pick one to set it."
          : variants.find((v) => v.key === active)?.description}
      </p>
    </div>
  );
}

const VariantTile = memo(function VariantTile({ source, variant, variants, active, onSelect, onHover, onFocusPreview, onLeave, onBlurPreview }: {
  source: Block;
  variant: BlockVariant;
  variants: BlockVariant[];
  active: boolean;
  onSelect: (key: string) => void;
  onHover: (el: HTMLElement, payload: HoverPreviewPayload) => void;
  onFocusPreview: (el: HTMLElement, payload: HoverPreviewPayload) => void;
  onLeave: () => void;
  onBlurPreview: () => void;
}) {
  // Exactly the block a click on this option produces.
  const preview = useMemo(() => blockWithVariant(source, variant.key, variants), [source, variant.key, variants]);
  const sig = useMemo(() => JSON.stringify(preview), [preview]);
  const fallback = <VariantThumbnail kind={variant.thumb} dark={variant.dark} />;
  const payload: HoverPreviewPayload = { block: preview, sig, title: variant.label, description: variant.description, fallback };

  return (
    <button
      type="button"
      onClick={() => onSelect(variant.key)}
      onMouseEnter={(e) => onHover(e.currentTarget, payload)}
      onMouseLeave={onLeave}
      onFocus={(e) => onFocusPreview(e.currentTarget, payload)}
      onBlur={onBlurPreview}
      aria-pressed={active}
      aria-label={`${variant.label} layout`}
      data-variant-key={variant.key}
      className={cn(
        "group relative rounded-lg border p-1 text-left transition-all",
        active
          ? "border-primary ring-1 ring-primary/40 bg-primary/5"
          : "border-border hover:border-primary/40 hover:bg-muted/40",
      )}
    >
      <BlockPreview block={preview} sig={sig} fallback={fallback} />
      <div className="flex items-center gap-1 px-0.5 pt-1">
        <span className="flex-1 truncate text-[10px] font-medium leading-tight">{variant.label}</span>
        {variant.dark && (
          <Moon className="h-2.5 w-2.5 shrink-0 text-muted-foreground" aria-label="Dark background" />
        )}
        {active && <Check className="h-3 w-3 shrink-0 text-primary" />}
      </div>
    </button>
  );
});
