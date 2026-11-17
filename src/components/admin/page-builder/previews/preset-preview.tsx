"use client";

import React from "react";
import type { Block, BlockType } from "@/types/cms";
import { asCardsIfFamily } from "@/lib/blocks/cards";
import { createBlock } from "@/modules/page-builder/block-registry";
import type { SectionPreset } from "@/modules/page-builder/section-presets";
import { PresetThumbnail } from "../blocks-panel/preset-thumbnail";
import { BlockPreview } from "./block-preview";

/**
 * Live previews for the section and block pickers: each preset (or block
 * type) drawn from its own sample content, exactly as it lands on the page
 * (presets go through asCardsIfFamily, as the pickers do when adding).
 *
 * Built once per page load and cached, so scrolling the lists back and forth
 * never rebuilds them.
 */
export type PreviewSource = { block: Block; sig: string };

/** Sample photos are 1920px wide; a thumbnail needs a fraction of that. */
function lighterSamplePhotos(block: Block): Block {
  const json = JSON.stringify(block).replace(
    /(https:\/\/images\.unsplash\.com\/[^"\s]*?[?&]w=)(\d{4,})/g,
    (_, head: string) => `${head}800`,
  );
  return JSON.parse(json) as Block;
}

const presetCache = new Map<string, PreviewSource>();

export function presetPreviewSource(preset: SectionPreset): PreviewSource {
  let hit = presetCache.get(preset.id);
  if (!hit) {
    const block = lighterSamplePhotos(asCardsIfFamily(preset.create()));
    hit = { block, sig: `preset:${preset.id}` };
    presetCache.set(preset.id, hit);
  }
  return hit;
}

/**
 * Block types whose registry default has nothing to show without live data
 * (they fetch on mount, or are header/footer parts drawn inside a container).
 * Their hover card shows the description only.
 */
const NO_BLOCK_PREVIEW = new Set<BlockType>([
  "container", "ecommerce_cart", "accounting_feed", "ecommerce_products", "pricing_catalog",
  "donor_group_cards", "donor_list", "donor_map", "donor_requests",
  "marketplace_booking", "marketplace_request", "marketplace_vendor_directory",
  "re_search", "re_listings", "re_communities", "re_developers", "re_calculator", "re_lead_form",
  "results_search", "results_alumni", "results_courses", "booking", "status_tracker",
  "header_logo", "header_nav", "header_cta", "header_booking", "header_cart", "header_account",
]);

const blockCache = new Map<string, PreviewSource | null>();

/** Registry default for a block type, or null when it has no useful preview. */
export function blockTypePreviewSource(type: BlockType): PreviewSource | null {
  if (blockCache.has(type)) return blockCache.get(type)!;
  let hit: PreviewSource | null = null;
  if (!NO_BLOCK_PREVIEW.has(type)) {
    const created = createBlock(type);
    if (created) hit = { block: lighterSamplePhotos(asCardsIfFamily(created)), sig: `block:${type}` };
  }
  blockCache.set(type, hit);
  return hit;
}

/** The live thumbnail for a section preset, with its wireframe as the fallback. */
export function PresetPreview({ preset, className }: { preset: SectionPreset; className?: string }) {
  const { block, sig } = presetPreviewSource(preset);
  return <BlockPreview block={block} sig={sig} className={className} fallback={<PresetThumbnail kind={preset.thumb} />} />;
}
