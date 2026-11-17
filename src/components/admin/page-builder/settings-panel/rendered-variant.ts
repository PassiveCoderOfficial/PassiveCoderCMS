import type { BlockType } from "@/types/cms";
import { BLOCK_VARIANTS } from "@/modules/page-builder/block-variants";

/**
 * The layout a block actually draws. Some saved blocks name a variant the
 * renderer does not implement (seed scripts wrote features
 * "alternating-images", faq "accordion-dark", team "dark-avatar-cards"...);
 * those fall through to the default layout, so their settings panel has to
 * show the default layout's fields, not hide them because a variant is set.
 */
export function renderedVariant(type: BlockType, templateVariant: string | undefined): string {
  if (!templateVariant) return "";
  return (BLOCK_VARIANTS[type] ?? []).some((v) => v.key === templateVariant) ? templateVariant : "";
}
