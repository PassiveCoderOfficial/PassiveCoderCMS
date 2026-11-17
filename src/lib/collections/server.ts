import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { slugify, type CollectionCategory, type CollectionEntry, type CollectionField, type CollectionType, FIELD_TYPES } from "./types";

type Admin = Awaited<ReturnType<typeof createAdminClient>>;

const TYPE_COLS = ["slug", "name", "singular", "icon", "description", "fields", "has_detail_page", "url_prefix", "template_page_id", "visibility", "sort_mode", "show_in_sidebar", "translations", "sort_order"] as const;
const ENTRY_COLS = ["title", "slug", "excerpt", "body", "image_url", "gallery", "data", "category_ids", "featured", "status", "translations", "seo", "sort_order"] as const;
const CAT_COLS = ["name", "slug", "description", "image_url", "parent_id", "translations", "sort_order"] as const;

function pick<K extends string>(body: Record<string, unknown>, cols: readonly K[]) {
  const out: Partial<Record<K, unknown>> = {};
  for (const k of cols) if (k in body && body[k] !== undefined) out[k] = body[k];
  return out;
}

export function cleanFields(raw: unknown): CollectionField[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: CollectionField[] = [];
  for (const f of raw as Partial<CollectionField>[]) {
    const key = String(f?.key ?? "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!key || seen.has(key) || ["title", "slug", "excerpt", "body", "image", "gallery", "category", "url"].includes(key)) continue;
    seen.add(key);
    const type = (FIELD_TYPES as readonly string[]).includes(String(f.type)) ? f.type! : "text";
    out.push({
      key, type, label: String(f.label ?? key).slice(0, 80),
      ...(type === "select" ? { options: (f.options ?? []).map(String).filter(Boolean) } : {}),
      ...(type === "relation" && f.relation_type ? { relation_type: String(f.relation_type) } : {}),
      ...(f.translatable != null ? { translatable: !!f.translatable } : {}),
      ...(f.required ? { required: true } : {}),
      ...(f.show_in_list ? { show_in_list: true } : {}),
      ...(f.help ? { help: String(f.help).slice(0, 200) } : {}),
      ...(f.placeholder ? { placeholder: String(f.placeholder).slice(0, 120) } : {}),
    });
  }
  return out;
}

export function typeInput(body: Record<string, unknown>) {
  const row = pick(body, TYPE_COLS) as Record<string, unknown>;
  if ("fields" in row) row.fields = cleanFields(row.fields);
  if (typeof row.slug === "string") row.slug = slugify(row.slug);
  if (typeof row.url_prefix === "string") row.url_prefix = row.url_prefix.replace(/^\/+|\/+$/g, "").toLowerCase() || null;
  return row;
}

export function entryInput(body: Record<string, unknown>) {
  const row = pick(body, ENTRY_COLS) as Record<string, unknown>;
  if (typeof row.slug === "string") row.slug = slugify(row.slug);
  if ("category_ids" in row && !Array.isArray(row.category_ids)) row.category_ids = [];
  if ("gallery" in row) {
    row.gallery = (Array.isArray(row.gallery) ? row.gallery : [])
      .map((g) => (typeof g === "string" ? { url: g } : g))
      .filter((g): g is { url: string } => !!g && typeof (g as { url?: unknown }).url === "string");
  }
  return row;
}

export function categoryInput(body: Record<string, unknown>) {
  const row = pick(body, CAT_COLS) as Record<string, unknown>;
  if (typeof row.slug === "string") row.slug = slugify(row.slug);
  return row;
}

/** A free slug for an entry in this type: "abha-tour", "abha-tour-2"... */
export async function uniqueEntrySlug(admin: Admin, typeId: string, wanted: string, exceptId?: string) {
  const base = slugify(wanted);
  const { data } = await admin.from("collection_entries").select("id, slug").eq("type_id", typeId).like("slug", `${base}%`);
  const taken = new Set((data ?? []).filter((r) => r.id !== exceptId).map((r) => r.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
}

export async function ownType(admin: Admin, tenantId: string, typeId: string) {
  const { data } = await admin.from("collection_types").select("*").eq("id", typeId).eq("tenant_id", tenantId).maybeSingle();
  return (data as CollectionType | null) ?? null;
}

// ─── Site-side reads (blocks, detail pages) ──────────────────────────────────

export type EntryQuery = {
  typeId: string;
  categoryId?: string;
  featuredOnly?: boolean;
  limit?: number;
  ids?: string[];
  sort?: "manual" | "newest" | "oldest" | "title";
};

/** Published entries of a public type, for the live site. */
export async function loadEntries(tenantId: string, q: EntryQuery) {
  const admin = await createAdminClient();
  const { data: type } = await admin.from("collection_types").select("*").eq("id", q.typeId).eq("tenant_id", tenantId).maybeSingle();
  if (!type || type.visibility !== "public") return null;
  let query = admin.from("collection_entries").select("*").eq("type_id", q.typeId).eq("status", "published");
  if (q.categoryId) query = query.contains("category_ids", [q.categoryId]);
  if (q.featuredOnly) query = query.eq("featured", true);
  if (q.ids?.length) query = query.in("id", q.ids);
  const sort = q.sort ?? (type.sort_mode as string);
  if (sort === "newest") query = query.order("created_at", { ascending: false });
  else if (sort === "oldest") query = query.order("created_at", { ascending: true });
  else if (sort === "title") query = query.order("title");
  else query = query.order("sort_order").order("created_at", { ascending: false });
  query = query.limit(Math.min(Math.max(q.limit ?? 500, 1), 2000));
  const [{ data: entries }, { data: cats }] = await Promise.all([
    query,
    admin.from("collection_categories").select("*").eq("type_id", q.typeId).order("sort_order"),
  ]);
  let list = (entries ?? []) as CollectionEntry[];
  if (q.ids?.length) {
    const order = new Map(q.ids.map((id, i) => [id, i]));
    list = [...list].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }
  return { type: type as CollectionType, entries: list, categories: (cats ?? []) as CollectionCategory[] };
}
