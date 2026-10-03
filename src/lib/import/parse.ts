/**
 * Import parsers (browser-safe). Every source is normalised into ImportItem
 * so one server step (lib/import/apply.ts) handles WordPress files,
 * WordPress-by-URL, the migration plugin, CSV and our own site export alike.
 * Parsing runs in the browser for uploaded files, so a 40 MB WordPress
 * export never has to fit through Vercel's 4.5 MB request limit: the client
 * sends the parsed items in chunks.
 */
import { XMLParser } from "fast-xml-parser";
import type { Block } from "@/types/cms";

export type ImportItem =
  | {
      kind: "page" | "post";
      title: string;
      slug: string;
      html?: string;
      /** Native blocks (our own site export); used as-is instead of html. */
      blocks?: Block[];
      excerpt?: string;
      date?: string;
      featured_image?: string;
      seo?: { title?: string; description?: string };
      /** Old URL path on the source site, for an automatic redirect. */
      old_path?: string;
    }
  | {
      kind: "product";
      name: string;
      slug: string;
      html?: string;
      short_description?: string;
      price?: number | null;
      compare_price?: number | null;
      sku?: string;
      stock?: number | null;
      images?: string[];
      seo?: { title?: string; description?: string };
      old_path?: string;
    }
  | {
      kind: "contact";
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
      company?: string;
      tags?: string[];
      notes?: string;
    };

export function slugify(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ঀ-৿]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "imported";
}

export function pathOf(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const p = new URL(url).pathname.replace(/\/+$/, "");
    return p || undefined;
  } catch {
    return undefined;
  }
}

const num = (v: unknown): number | null => {
  const n = parseFloat(String(v ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
};
const arr = <T,>(v: T | T[] | undefined): T[] => (v == null ? [] : Array.isArray(v) ? v : [v]);
const text = (v: unknown): string => (v == null ? "" : typeof v === "object" && "#text" in (v as object) ? String((v as { "#text": unknown })["#text"]) : String(v));

/** WordPress export file (Tools > Export > All content). */
export function parseWxr(xml: string): { items: ImportItem[]; site?: string } {
  const parser = new XMLParser({ ignoreAttributes: false, cdataPropName: false, parseTagValue: false, trimValues: true });
  const doc = parser.parse(xml);
  const channel = doc?.rss?.channel;
  if (!channel) throw new Error("This doesn't look like a WordPress export file.");
  const raw = arr(channel.item) as Record<string, unknown>[];

  const meta = (it: Record<string, unknown>) => {
    const m: Record<string, string> = {};
    for (const pm of arr(it["wp:postmeta"] as Record<string, unknown>[])) m[text(pm["wp:meta_key"])] = text(pm["wp:meta_value"]);
    return m;
  };
  // Attachment id -> file URL, for featured images and product galleries.
  const attachments = new Map<string, string>();
  for (const it of raw) {
    if (text(it["wp:post_type"]) === "attachment") attachments.set(text(it["wp:post_id"]), text(it["wp:attachment_url"]) || text(it.guid));
  }

  const items: ImportItem[] = [];
  for (const it of raw) {
    const type = text(it["wp:post_type"]);
    const status = text(it["wp:status"]);
    if (!["page", "post", "product"].includes(type) || ["trash", "auto-draft", "inherit"].includes(status)) continue;
    const m = meta(it);
    const title = text(it.title) || "Untitled";
    const slug = text(it["wp:post_name"]) || slugify(title);
    const seo = {
      title: m._yoast_wpseo_title || m.rank_math_title || undefined,
      description: m._yoast_wpseo_metadesc || m.rank_math_description || undefined,
    };
    const html = text(it["content:encoded"]);
    const old_path = pathOf(text(it.link));
    if (type === "product") {
      const gallery = (m._product_image_gallery || "").split(",").map((id) => attachments.get(id.trim())).filter(Boolean) as string[];
      const thumb = attachments.get(m._thumbnail_id);
      const regular = num(m._regular_price);
      const sale = num(m._sale_price);
      items.push({
        kind: "product", name: title, slug, html, short_description: text(it["excerpt:encoded"]),
        price: sale ?? regular ?? num(m._price), compare_price: sale != null ? regular : null,
        sku: m._sku || undefined, stock: m._manage_stock === "yes" ? num(m._stock) : null,
        images: [thumb, ...gallery].filter(Boolean) as string[], seo, old_path,
      });
    } else {
      items.push({
        kind: type as "page" | "post", title, slug, html, excerpt: text(it["excerpt:encoded"]) || undefined,
        date: text(it["wp:post_date_gmt"]) || undefined, featured_image: attachments.get(m._thumbnail_id), seo, old_path,
      });
    }
  }
  return { items, site: text(channel.link) || undefined };
}

/** Minimal RFC 4180 CSV parser (quotes, escaped quotes, CRLF). */
export function parseCsv(input: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  const s = input.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((v) => v.trim()));
  if (!head) return [];
  const keys = head.map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""));
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

