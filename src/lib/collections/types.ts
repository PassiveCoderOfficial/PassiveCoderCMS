/**
 * Collections: site-defined content types (WordPress custom post types, our
 * way). Shared by the dashboard, the API, the blocks that read entries and the
 * detail-page route. Table definitions: supabase/migrations/160_collections.sql.
 */

export const FIELD_TYPES = [
  "text", "textarea", "richtext", "number", "price", "date", "image", "gallery",
  "url", "email", "phone", "select", "boolean", "list", "relation",
] as const;
export type CollectionFieldType = typeof FIELD_TYPES[number];

export const FIELD_TYPE_LABELS: Record<CollectionFieldType, string> = {
  text: "Short text", textarea: "Long text", richtext: "Formatted text", number: "Number", price: "Price",
  date: "Date", image: "Image", gallery: "Image gallery", url: "Link (URL)", email: "Email", phone: "Phone",
  select: "Dropdown", boolean: "Yes / No", list: "List (one per line)", relation: "Link to another collection",
};

/** Text-like types whose value differs per language. */
export const TRANSLATABLE_TYPES = new Set<CollectionFieldType>(["text", "textarea", "richtext", "list", "select"]);

export type CollectionField = {
  key: string;
  label: string;
  type: CollectionFieldType;
  /** select: the choices. */
  options?: string[];
  /** relation: target collection type id. */
  relation_type?: string;
  /** Has a value per language (default: true for text-like types). */
  translatable?: boolean;
  required?: boolean;
  /** Shown as a column / subtitle in the dashboard list. */
  show_in_list?: boolean;
  help?: string;
  placeholder?: string;
};

export type CollectionType = {
  id: string;
  tenant_id: string;
  slug: string;
  name: string;
  singular: string;
  icon: string;
  description: string;
  fields: CollectionField[];
  has_detail_page: boolean;
  url_prefix: string | null;
  template_page_id: string | null;
  visibility: "public" | "private";
  sort_mode: "manual" | "newest" | "title";
  show_in_sidebar: boolean;
  translations: Record<string, { name?: string; singular?: string; description?: string; fields?: Record<string, string> }>;
  sort_order: number;
};

export type CollectionCategory = {
  id: string;
  type_id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  parent_id: string | null;
  translations: Record<string, { name?: string; description?: string }>;
  sort_order: number;
};

export type EntryText = { title?: string; excerpt?: string; body?: string; data?: Record<string, unknown> };

export type CollectionEntry = {
  id: string;
  type_id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  image_url: string | null;
  gallery: { url: string; alt?: string }[];
  data: Record<string, unknown>;
  category_ids: string[];
  featured: boolean;
  status: "draft" | "published";
  translations: Record<string, EntryText>;
  seo: { title?: string; description?: string };
  sort_order: number;
  created_at: string;
  updated_at: string;
};

/** Built-in entry fields a block or template can read besides the type's own. */
export const CORE_KEYS = ["title", "excerpt", "body", "image", "category", "url"] as const;

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9؀-ۿ]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || "item";
}

export function fieldKey(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "").slice(0, 40) || "field";
}

export const isTranslatable = (f: CollectionField) => f.translatable ?? TRANSLATABLE_TYPES.has(f.type);

/** Entry text in one language, falling back field by field to the default language. */
export function localizeEntry(e: CollectionEntry, lang?: string | null): CollectionEntry {
  const t = lang ? e.translations?.[lang] : undefined;
  if (!t) return e;
  const pick = (v: unknown, fallback: string) => (typeof v === "string" && v.trim() ? v : fallback);
  const data = { ...e.data };
  for (const [k, v] of Object.entries(t.data ?? {})) {
    if (v == null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && !v.length)) continue;
    data[k] = v;
  }
  return { ...e, title: pick(t.title, e.title), excerpt: pick(t.excerpt, e.excerpt), body: pick(t.body, e.body), data };
}

export function localizeCategory(c: CollectionCategory, lang?: string | null): CollectionCategory {
  const name = lang ? c.translations?.[lang]?.name : undefined;
  return name?.trim() ? { ...c, name } : c;
}

export function localizeType(t: CollectionType, lang?: string | null): CollectionType {
  const tr = lang ? t.translations?.[lang] : undefined;
  if (!tr) return t;
  const labels = tr.fields ?? {};
  return {
    ...t, name: tr.name || t.name, singular: tr.singular || t.singular,
    fields: t.fields.map((f) => (labels[f.key]?.trim() ? { ...f, label: labels[f.key] } : f)),
  };
}

/** Public URL of an entry's detail page, or undefined when the type has none. */
export function entryPath(type: Pick<CollectionType, "has_detail_page" | "url_prefix" | "slug">, entry: Pick<CollectionEntry, "slug">, lang?: string | null) {
  if (!type.has_detail_page) return undefined;
  const prefix = (type.url_prefix || type.slug).replace(/^\/+|\/+$/g, "");
  return `${lang ? `/${lang}` : ""}/${prefix}/${entry.slug}`;
}

/** Display string of a field value: lists joined, booleans Yes/No, prices as typed. */
export function displayValue(field: CollectionField | undefined, v: unknown): string {
  if (v == null) return "";
  if (Array.isArray(v)) return v.map((x) => (typeof x === "object" && x && "url" in x ? "" : String(x))).filter(Boolean).join(", ");
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (field?.type === "date" && typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) {
    const d = new Date(v + (v.length === 10 ? "T00:00:00" : ""));
    return isNaN(d.getTime()) ? v : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  return String(v);
}

/** Read any entry value by key: core keys first, then the type's own fields. */
export function entryValue(e: CollectionEntry, key: string, cats?: CollectionCategory[]): unknown {
  switch (key) {
    case "title": return e.title;
    case "excerpt": return e.excerpt;
    case "body": return e.body;
    case "image": return e.image_url;
    case "gallery": return e.gallery;
    case "category": return (cats ?? []).filter((c) => e.category_ids.includes(c.id)).map((c) => c.name).join(", ");
    default: return e.data?.[key];
  }
}
