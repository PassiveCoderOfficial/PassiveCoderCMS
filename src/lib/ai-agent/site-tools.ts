import { normalizeFocus } from "@/lib/image-focus";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { addTrainingEntry, canTrain, deleteTraining, listTraining } from "@/lib/site-chat/training";
import { refreshSiteChatKnowledge } from "@/lib/site-chat/knowledge";
import type { McpTool, McpCtx } from "@/lib/mcp/tools";
import { findStockImages } from "@/lib/aicoder/images";
import { businessProfileFields as F } from "@/lib/business-profile/schema";
import { missingSocialColumn, socialLinksSchema } from "@/lib/social-links";
import { upsertSiteIdentity } from "@/lib/site/global-layout";
import { PM_TOOLS } from "@/modules/registry/projects/ai-tools";

/**
 * Whole-site tools for the AI (in-dashboard agent, AiCoder page and MCP):
 * find text anywhere, replace it everywhere at once (pages, drafts, header,
 * footer, business profile, site settings), find stock photos, put an image
 * into a section, edit the business profile. Every query is tenant-scoped.
 */

const CHROME_COLS = ["global_header", "global_footer", "global_prefooter"] as const;

/** Deep string replace; returns the new value and how many strings changed. */
function replaceDeep(v: unknown, find: string, repl: string, caseSensitive: boolean): { v: unknown; n: number } {
  if (typeof v === "string") {
    const re = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), caseSensitive ? "g" : "gi");
    const out = v.replace(re, repl);
    return { v: out, n: out === v ? 0 : 1 };
  }
  if (Array.isArray(v)) {
    let n = 0;
    const arr = v.map((x) => { const r = replaceDeep(x, find, repl, caseSensitive); n += r.n; return r.v; });
    return { v: arr, n };
  }
  if (v && typeof v === "object") {
    let n = 0;
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) {
      // Never rewrite ids, block types or image/file addresses.
      if (k === "id" || k === "type" || (typeof x === "string" && /^https?:\/\/\S+\.(png|jpe?g|webp|gif|svg|mp4|pdf)(\?|$)/i.test(x))) { o[k] = x; continue; }
      const r = replaceDeep(x, find, repl, caseSensitive); o[k] = r.v; n += r.n;
    }
    return { v: o, n };
  }
  return { v, n: 0 };
}

function snippets(v: unknown, q: string, out: string[], max = 3) {
  if (out.length >= max) return;
  if (typeof v === "string") {
    const i = v.toLowerCase().indexOf(q.toLowerCase());
    if (i >= 0) out.push(v.slice(Math.max(0, i - 40), i + q.length + 40).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
  } else if (Array.isArray(v)) v.forEach((x) => snippets(x, q, out, max));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => snippets(x, q, out, max));
}

