/**
 * How a block reads a collection (isomorphic: the live site resolves it on
 * the server, the builder canvas in the browser). One binding shape for every
 * block that can show entries: Cards (all layouts), Team, Gallery, Table.
 */
import {
  displayValue, entryPath, entryValue, localizeCategory, localizeEntry, localizeType,
  type CollectionCategory, type CollectionEntry, type CollectionType,
} from "./types";

export type CollectionBinding = {
  typeId: string;
  /** Only entries in this category. */
  categoryId?: string;
  featuredOnly?: boolean;
  /** 0/undefined = all. */
  limit?: number;
  sort?: "manual" | "newest" | "oldest" | "title";
  /** Hand-picked entries in this order (overrides category/featured/limit). */
  ids?: string[];
  /** Field shown small above the title (e.g. duration, region). */
  kicker?: string;
  /** "excerpt" (default), "body", "none" or a field key. */
  description?: string;
  /** Fields listed under the description as label: value rows. */
  meta?: string[];
  /** Field holding a badge/price shown on cards that support one. */
  badge?: string;
  /** Text of the card button (detail page or link field). */
  linkLabel?: string;
  /** Field holding the card link instead of the entry's own page. */
  linkField?: string;
  /** Team: field shown as the person's role. Email/phone fields are picked up by key. */
  roleField?: string;
  /** Gallery: each entry's main image ("covers", default) or every gallery photo ("all"). */
  galleryMode?: "covers" | "all";
  /** Table: columns (core keys like title/category or field keys). */
  columns?: string[];
};

export type ResolvedCollection = { type: CollectionType; entries: CollectionEntry[]; categories: CollectionCategory[] };

/** Apply category / featured / ids / limit / sort to a full entry list (canvas path; the server filters in SQL). */
export function filterEntries(entries: CollectionEntry[], b: CollectionBinding, includeDrafts = false): CollectionEntry[] {
  let list = entries.filter((e) => includeDrafts || e.status === "published");
  if (b.ids?.length) {
    const by = new Map(list.map((e) => [e.id, e]));
    return b.ids.map((id) => by.get(id)).filter((e): e is CollectionEntry => !!e);
  }
  if (b.categoryId) list = list.filter((e) => e.category_ids.includes(b.categoryId!));
  if (b.featuredOnly) list = list.filter((e) => e.featured);
  if (b.sort === "newest") list = [...list].sort((x, y) => y.created_at.localeCompare(x.created_at));
  else if (b.sort === "oldest") list = [...list].sort((x, y) => x.created_at.localeCompare(y.created_at));
  else if (b.sort === "title") list = [...list].sort((x, y) => x.title.localeCompare(y.title));
  return b.limit ? list.slice(0, b.limit) : list;
}

/** Entries as canonical Cards items (title, description, imageUrl, link, kicker, meta, category). */
export function entriesToCardItems(resolved: ResolvedCollection, b: CollectionBinding, lang?: string | null) {
  const r = { ...resolved, type: localizeType(resolved.type, lang) };
  const cats = r.categories.map((c) => localizeCategory(c, lang));
  const field = (k?: string) => r.type.fields.find((f) => f.key === k);
  return r.entries.map((raw) => {
    const e = localizeEntry(raw, lang);
    const desc = b.description === "none" ? "" : b.description && b.description !== "excerpt"
      ? displayValue(field(b.description), entryValue(e, b.description, cats))
      : e.excerpt;
    const link = b.linkField ? String(e.data?.[b.linkField] ?? "") || undefined : entryPath(r.type, e, lang);
    const meta = (b.meta ?? []).map((k) => {
      const f = field(k);
      const value = displayValue(f, entryValue(e, k, cats));
      return value ? { label: f?.label ?? (k === "category" ? "Category" : k), value } : null;
    }).filter((m): m is { label: string; value: string } => !!m);
    const firstCat = cats.find((c) => e.category_ids.includes(c.id));
    // A field keyed "icon" (a Lucide icon name) is the card icon when the entry has no image.
    const icon = typeof e.data?.icon === "string" && e.data.icon ? e.data.icon : undefined;
    return {
      id: e.id,
      title: e.title,
      description: desc,
      ...(e.image_url ? { imageUrl: e.image_url, iconType: "image" as const } : icon ? { icon, iconType: "lucide" as const } : {}),
      ...(link ? { link, linkLabel: b.linkLabel || undefined } : {}),
      ...(b.kicker ? { kicker: displayValue(field(b.kicker), entryValue(e, b.kicker, cats)) || undefined } : {}),
      ...(b.badge ? { badge: displayValue(field(b.badge), entryValue(e, b.badge, cats)) || undefined } : {}),
      ...(meta.length ? { meta } : {}),
      ...(firstCat ? { category: firstCat.name } : {}),
    };
  });
}

/** Table rows from entries: one column per key (core keys or fields). */
export function entriesToTable(resolved: ResolvedCollection, columns: string[], lang?: string | null) {
  const r = { ...resolved, type: localizeType(resolved.type, lang) };
  const cats = r.categories.map((c) => localizeCategory(c, lang));
  const header = columns.map((k) => {
    if (k === "title") return r.type.singular || "Name";
    if (k === "category") return "Category";
    if (k === "excerpt") return "Summary";
    return r.type.fields.find((f) => f.key === k)?.label ?? k;
  });
  const rows = r.entries.map((raw) => {
    const e = localizeEntry(raw, lang);
    return columns.map((k) => (k === "image" ? String(e.image_url ?? "") : displayValue(r.type.fields.find((f) => f.key === k), entryValue(e, k, cats))));
  });
  return { header, rows };
}
