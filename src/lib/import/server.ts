import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import sharp from "sharp";
import sanitizeHtml from "sanitize-html";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createBlock } from "@/modules/page-builder/block-registry";
import type { Block } from "@/types/cms";
import { pathOf, slugify, type ImportItem } from "./parse";

/* ── Safe outbound fetch ───────────────────────────────────────────────
 * Import URLs come from users, so every fetch (site API and each image)
 * refuses private, loopback and link-local addresses and caps size/time. */
function privateIp(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v.startsWith("::ffff:")) return privateIp(v.slice(7));
    return v === "::1" || v === "::" || /^(fc|fd|fe8|fe9|fea|feb)/.test(v);
  }
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

async function assertPublicUrl(raw: string): Promise<URL> {
  const u = new URL(raw);
  if (!/^https?:$/.test(u.protocol)) throw new Error("Only http and https addresses are supported.");
  const addrs = isIP(u.hostname) ? [{ address: u.hostname }] : await lookup(u.hostname, { all: true });
  if (!addrs.length || addrs.some((a) => privateIp(a.address))) throw new Error("That address can't be reached from here.");
  return u;
}

export async function safeFetch(raw: string, { maxBytes = 15 * 1024 * 1024, timeoutMs = 15000, accept }: { maxBytes?: number; timeoutMs?: number; accept?: string } = {}) {
  let url = await assertPublicUrl(raw);
  for (let hop = 0; hop < 4; hop++) {
    const res = await fetch(url, {
      redirect: "manual", signal: AbortSignal.timeout(timeoutMs),
      headers: { "User-Agent": "PassiveCoderImport/1.0 (+https://passivecoder.com)", ...(accept ? { Accept: accept } : {}) },
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = await assertPublicUrl(new URL(res.headers.get("location")!, url).toString());
      continue;
    }
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > maxBytes) throw new Error("File too large");
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > maxBytes) throw new Error("File too large");
    return { res, buf, url: url.toString() };
  }
  throw new Error("Too many redirects");
}

/* ── WordPress by URL (REST API + WooCommerce Store API) ─────────────── */
const MAX_ITEMS = 1500;

type WpRest = {
  id: number; slug: string; link: string; date_gmt?: string;
  title?: { rendered: string }; content?: { rendered: string }; excerpt?: { rendered: string };
  yoast_head_json?: { title?: string; description?: string };
  _embedded?: { "wp:featuredmedia"?: { source_url?: string }[] };
};
type WooStore = {
  id: number; name: string; slug: string; permalink: string; description?: string; short_description?: string; sku?: string;
  prices?: { price: string; regular_price: string; sale_price: string; currency_minor_unit: number };
  images?: { src: string }[];
  is_in_stock?: boolean;
};

const decode = (s = "") => s.replace(/<[^>]+>/g, "").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
  .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").trim();

async function pages<T>(base: string, path: string): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; page <= 30 && out.length < MAX_ITEMS; page++) {
    const sep = path.includes("?") ? "&" : "?";
    let r;
    try { r = await safeFetch(`${base}${path}${sep}per_page=100&page=${page}`, { accept: "application/json", maxBytes: 30 * 1024 * 1024, timeoutMs: 25000 }); }
    catch { break; }
    if (!r.res.ok) break;
    let batch: T[];
    try { batch = JSON.parse(r.buf.toString("utf-8")); } catch { break; }
    if (!Array.isArray(batch) || !batch.length) break;
    out.push(...batch);
    const total = Number(r.res.headers.get("x-wp-totalpages") ?? 0);
    if ((total && page >= total) || batch.length < 100) break;
  }
  return out;
}

