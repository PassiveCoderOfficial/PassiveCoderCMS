/**
 * Cards: one block for every "grid of cards" job (2026-10-16). It replaces
 * four blocks that did the same thing: Services, Why Choose Us (features),
 * Icon Grid and Item Box. Every layout those blocks had is a Cards layout, and
 * any layout works with any content.
 *
 * Rendering never changes: a Cards block is drawn by handing it to the
 * original component of the layout's family (`toFamilyBlock`), with data
 * shaped the way that component expects. Old blocks still render as before;
 * `legacyToCards` converts them, and the conversion round-trips exactly, so a
 * migrated page looks pixel-identical.
 *
 * Item fields: `title` and `link` are canonical. Family aliases are kept in
 * sync (Icon Grid's `label`/`url`, Item Box's `image`/`link` objects) so each
 * family's own settings panel keeps working unchanged.
 */
import type { Block } from "@/types/cms";

export type CardFamily = "services" | "features" | "icon_grid" | "item_box";
export const CARD_FAMILIES: CardFamily[] = ["services", "features", "icon_grid", "item_box"];

/** Named layouts per family (from block-variants). Keys are unique across families. */
export const FAMILY_VARIANTS: Record<CardFamily, string[]> = {
  services: ["icon-cards-grid", "dark-grid-cards", "site-showcase", "image-cards-dark", "bordered-list", "numbered", "menu-cards", "program-cards-dark", "image-tiles", "bento", "photo-cards", "boutique-tiles"],
  // text-tiles, arrow-cards and grouped-list were offered in the Cards picker
  // but missing here, so picking one kept the old family and drew its
  // default look (Nov 2026; no saved Cards block used them).
  features: ["icon-list-cards", "highlight-cards", "centered-icons", "bento-grid", "numbered-columns", "split-list", "alternating-media", "dark", "overview-quote", "numbered-grid", "image-stats", "text-tiles", "arrow-cards", "pro-bento", "pro-grid", "pro-split"],
  icon_grid: ["colored-tiles", "circle-icons", "outlined-cards", "bordered-matrix", "dark-tiles", "numbered-features", "pill-row", "minimal-inline", "grouped-list", "logo-strip"],
  item_box: [],
};

/** Each family's original default look (no named layout) as a Cards layout. */
export const CLASSIC_VARIANT: Record<CardFamily, string> = {
  services: "services-classic",
  features: "features-classic",
  icon_grid: "icons-classic",
  item_box: "smart-cards",
};

export function familyOfVariant(variant: string | undefined, fallback: CardFamily = "services"): CardFamily {
  if (!variant) return fallback;
  for (const f of CARD_FAMILIES) {
    if (CLASSIC_VARIANT[f] === variant || FAMILY_VARIANTS[f].includes(variant)) return f;
  }
  return fallback;
}

/** Fields each family needs, with valid values, used when content moves between families. */
const FAMILY_DEFAULTS: Record<CardFamily, Record<string, unknown>> = {
  services: { layout: "grid", columns: 3, cardStyle: "elevated" },
  features: { layout: "grid", columns: 3, style: "card" },
  icon_grid: { columns: 4, style: "plain", iconSize: "md" },
  item_box: { source: "inline", layout: "grid", columns: 3, cardStyle: "elevated" },
};
const VALID: Record<CardFamily, Record<string, unknown[]>> = {
  services: { layout: ["grid", "list", "cards", "icon-list"], cardStyle: ["flat", "elevated", "bordered", "gradient"] },
  features: { layout: ["grid", "alternating", "icon-list", "centered"], style: ["minimal", "card", "gradient"] },
  icon_grid: { style: ["plain", "card", "colored"], iconSize: ["sm", "md", "lg"] },
  item_box: { layout: ["grid", "list"], cardStyle: ["flat", "elevated", "bordered", "gradient"] },
};
const MAX_COLS: Record<CardFamily, number> = { services: 10, features: 4, icon_grid: 6, item_box: 4 };

type AnyItem = Record<string, unknown> & { id?: string };

/** Canonical item from any family's item. Keeps every original field (round-trip safe). */
function canonicalItem(it: AnyItem, family: CardFamily): AnyItem {
  const out: AnyItem = { ...it };
  if (family === "icon_grid") {
    if (it.label != null) out.title = it.label;
    if (it.url != null) out.link = it.url;
  }
  if (family === "item_box") {
    const img = it.image as { type?: string; value?: string } | undefined;
    if (img?.type === "url" && img.value) out.imageUrl = img.value;
    if (img?.type === "icon" && img.value) out.icon = img.value;
    const ln = it.link as { type?: string; url?: string } | string | undefined;
    if (ln && typeof ln === "object") out.linkRef = ln;
    if (ln && typeof ln === "object" && ln.url) out.link = ln.url;
    if (ln && typeof ln === "object" && !ln.url) delete out.link;
  }
  return out;
}

