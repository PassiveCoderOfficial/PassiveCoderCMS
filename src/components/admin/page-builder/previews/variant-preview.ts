/**
 * The data side of the Layout picker, shared by the click and the preview.
 *
 * `variantPatch` is the one place that decides what picking a layout writes,
 * and `applyPatch` merges it the way the builder store's `updateBlock` does,
 * so each option's live preview is exactly the block the click produces.
 * `activeVariantKey` reads a block the way its renderer does, so the ticked
 * option is the layout the canvas is actually drawing.
 */
import type { Block } from "@/types/cms";
import {
  getVariantsForBlock,
  VARIANT_DATA_FIELD,
  VARIANT_FALLBACK,
  type BlockVariant,
} from "@/modules/page-builder/block-variants";
import {
  CLASSIC_VARIANT,
  FAMILY_VARIANTS,
  familyOfVariant,
  setCardsVariant,
  syncCards,
  type CardFamily,
} from "@/lib/blocks/cards";

const ZERO = { top: 0, right: 0, bottom: 0, left: 0 };

/** What picking `key` writes, for `updateBlock(block.id, patch)`. */
export function variantPatch(block: Block, key: string, variants: BlockVariant[] = getVariantsForBlock(block.type)): Partial<Block> {
  // Cards: the new layout's family gets valid settings; content carries over.
  if (block.type === "cards") return setCardsVariant(block, key);
  const field = VARIANT_DATA_FIELD[block.type];
  if (!field) {
    // Edge-to-edge variants paint their own full-width band and spacing;
    // the section padding would leave a rim of page colour around them.
    // Empty string rather than undefined for Default: `Object.assign` in the
    // store would write an explicit `undefined` key into the saved JSON,
    // whereas "" reads as "no variant" to every block's dispatch.
    const edge = variants.find((v) => v.key === key)?.edgeToEdge;
    return (edge ? { templateVariant: key, padding: ZERO } : { templateVariant: key }) as Partial<Block>;
  }
  // `updateBlock` does a shallow Object.assign, so the whole data object has
  // to be rebuilt; passing { data: { layout } } alone would drop the content.
  return { data: { ...(block.data as Record<string, unknown>), [field]: key } } as Partial<Block>;
}

/** The block after `updateBlock(block.id, patch)`: the store's own merge. */
export function applyPatch(block: Block, patch: Partial<Block>): Block {
  const next = { ...block, ...patch } as Block;
  return next.type === "cards" ? ({ ...next, data: syncCards(next).data } as Block) : next;
}

/** The block as it would be with layout `key` picked. */
export function blockWithVariant(block: Block, key: string, variants?: BlockVariant[]): Block {
  return applyPatch(block, variantPatch(block, key, variants));
}

/**
 * The option the renderer is drawing for this block, or null when what it
 * draws matches none of the options (see VARIANT_FALLBACK).
 */
export function activeVariantKey(block: Block, variants: BlockVariant[] = getVariantsForBlock(block.type)): string | null {
  const listed = (k: string) => variants.some((v) => v.key === k);
  if (block.type === "cards") {
    // Same resolution as toFamilyBlock: the layout picks the family, and a
    // family draws its classic look for any key it does not implement.
    const data = (block.data ?? {}) as Record<string, unknown>;
    const family = familyOfVariant(block.templateVariant, (data.family as CardFamily) ?? "services");
    const tv = block.templateVariant;
    if (family !== "item_box" && tv && tv !== CLASSIC_VARIANT[family] && FAMILY_VARIANTS[family].includes(tv)) return tv;
    return CLASSIC_VARIANT[family];
  }
  const field = VARIANT_DATA_FIELD[block.type];
  if (field) {
    const value = (block.data as Record<string, unknown> | undefined)?.[field];
    if (typeof value === "string" && listed(value)) return value;
    return VARIANT_FALLBACK[block.type] ?? null;
  }
  const tv = block.templateVariant ?? "";
  if (listed(tv)) return tv;
  return block.type in VARIANT_FALLBACK ? (VARIANT_FALLBACK[block.type] ?? null) : "";
}