export async function fetchWordPressSite(input: string): Promise<{ items: ImportItem[]; site: string }> {
  const site = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  const base = `${site.origin}${site.pathname.replace(/\/+$/, "")}/wp-json`;
  const probe = await safeFetch(`${base}/`, { accept: "application/json", timeoutMs: 15000 }).catch(() => null);
  if (!probe?.res.ok) throw new Error("Couldn't reach this site's WordPress API. Check the address, or use the WordPress export file or the Passive Coder Migration plugin instead.");

  const [wpPages, wpPosts, products] = await Promise.all([
    pages<WpRest>(base, "/wp/v2/pages?_embed=wp:featuredmedia"),
    pages<WpRest>(base, "/wp/v2/posts?_embed=wp:featuredmedia"),
    pages<WooStore>(base, "/wc/store/v1/products"),
  ]);
  const items: ImportItem[] = [];
  for (const [kind, list] of [["page", wpPages], ["post", wpPosts]] as const) {
    for (const p of list) {
      items.push({
        kind, title: decode(p.title?.rendered) || "Untitled", slug: p.slug || slugify(decode(p.title?.rendered)),
        html: p.content?.rendered ?? "", excerpt: decode(p.excerpt?.rendered) || undefined, date: p.date_gmt,
        featured_image: p._embedded?.["wp:featuredmedia"]?.[0]?.source_url,
        seo: { title: p.yoast_head_json?.title, description: p.yoast_head_json?.description },
        old_path: pathOf(p.link),
      });
    }
  }
  for (const p of products) {
    const unit = 10 ** (p.prices?.currency_minor_unit ?? 2);
    const price = p.prices ? Number(p.prices.price) / unit : null;
    const regular = p.prices ? Number(p.prices.regular_price) / unit : null;
    items.push({
      kind: "product", name: decode(p.name), slug: p.slug, html: p.description, short_description: decode(p.short_description),
      price, compare_price: regular && price != null && regular > price ? regular : null, sku: p.sku || undefined,
      stock: null, images: (p.images ?? []).map((i) => i.src), old_path: pathOf(p.permalink),
    });
  }
  return { items: items.slice(0, MAX_ITEMS), site: site.origin };
}

/* ── Apply one item ──────────────────────────────────────────────────── */
export type JobResults = { created: number; skipped: number; failed: number; media: number; errors: string[] };
export type JobCtx = {
  admin: SupabaseClient; tenantId: string; userId: string; source: string; sourceLabel?: string | null;
  /** Source image URL -> our URL, shared across the job so repeats download once. */
  mediaMap: Record<string, string>;
  results: JobResults;
};

const MAX_IMAGES_PER_ITEM = 25;

async function localizeImage(ctx: JobCtx, src: string): Promise<string> {
  if (!src || src.startsWith("data:")) return src;
  if (ctx.mediaMap[src]) return ctx.mediaMap[src];
  try {
    const { res, buf } = await safeFetch(src, { maxBytes: 20 * 1024 * 1024 });
    const type = (res.headers.get("content-type") ?? "").split(";")[0];
    if (!res.ok || !/^image\/(jpeg|png|webp|gif|avif)$/.test(type)) return src;
    let body: Buffer = buf, contentType = type, width: number | null = null, height: number | null = null;
    let name = (new URL(src).pathname.split("/").pop() || "image").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    if (/^image\/(jpeg|png|webp)$/.test(type)) {
      try {
        const out = await sharp(buf, { failOn: "none" }).rotate()
          .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
        width = out.info.width; height = out.info.height;
        if (out.data.length < buf.length) { body = out.data; contentType = "image/webp"; name = name.replace(/\.(jpe?g|png|webp)$/i, "") + ".webp"; }
      } catch { /* keep original */ }
    }
    const path = `imports/${ctx.tenantId}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${name}`;
    const { error } = await ctx.admin.storage.from("media").upload(path, body, { contentType, upsert: false });
    if (error) return src;
    const url = ctx.admin.storage.from("media").getPublicUrl(path).data.publicUrl;
    await ctx.admin.from("media").insert({
      name, original_name: name, url, mime_type: contentType, size: body.length, width, height,
      storage_path: path, tenant_id: ctx.tenantId, folder: "imported", uploaded_by: ctx.userId,
    });
    ctx.mediaMap[src] = url;
    ctx.results.media++;
    return url;
  } catch {
    return src;
  }
}

/** Strip WordPress-only markup and anything unsafe; keep the readable content. */
export function cleanHtml(html: string): string {
  const pre = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\[(\/?)(vc_|et_pb_|fusion_|av_|cs_|elementor|gallery|caption|embed|contact-form|wpforms|rev_slider)[^\]]*\]/gi, "")
    .replace(/\[\/?[a-z][\w-]*(?:\s[^\]]*)?\]/gi, "");
  return sanitizeHtml(pre, {
    allowedTags: ["h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "mark", "small", "sub", "sup",
      "a", "ul", "ol", "li", "blockquote", "pre", "code", "img", "figure", "figcaption", "table", "thead", "tbody", "tfoot", "tr", "th", "td",
      "iframe", "span", "div"],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"], img: ["src", "alt", "title", "width", "height"],
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder", "title"],
      th: ["colspan", "rowspan"], td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedIframeHostnames: ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "player.vimeo.com", "www.google.com", "maps.google.com"],
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener" }) },
    exclusiveFilter: (f) => (f.tag === "div" || f.tag === "span" || f.tag === "p") && !f.text.trim() && !f.mediaChildren?.length,
  }).replace(/(\s*\n){3,}/g, "\n\n").trim();
}