export const SITE_TOOLS: McpTool[] = [
  {
    name: "search_site_text",
    title: "Search site text",
    description: "Find where some text appears anywhere on the site: every page (including unpublished edits), the site header, footer, pre-footer, business profile and site settings. Use before find_replace_text to see what will change.",
    schema: z.object({ query: z.string().min(2) }),
    write: false,
    run: async (args: never, ctx: McpCtx) => {
      const { query } = args as { query: string };
      const hits: { where: string; pageId?: string; snippets: string[] }[] = [];
      const { data: pages } = await ctx.supabase.from("pages").select("id, title, slug, blocks, draft_blocks").eq("tenant_id", ctx.tenantId).is("deleted_at", null);
      for (const p of pages ?? []) {
        const s: string[] = [];
        snippets([p.draft_blocks ?? p.blocks, p.title], query, s);
        if (s.length) hits.push({ where: `Page "${p.title}" (/${p.slug === "home" ? "" : p.slug})`, pageId: p.id as string, snippets: s });
      }
      const { data: idn } = await ctx.supabase.from("site_identity").select(CHROME_COLS.join(", ")).eq("tenant_id", ctx.tenantId).maybeSingle();
      for (const c of CHROME_COLS) {
        const s: string[] = []; snippets((idn as unknown as Record<string, unknown> | null)?.[c], query, s);
        if (s.length) hits.push({ where: c.replace("global_", "Site ").replace("prefooter", "pre-footer"), snippets: s });
      }
      const { data: prof } = await ctx.supabase.from("tenant_business_profiles").select("*").eq("tenant_id", ctx.tenantId).maybeSingle();
      const sp: string[] = []; snippets(prof, query, sp);
      if (sp.length) hits.push({ where: "Business profile", snippets: sp });
      return { query, matches: hits.length, hits };
    },
  },
  {
    name: "find_replace_text",
    title: "Find and replace text across the site",
    description: "Replace text everywhere at once: all pages (live and unpublished edits), header, footer, pre-footer, business profile and site settings. Use for site-wide changes like a new phone number, address, price or business name. Image and file addresses are never changed.",
    schema: z.object({ find: z.string().min(2), replace: z.string(), caseSensitive: z.boolean().default(false) }),
    write: true,
    run: async (args: never, ctx: McpCtx) => {
      const { find, replace, caseSensitive } = args as { find: string; replace: string; caseSensitive: boolean };
      const changed: string[] = [];
      const { data: pages } = await ctx.supabase.from("pages").select("id, title, blocks, draft_blocks").eq("tenant_id", ctx.tenantId).is("deleted_at", null);
      for (const p of pages ?? []) {
        const b = replaceDeep(p.blocks, find, replace, caseSensitive);
        const d = p.draft_blocks ? replaceDeep(p.draft_blocks, find, replace, caseSensitive) : { v: null, n: 0 };
        const t = replaceDeep(p.title, find, replace, caseSensitive);
        if (b.n + d.n + t.n === 0) continue;
        // blocks and draft_blocks written together (the draft trigger nulls a stale draft otherwise).
        await ctx.supabase.from("pages").update({ blocks: b.v, draft_blocks: d.v, title: t.v, updated_at: new Date().toISOString() }).eq("id", p.id).eq("tenant_id", ctx.tenantId);
        changed.push(`Page "${t.v}"`);
      }
      const { data: idn } = await ctx.supabase.from("site_identity").select(`id, ${CHROME_COLS.join(", ")}`).eq("tenant_id", ctx.tenantId).maybeSingle();
      if (idn) {
        const patch: Record<string, unknown> = {};
        for (const c of CHROME_COLS) {
          const r = replaceDeep((idn as unknown as Record<string, unknown>)[c], find, replace, caseSensitive);
          if (r.n) { patch[c] = r.v; changed.push(c.replace("global_", "Site ")); }
        }
        if (Object.keys(patch).length) await ctx.supabase.from("site_identity").update(patch).eq("tenant_id", ctx.tenantId);
      }
      const { data: prof } = await ctx.supabase.from("tenant_business_profiles").select("*").eq("tenant_id", ctx.tenantId).maybeSingle();
      if (prof) {
        const r = replaceDeep(prof, find, replace, caseSensitive);
        if (r.n) {
          const { tenant_id: _t, created_at: _c, ...rest } = r.v as Record<string, unknown>;
          void _t; void _c;
          await ctx.supabase.from("tenant_business_profiles").update({ ...rest, updated_at: new Date().toISOString() }).eq("tenant_id", ctx.tenantId);
          changed.push("Business profile");
        }
      }
      const { data: ss } = await ctx.supabase.from("site_settings").select("site_name, site_description, meta_title, meta_description").eq("tenant_id", ctx.tenantId).maybeSingle();
      if (ss) {
        const r = replaceDeep(ss, find, replace, caseSensitive);
        if (r.n) { await ctx.supabase.from("site_settings").update(r.v as Record<string, unknown>).eq("tenant_id", ctx.tenantId); changed.push("Site settings"); }
      }
      return { find, replace, changedIn: changed, count: changed.length };
    },
  },
  {
    name: "search_stock_photos",
    title: "Search stock photos",
    description: "Find free stock photos for a topic (e.g. 'air conditioner repair technician'). Returns image URLs to use with set_block_image.",
    schema: z.object({ query: z.string().min(2), count: z.number().int().min(1).max(6).default(4) }),
    write: false,
    run: async (args: never) => {
      const { query, count } = args as { query: string; count: number };
      const variants = [query, `${query} professional`, `${query} close up`, `${query} people`, `${query} modern`, `${query} detail`].slice(0, count);
      const found = await findStockImages(variants.map((q) => ({ query: q })));
      const seen = new Set<string>();
      return found.filter((f): f is NonNullable<typeof f> => !!f && f.relevant && !seen.has(f.url) && !!seen.add(f.url)).map((f) => ({ url: f.url, alt: f.alt, credit: f.credit }));
    },
  },
  {
    name: "set_block_image",
    title: "Put an image into a section",
    description: "Set an image in one section of a page: give the page id, the block id, and either imageUrl (from search_stock_photos or the media library) or a search query to pick a stock photo. field defaults to the section's main image. Saves as an unpublished edit on live pages. Optional focus sets the crop focal point of that image (stored as imageFocus for field imageUrl/image, else <field>Focus): a preset (center, top, bottom, left, right, top-left, top-right, bottom-left, bottom-right) or {focus:'custom', x:0-100, y:0-100}; null clears it. focus alone (no imageUrl/query) only changes the focal point. Section-wide focus for all photos in a block: save_page_blocks with style.imageFocus; background photo: background.focus.",
    schema: z.object({
      pageId: z.string().uuid(), blockId: z.string(),
      imageUrl: z.string().url().optional(), query: z.string().optional(),
      field: z.string().default("image"), alt: z.string().optional(),
      focus: z.union([z.string(), z.object({ focus: z.string(), x: z.number().min(0).max(100).optional(), y: z.number().min(0).max(100).optional() }), z.null()]).optional(),
    }),
    write: true,
    run: async (args: never, ctx: McpCtx) => {
      const a = args as { pageId: string; blockId: string; imageUrl?: string; query?: string; field: string; alt?: string; focus?: unknown };
      const focusKey = a.field === "imageUrl" || a.field === "image" ? "imageFocus" : `${a.field}Focus`;
      const focus = a.focus === undefined ? undefined : a.focus === null ? null : normalizeFocus(a.focus);
      if (a.focus != null && !focus) throw new Error("Unknown focus. Use a preset like 'top' or {focus:'custom', x, y}.");
      let url = a.imageUrl;
      let alt = a.alt;
      if (!url && a.query) {
        const [img] = await findStockImages([{ query: a.query }]);
        if (!img?.relevant) throw new Error(`No good photo found for "${a.query}". Try different words.`);
        url = img.url; alt = alt ?? img.alt;
      }
      if (!url && focus === undefined) throw new Error("Give imageUrl, a search query, or a focus.");
      const { data: page } = await ctx.supabase.from("pages").select("id, status, blocks, draft_blocks").eq("id", a.pageId).eq("tenant_id", ctx.tenantId).maybeSingle();
      if (!page) throw new Error("Page not found on this site");
      const live = page.status === "published";
      const blocks = JSON.parse(JSON.stringify((live ? page.draft_blocks ?? page.blocks : page.blocks) ?? [])) as { id: string; data?: Record<string, unknown> }[];
      const block = blocks.find((b) => b.id === a.blockId);
      if (!block) throw new Error("Section not found on this page. Use get_page_blocks to see section ids.");
      block.data = { ...(block.data ?? {}), ...(url ? { [a.field]: url } : {}), ...(alt && url ? { [`${a.field}Alt`]: alt } : {}) };
      if (focus === null) delete block.data[focusKey];
      else if (focus) block.data[focusKey] = focus;
      const patch = live ? { draft_blocks: blocks, blocks: page.blocks } : { blocks, draft_blocks: null };
      await ctx.supabase.from("pages").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", a.pageId).eq("tenant_id", ctx.tenantId);
      return { pageId: a.pageId, blockId: a.blockId, field: a.field, imageUrl: url ?? block.data[a.field], ...(focus !== undefined ? { [focusKey]: focus } : {}), savedAs: live ? "unpublished edit (publish the page to show it)" : "page content" };
    },
  },
  {
    name: "update_business_profile",
    title: "Update business profile",
    description: "Change business details used across the site, SEO and AI answers: business_name, tagline (shown with the site name), primary_service, about, phone, whatsapp, email, office_address, city, country_code (e.g. BD, AE), opening_hours (free text, e.g. Sat-Thu 9am-8pm), service_areas (list), years_operating, social_links (the site's social profiles, one list shown by the header top bar, footer and Social Links block when their \"Show social icons\" option is on: [{platform: facebook|instagram|tiktok|youtube|linkedin|twitter|whatsapp|snapchat, url, show?}], in display order; replaces the whole list). Same rules as the Business Profile screen.",
    // Same validation as the Business Profile screen (lib/business-profile/schema.ts).
    schema: z.object({
      business_name: F.business_name, primary_service: F.primary_service, about: F.about,
      phone: F.phone, whatsapp: F.whatsapp, email: F.email,
      office_address: F.office_address, service_areas: F.service_areas, years_operating: F.years_operating,
      city: F.city, country_code: F.country_code, opening_hours: F.opening_hours,
      tagline: z.string().max(200).nullish(),
      social_links: socialLinksSchema.optional(),
    }),
    write: true,
    run: async (args: never, ctx: McpCtx) => {
      const { tagline, ...rest } = args as Record<string, unknown>;
      const patch = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
      if (!Object.keys(patch).length && tagline === undefined) throw new Error("Nothing to change");
      if (Object.keys(patch).length) {
        const { error } = await ctx.supabase.from("tenant_business_profiles").upsert({ tenant_id: ctx.tenantId, ...patch, updated_at: new Date().toISOString() }, { onConflict: "tenant_id" });
        if (error) throw new Error(missingSocialColumn(error) ? "social_links needs database migration 165_social_links.sql, which is not applied yet. Nothing was saved." : error.message);
      }
      // The tagline lives with the site name in Site Identity (row created when
      // the site has none; an update alone saved nothing on those sites).
      if (tagline !== undefined) {
        const err = await upsertSiteIdentity(ctx.supabase, ctx.tenantId, { tagline });
        if (err) throw new Error(err);
      }
      return { updated: [...Object.keys(patch), ...(tagline !== undefined ? ["tagline"] : [])] };
    },
  },
  {
    name: "list_chat_training",
    title: "List what the website chat AI was taught",
    description: "List the Train AI entries of this site's visitor chat assistant: owner rules (do / don't, offers, tone), fixed Q&A answers and uploaded files. Check before adding, to avoid duplicates or contradictions.",
    schema: z.object({}),
    write: false,
    run: async (_args: never, ctx: McpCtx) => {
      const admin = await createAdminClient();
      const rows = await listTraining(admin, ctx.tenantId);
      return rows.map((r) => ({ id: r.id, kind: r.kind, title: r.title, content: r.kind === "file" ? `${r.content.slice(0, 200)}...` : r.content }));
    },
  },
  {
    name: "add_chat_training",
    title: "Teach the website chat AI",
    description: "Save a lasting instruction for the visitor chat assistant on the website (Train AI). kind 'rule' for behaviour, offers or policies (e.g. 'If a visitor asks for a discount, offer 10% when they book today'); kind 'qa' for a fixed answer (title = the question, content = the answer). Use when the owner states something visitors should be told or how the website chat should behave, not for one-off questions. Write it in clear third-person instruction form.",
    schema: z.object({ kind: z.enum(["rule", "qa"]), title: z.string().max(300).optional(), content: z.string().min(2).max(2000) }),
    write: true,
    run: async (args: never, ctx: McpCtx) => {
      const a = args as { kind: "rule" | "qa"; title?: string; content: string };
      const admin = await createAdminClient();
      if (!(await canTrain(admin, ctx.userId, ctx.tenantId))) throw new Error("Only the site owner or an admin can train the website chat AI.");
      const row = await addTrainingEntry(admin, { tenantId: ctx.tenantId, userId: ctx.userId, kind: a.kind, title: a.title, content: a.content, source: "assistant" });
      refreshSiteChatKnowledge(ctx.tenantId);
      return { saved: row.kind, id: row.id, note: "The website chat uses this from its next answer. See Chat > Train AI." };
    },
  },
  {
    name: "delete_chat_training",
    title: "Remove something the website chat AI was taught",
    description: "Delete one Train AI entry (id from list_chat_training).",
    schema: z.object({ id: z.string().uuid() }),
    write: true,
    run: async (args: never, ctx: McpCtx) => {
      const { id } = args as { id: string };
      const admin = await createAdminClient();
      if (!(await canTrain(admin, ctx.userId, ctx.tenantId))) throw new Error("Only the site owner or an admin can train the website chat AI.");
      await deleteTraining(admin, ctx.tenantId, id);
      refreshSiteChatKnowledge(ctx.tenantId);
      return { deleted: id };
    },
  },
  ...PM_TOOLS,
];
