import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import type { Block } from "@/types/cms";
import { blockRegistry } from "@/modules/page-builder/block-registry";
import { translatedSlug } from "@/lib/i18n-site/translate";
import {
  displayValue, entryValue, localizeCategory, localizeEntry, localizeType,
  type CollectionCategory, type CollectionEntry, type CollectionType,
} from "./types";

/**
 * Entry pages: /<url_prefix>/<entry slug> (and /<lang>/<url_prefix>/<slug>).
 * The design is one template page per collection (an ordinary builder page
 * whose texts use {{tokens}}), so every entry looks the same and the client
 * only edits entry data. Without a template, a default layout is generated.
 *
 * Tokens: {{title}} {{excerpt}} {{body}} {{image}} {{category}} {{url}} and
 * {{<field key>}}. A Gallery or Table block bound to the collection "@entry"
 * shows this entry's photos / details.
 */

export type EntryPage = {
  type: CollectionType;
  entry: CollectionEntry;
  categories: CollectionCategory[];
  lang: string | null;
  /** Same entry in every site language: { en: "/tours/abha", ar: "/ar/tours/abha" }. */
  alternates: Record<string, string>;
};

/** The entry a path points to, or null. Cached per request (metadata + body). */
export const findEntryPage = cache(async (tenantId: string, segments: string[]): Promise<EntryPage | null> => {
  if (segments.length < 2 || segments.length > 3) return null;
  const admin = await createAdminClient();
  let lang: string | null = null;
  let rest = segments;
  const { data: s } = await admin.from("site_settings").select("language, site_languages").eq("tenant_id", tenantId).maybeSingle();
  const main = ((s?.language as string) || "en").split("-")[0];
  const langs = ((s?.site_languages as string[] | null) ?? []).filter((l) => l !== main);
  if (segments.length === 3) {
    if (!langs.includes(segments[0])) return null;
    lang = segments[0];
    rest = segments.slice(1);
  }
  const [prefix, slug] = rest.map((x) => decodeURIComponent(x).toLowerCase());
  const { data: types } = await admin.from("collection_types").select("*").eq("tenant_id", tenantId).eq("has_detail_page", true).eq("visibility", "public");
  const type = ((types ?? []) as CollectionType[]).find((t) => (t.url_prefix || t.slug) === prefix);
  if (!type) return null;
  const [{ data: entry }, { data: cats }] = await Promise.all([
    admin.from("collection_entries").select("*").eq("type_id", type.id).eq("slug", slug).eq("status", "published").maybeSingle(),
    admin.from("collection_categories").select("*").eq("type_id", type.id).order("sort_order"),
  ]);
  if (!entry) return null;
  const path = `/${prefix}/${slug}`;
  const alternates = langs.length ? Object.fromEntries([[main, path], ...langs.map((l) => [l, `/${l}${path}`])]) : {};
  return { type, entry: entry as CollectionEntry, categories: (cats ?? []) as CollectionCategory[], lang, alternates };
});

/** Template blocks for this type (translated template when there is one), or the generated default. */
export async function entryTemplate(tenantId: string, type: CollectionType, lang: string | null): Promise<Block[]> {
  if (type.template_page_id) {
    const admin = await createAdminClient();
    const { data: base } = await admin.from("pages").select("slug, blocks, draft_blocks").eq("id", type.template_page_id).eq("tenant_id", tenantId).maybeSingle();
    if (base) {
      if (lang) {
        const { data: tr } = await admin.from("pages").select("blocks").eq("tenant_id", tenantId).eq("slug", translatedSlug(base.slug as string, lang)).is("deleted_at", null).maybeSingle();
        if (Array.isArray(tr?.blocks) && tr.blocks.length) return tr.blocks as Block[];
      }
      const blocks = (Array.isArray(base.blocks) && base.blocks.length ? base.blocks : base.draft_blocks) as Block[] | null;
      if (blocks?.length) return blocks;
    }
  }
  return defaultEntryTemplate(type);
}

function make(type: string, data: Record<string, unknown>, extra: Partial<Block> = {}): Block {
  const def = blockRegistry.find((d) => d.type === type);
  const base = def ? def.create() : ({ id: crypto.randomUUID(), type } as Block);
  return { ...base, ...extra, data: { ...(base as { data?: Record<string, unknown> }).data, ...data } } as Block;
}

