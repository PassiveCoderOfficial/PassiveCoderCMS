/**
 * The name the builder shows for a block (2026-11-17): the block catalog's
 * own name ("Menu", "Classic header", "Hero"...), in Bangla when the
 * dashboard is in Bangla. Used by the settings panel title, the Layers list,
 * the block toolbar and the breadcrumb, which showed the raw type id
 * ("header nav", "navigation") before.
 */
import type { BlockType } from "@/types/cms";
import { getBlockDefinition } from "./block-registry";
import { labelBn } from "./block-labels-bn";

export function blockDisplayName(type: BlockType | string, lang: string = "en"): string {
  const en = getBlockDefinition(type as BlockType)?.label ?? String(type).replace(/_/g, " ");
  return lang === "bn" ? labelBn(en) ?? en : en;
}