/** Contacts from a CSV (our export, Mailchimp, Google Contacts, HubSpot and similar headers). */
export function contactsFromCsv(csv: string): ImportItem[] {
  const pick = (r: Record<string, string>, ...keys: string[]) => keys.map((k) => r[k]).find((v) => v) || undefined;
  return parseCsv(csv).map((r) => {
    let first = pick(r, "first_name", "firstname", "given_name", "first");
    let last = pick(r, "last_name", "lastname", "family_name", "surname", "last");
    const full = pick(r, "name", "full_name");
    if (!first && !last && full) { const [f, ...rest] = full.split(/\s+/); first = f; last = rest.join(" ") || undefined; }
    const tags = pick(r, "tags", "labels", "group_membership");
    return {
      kind: "contact" as const, first_name: first, last_name: last,
      email: pick(r, "email", "email_address", "e_mail", "e_mail_1_value")?.toLowerCase(),
      phone: pick(r, "phone", "phone_number", "mobile", "phone_1_value", "whatsapp"),
      company: pick(r, "company", "organization", "organization_name", "organization_1_name"),
      tags: tags ? tags.split(/[;|]|:::/).map((t) => t.trim()).filter(Boolean) : undefined,
      notes: pick(r, "notes", "note"),
    };
  }).filter((c) => c.email || c.phone);
}

/** Our own full-site JSON export, imported into another site. */
export function itemsFromSiteJson(json: unknown): ImportItem[] {
  const d = json as Record<string, Record<string, unknown>[] | undefined>;
  if (!d || typeof d !== "object" || (!d.pages && !d.products && !d.contacts)) throw new Error("This isn't a Passive Coder site export.");
  const items: ImportItem[] = [];
  for (const p of [...(d.pages ?? []), ...(d.posts ?? [])]) {
    items.push({
      kind: p.type === "post" ? "post" : "page", title: String(p.title ?? "Untitled"), slug: String(p.slug ?? slugify(String(p.title ?? ""))),
      blocks: Array.isArray(p.blocks) ? (p.blocks as Block[]) : [], excerpt: (p.excerpt as string) ?? undefined,
      featured_image: (p.featured_image as string) ?? undefined, seo: (p.seo as { title?: string; description?: string }) ?? undefined,
    });
  }
  for (const p of d.products ?? []) {
    items.push({
      kind: "product", name: String(p.name ?? "Product"), slug: String(p.slug ?? slugify(String(p.name ?? ""))),
      html: (p.description as string) ?? undefined, short_description: (p.short_description as string) ?? undefined,
      price: num(p.price), compare_price: num(p.compare_price), sku: (p.sku as string) ?? undefined,
      stock: p.track_inventory ? num(p.stock_quantity) : null, images: (p.images as string[]) ?? [],
      seo: (p.seo as { title?: string; description?: string }) ?? undefined,
    });
  }
  for (const c of d.contacts ?? []) {
    items.push({
      kind: "contact", first_name: (c.first_name as string) ?? undefined, last_name: (c.last_name as string) ?? undefined,
      email: (c.email as string) ?? undefined, phone: (c.phone as string) ?? undefined, company: (c.company as string) ?? undefined,
      tags: (c.tags as string[]) ?? undefined, notes: (c.notes as string) ?? undefined,
    });
  }
  return items;
}