/** Default entry page: photo banner, description, photos, details table. Also what "Create template page" starts from. */
export function defaultEntryTemplate(type: CollectionType): Block[] {
  const detailKeys = type.fields.filter((f) => !["image", "gallery", "richtext", "textarea"].includes(f.type)).map((f) => f.key);
  return [
    make("hero", {
      layout: "split", title: "{{title}}", subtitle: "{{category}}", description: "{{excerpt}}", imageUrl: "{{image}}", imageAlt: "{{title}}",
      primaryButton: { label: "Enquire now", url: "/contact", variant: "primary" }, secondaryButton: undefined,
    }),
    make("text", { content: "{{body}}", alignment: "left", columns: 1, typography: {} }),
    ...(detailKeys.length ? [make("table", { title: "Details", columns: [], rows: [], firstColumnHeader: true, striped: true, mobileLayout: "scroll", collection: { typeId: "@entry", columns: detailKeys } })] : []),
    make("gallery", { title: "Photos", layout: "grid", columns: 3, gap: "md", images: [], lightbox: true, collection: { typeId: "@entry", galleryMode: "all" } }),
  ];
}

const TOKEN = /\{\{\s*([a-z0-9_]+)\s*\}\}/gi;

/** Template blocks with this entry's values in place of {{tokens}}; @entry galleries / tables filled. */
export function fillEntry(blocks: Block[], page: EntryPage, path: string): Block[] {
  const { type, lang } = page;
  const entry = localizeEntry(page.entry, lang);
  const cats = page.categories.map((c) => localizeCategory(c, lang));
  const t = localizeType(type, lang);
  const value = (key: string): string => {
    if (key === "url") return path;
    if (key === "type") return t.name;
    if (key === "body") return entry.body ? (/<[a-z][\s\S]*>/i.test(entry.body) ? entry.body : entry.body.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("")) : "";
    const f = type.fields.find((x) => x.key === key);
    return displayValue(f, entryValue(entry, key, cats));
  };
  const walk = (node: unknown): unknown => {
    if (typeof node === "string") {
      if (!node.includes("{{")) return node;
      return node.replace(TOKEN, (_, k: string) => value(k.toLowerCase()));
    }
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === "object") {
      const o = node as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(o)) out[k] = walk(v);
      return out;
    }
    return node;
  };
  return blocks.map((raw) => {
    const block = walk(raw) as Block;
    const data = block.data as Record<string, unknown> & { collection?: { typeId?: string; galleryMode?: string; columns?: string[] } };
    if (data?.collection?.typeId !== "@entry") return block;
    const { collection, ...rest } = data;
    if (block.type === "gallery") {
      const urls = [...(collection.galleryMode === "all" && entry.image_url ? [entry.image_url] : []), ...entry.gallery.map((g) => g.url)];
      if (!urls.length) return { ...block, visible: false } as Block;
      return { ...block, data: { ...rest, images: urls.map((url, i) => ({ id: `${entry.id}-${i}`, url, alt: entry.title })) } } as Block;
    }
    if (block.type === "table") {
      const keys = collection.columns?.length ? collection.columns : type.fields.map((f) => f.key);
      const rows = keys.map((k) => [t.fields.find((f) => f.key === k)?.label ?? (k === "category" ? "Category" : k), value(k)]).filter(([, v]) => v);
      if (!rows.length) return { ...block, visible: false } as Block;
      return { ...block, data: { ...rest, columns: ["", ""], rows, firstColumnHeader: true } } as Block;
    }
    return block;
  }).filter((b) => b.visible !== false);
}

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}

/** The template page itself, opened on the site: shown with the first entry as a sample. */
export async function sampleEntryPage(tenantId: string, typeId: string): Promise<EntryPage | null> {
  const admin = await createAdminClient();
  const { data: type } = await admin.from("collection_types").select("*").eq("id", typeId).eq("tenant_id", tenantId).maybeSingle();
  if (!type) return null;
  const [{ data: entry }, { data: cats }] = await Promise.all([
    admin.from("collection_entries").select("*").eq("type_id", typeId).eq("status", "published").order("sort_order").limit(1).maybeSingle(),
    admin.from("collection_categories").select("*").eq("type_id", typeId).order("sort_order"),
  ]);
  if (!entry) return null;
  return { type: type as CollectionType, entry: entry as CollectionEntry, categories: (cats ?? []) as CollectionCategory[], lang: null, alternates: {} };
}