async function localizeHtml(ctx: JobCtx, html: string): Promise<string> {
  const srcs = [...new Set([...html.matchAll(/<img[^>]+src="([^"]+)"/gi)].map((m) => m[1]))].slice(0, MAX_IMAGES_PER_ITEM);
  let out = html;
  for (const s of srcs) {
    const local = await localizeImage(ctx, s.replace(/&amp;/g, "&"));
    if (local !== s) out = out.split(`"${s}"`).join(`"${local}"`);
  }
  return out;
}

async function uniqueSlug(ctx: JobCtx, table: "pages" | "products", slug: string): Promise<string> {
  const base = slugify(slug);
  // Page slugs are unique per site; product slugs are unique platform-wide.
  let q = ctx.admin.from(table).select("slug").like("slug", `${base}%`).limit(1000);
  if (table === "pages") q = q.eq("tenant_id", ctx.tenantId);
  const { data } = await q;
  const taken = new Set((data ?? []).map((r) => r.slug as string));
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
}

async function addRedirect(ctx: JobCtx, from: string | undefined, to: string) {
  if (!from || from === to || from === "/") return;
  await ctx.admin.from("page_redirects").delete().eq("tenant_id", ctx.tenantId).eq("from_path", from);
  await ctx.admin.from("page_redirects").insert({ tenant_id: ctx.tenantId, from_path: from, to_path: to });
}

export async function applyItem(ctx: JobCtx, item: ImportItem): Promise<void> {
  const imported = { source: ctx.source, from: ctx.sourceLabel ?? null, old_path: "old_path" in item ? item.old_path ?? null : null, at: new Date().toISOString() };

  if (item.kind === "page" || item.kind === "post") {
    const slug = await uniqueSlug(ctx, "pages", item.slug || item.title);
    let blocks: Block[];
    if (item.blocks) blocks = item.blocks;
    else {
      const html = await localizeHtml(ctx, cleanHtml(item.html ?? ""));
      const block = createBlock("text")!;
      block.data = { ...(block.data as object), content: html || "<p></p>", typography: {} } as typeof block.data;
      blocks = [block];
    }
    const featured = item.featured_image ? await localizeImage(ctx, item.featured_image) : null;
    const { error } = await ctx.admin.from("pages").insert({
      tenant_id: ctx.tenantId, title: item.title.slice(0, 300), slug, type: item.kind, status: "draft",
      blocks, excerpt: item.excerpt?.slice(0, 1000) ?? null, featured_image: featured,
      seo: { ...(item.seo?.title ? { title: item.seo.title } : {}), ...(item.seo?.description ? { description: item.seo.description } : {}) },
      settings: { show_header: true, show_footer: true, imported }, created_by: ctx.userId,
    });
    if (error) throw new Error(error.message);
    await addRedirect(ctx, item.old_path, `/${slug}`);
    ctx.results.created++;
    return;
  }

  if (item.kind === "product") {
    const slug = await uniqueSlug(ctx, "products", item.slug || item.name);
    const html = item.html ? await localizeHtml(ctx, cleanHtml(item.html)) : null;
    const images: string[] = [];
    for (const src of (item.images ?? []).slice(0, 12)) images.push(await localizeImage(ctx, src));
    const variants = (item.variants ?? []).slice(0, 100);
    const { data: created, error } = await ctx.admin.from("products").insert({
      tenant_id: ctx.tenantId, name: item.name.slice(0, 300), slug, status: "draft", type: variants.length ? "variable" : "simple",
      description: html, short_description: item.short_description?.slice(0, 1000) ?? null,
      price: item.price ?? 0, compare_price: item.compare_price ?? null, sku: item.sku ?? null,
      track_inventory: item.stock != null, stock_quantity: item.stock ?? 0, images,
      seo: { ...(item.seo ?? {}), imported },
    }).select("id").single();
    if (error) throw new Error(error.message);
    if (variants.length) {
      const rows = [];
      for (const [i, v] of variants.entries()) {
        rows.push({
          product_id: created.id, name: String(v.name || `Option ${i + 1}`).slice(0, 200), sku: v.sku || null,
          price: v.price ?? item.price ?? 0, compare_price: v.compare_price ?? null, stock_quantity: v.stock ?? 0,
          attributes: v.attributes ?? {}, image: v.image ? await localizeImage(ctx, v.image) : null, sort_order: i, is_active: true,
        });
      }
      const { error: vErr } = await ctx.admin.from("product_variants").insert(rows);
      if (vErr) ctx.results.errors.push(`${item.name}: variants not saved (${vErr.message})`);
    }
    await addRedirect(ctx, item.old_path, `/products/${slug}`);
    ctx.results.created++;
    return;
  }

  if (item.kind === "order") {
    // Order numbers are unique platform-wide, so imported ones carry a site prefix.
    const number = `WC-${ctx.tenantId.slice(0, 6)}-${String(item.number).replace(/[^\w-]/g, "").slice(0, 30)}`;
    const { data: exists } = await ctx.admin.from("orders").select("id").eq("order_number", number).maybeSingle();
    if (exists) { ctx.results.skipped++; return; }
    const statusMap: Record<string, string> = { "on-hold": "on_hold", "checkout-draft": "pending" };
    const status = statusMap[item.status ?? ""] ?? item.status ?? "completed";
    const allowedStatus = ["pending", "processing", "on_hold", "completed", "cancelled", "refunded", "failed"];
    const paid = ["processing", "completed"].includes(status);
    const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const { error } = await ctx.admin.from("orders").insert({
      tenant_id: ctx.tenantId, order_number: number,
      status: allowedStatus.includes(status) ? status : "completed",
      payment_status: item.payment_status ?? (status === "refunded" ? "refunded" : paid ? "paid" : "pending"),
      payment_method: item.payment_method?.slice(0, 60) ?? null,
      customer_name: item.customer?.name?.slice(0, 200) || "Customer",
      customer_email: item.customer?.email?.toLowerCase().slice(0, 254) || "imported@nomail.local",
      items: item.items.slice(0, 200).map((i) => ({ name: String(i.name).slice(0, 300), sku: i.sku ?? null, quantity: n(i.quantity), price: n(i.price) })),
      billing_address: item.billing_address ?? {}, shipping_address: item.shipping_address ?? {},
      subtotal: n(item.subtotal ?? item.total), discount: n(item.discount), shipping_cost: n(item.shipping), tax: n(item.tax), total: n(item.total),
      notes: item.notes?.slice(0, 2000) ?? null, fulfillment_type: "delivery",
      ...(item.date ? { created_at: new Date(item.date).toISOString() } : {}),
    });
    if (error) throw new Error(error.message);
    ctx.results.created++;
    return;
  }

  if (item.kind === "menu") {
    // Links to the old site become paths here, so the menu works after the move.
    const local = (u: string) => {
      try {
        const url = new URL(u);
        const from = ctx.sourceLabel ? new URL(ctx.sourceLabel).host : null;
        return from && url.host === from ? (url.pathname.replace(/\/+$/, "") || "/") + url.search + url.hash : u;
      } catch { return u; }
    };
    let id = 0;
    const items = item.items.slice(0, 50).map((i) => ({
      id: `m${++id}`, label: String(i.label).slice(0, 80), url: local(i.url),
      children: (i.children ?? []).slice(0, 30).map((c) => ({ id: `m${++id}`, label: String(c.label).slice(0, 80), url: local(c.url) })),
    }));
    const slug = slugify(item.name);
    const { data: existing } = await ctx.admin.from("nav_menus").select("id").eq("tenant_id", ctx.tenantId).eq("slug", `imported-${slug}`).maybeSingle();
    if (existing) { ctx.results.skipped++; return; }
    // Saved alongside the site's own menus (not switched on), so nothing changes until the owner picks it.
    const { error } = await ctx.admin.from("nav_menus").insert({
      tenant_id: ctx.tenantId, name: `${item.name} (imported)`.slice(0, 120), slug: `imported-${slug}`, items, location: "none",
    });
    if (error) throw new Error(error.message);
    ctx.results.created++;
    return;
  }

  if (item.kind !== "contact") return;
  // contact: skip duplicates by email (or phone when there's no email)
  const q = ctx.admin.from("contacts").select("id").eq("tenant_id", ctx.tenantId).limit(1);
  const { data: existing } = item.email ? await q.ilike("email", item.email) : await q.eq("phone", item.phone!);
  if (existing?.length) { ctx.results.skipped++; return; }
  const { error } = await ctx.admin.from("contacts").insert({
    tenant_id: ctx.tenantId, first_name: item.first_name?.slice(0, 120) ?? null, last_name: item.last_name?.slice(0, 120) ?? null,
    email: item.email?.slice(0, 254) ?? null, phone: item.phone?.slice(0, 40) ?? null, company: item.company?.slice(0, 200) ?? null,
    tags: item.tags ?? [], notes: item.notes ?? null, source: "import",
  });
  if (error) throw new Error(error.message);
  ctx.results.created++;
}