/** Item shaped for a family's component, from a canonical item. */
function familyItem(it: AnyItem, family: CardFamily): AnyItem {
  const out: AnyItem = { ...it };
  if (family === "icon_grid") {
    out.label = (it.title as string) ?? (it.label as string) ?? "";
    if (it.link != null) out.url = it.link;
    if (!out.icon) out.icon = "Star";
  }
  if (family === "item_box") {
    out.image = it.imageUrl ? { type: "url", value: it.imageUrl } : it.icon ? { type: "icon", value: it.icon } : (it.image ?? { type: "none" });
    out.link = it.linkRef ?? (typeof it.link === "string" && it.link ? { type: "manual", url: it.link } : undefined);
  }
  if (family === "services" || family === "features") {
    out.title = (it.title as string) ?? (it.label as string) ?? "";
    out.description = (it.description as string) ?? "";
    if (family === "services" && typeof it.link !== "string") out.link = (it.linkRef as { url?: string } | undefined)?.url;
  }
  return out;
}

/** Data valid for a family: its defaults filled, mismatched enum values reset, columns clamped. */
function fitData(data: Record<string, unknown>, family: CardFamily): Record<string, unknown> {
  const d: Record<string, unknown> = { ...FAMILY_DEFAULTS[family], ...data };
  for (const [k, allowed] of Object.entries(VALID[family])) {
    if (!allowed.includes(d[k])) d[k] = FAMILY_DEFAULTS[family][k];
  }
  const c = Number(d.columns) || (FAMILY_DEFAULTS[family].columns as number);
  d.columns = Math.min(Math.max(c, family === "icon_grid" || family === "features" || family === "item_box" ? 2 : 2), MAX_COLS[family]);
  return d;
}

export const isCardFamily = (t: string): t is CardFamily => (CARD_FAMILIES as string[]).includes(t);

/** Old Services / Why Choose Us / Icon Grid / Item Box block -> Cards block (same look). */
export function legacyToCards(block: Block): Block {
  const family = block.type as CardFamily;
  const data = (block.data ?? {}) as Record<string, unknown>;
  const items = Array.isArray(data.items) ? (data.items as AnyItem[]).map((it) => canonicalItem(it, family)) : [];
  return {
    ...block,
    type: "cards",
    templateVariant: block.templateVariant || CLASSIC_VARIANT[family],
    data: { ...data, family, items },
  } as unknown as Block;
}

/** Cards block -> the family block its layout is drawn by (what the original component expects). */
export function toFamilyBlock(block: Block): Block {
  const data = (block.data ?? {}) as Record<string, unknown>;
  const family = familyOfVariant(block.templateVariant, (data.family as CardFamily) ?? "services");
  const items = Array.isArray(data.items) ? (data.items as AnyItem[]).map((it) => familyItem(it, family)) : [];
  const variant = block.templateVariant === CLASSIC_VARIANT[family] ? undefined : block.templateVariant;
  return { ...block, type: family, templateVariant: variant, data: { ...fitData(data, family), items } } as unknown as Block;
}

/**
 * After an edit through a family's own settings panel, bring canonical fields
 * back in line with the aliases that panel edits (Icon Grid label/url, Item
 * Box image/link objects), and record the family the layout belongs to.
 */
export function syncCards(block: Block): Block {
  const data = (block.data ?? {}) as Record<string, unknown>;
  const family = familyOfVariant(block.templateVariant, (data.family as CardFamily) ?? "services");
  const items = Array.isArray(data.items) ? (data.items as AnyItem[]).map((it) => canonicalItem(it, family)) : data.items;
  return { ...block, data: { ...data, family, items } } as unknown as Block;
}

/** Switching layout: the new layout's family gets valid fields; content (items) carries over. */
export function setCardsVariant(block: Block, variant: string): Partial<Block> {
  const data = (block.data ?? {}) as Record<string, unknown>;
  const family = familyOfVariant(variant, (data.family as CardFamily) ?? "services");
  return { templateVariant: variant, data: { ...fitData(data, family), family } } as unknown as Partial<Block>;
}

/** Picker presets ("Services", "Why Choose Us", "Icon Grid", "Item Box") drop in a Cards block. */
export function asCardsIfFamily(block: Block): Block {
  return isCardFamily(block.type) ? legacyToCards(block) : block;
}
