import "server-only";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { callModel } from "@/lib/aicoder/generate";
import { reserveGeneration, refundGeneration } from "@/lib/aicoder/quota";
import { getSiteFacts } from "@/lib/seo/site-facts";
import { firstParagraph } from "@/lib/seo/auto-meta";

/**
 * "Generate with AI" for SEO: the site's default title/description plus a
 * title/description for every published page, written from the business
 * profile and each page's real copy. The first run on a site is free; every
 * later run uses one AiCoder generation.
 */

export type SeoProposal = {
  site: { title: string; description: string; current: { title: string | null; description: string | null } };
  pages: { id: string; path: string; name: string; title: string; description: string; current: { title: string | null; description: string | null } }[];
  charged: boolean;
};

const schema = z.object({
  site: z.object({ title: z.string(), description: z.string() }),
  pages: z.array(z.object({ id: z.string(), title: z.string(), description: z.string() })),
});

const textOf = (blocks: unknown) => {
  const parts: string[] = [];
  const walk = (v: unknown, d: number) => {
    if (d > 6 || !v || parts.join(" ").length > 900) return;
    if (typeof v === "string") { const t = v.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); if (t.length > 25 && !/^https?:|^#|^\//.test(t)) parts.push(t); return; }
    if (Array.isArray(v)) { v.forEach((x) => walk(x, d + 1)); return; }
    if (typeof v === "object") {
      const o = v as Record<string, unknown>;
      if (o.type === "navigation" || o.type === "footer") return;
      Object.values(o).forEach((x) => walk(x, d + 1));
    }
  };
  walk(blocks, 0);
  return parts.join(" | ").slice(0, 900);
};

export async function seoFreeRunAvailable(admin: SupabaseClient, tenantId: string) {
  const { data } = await admin.from("tenants").select("ai_seo_free_used_at").eq("id", tenantId).maybeSingle();
  return !data?.ai_seo_free_used_at;
}

/** Writes proposals; charges a generation unless this site's free run is unused (or `free` is forced for automatic runs). */
export async function proposeSeo(admin: SupabaseClient, tenantId: string, userId: string | null, opts: { free?: boolean } = {}): Promise<SeoProposal> {
  const facts = await getSiteFacts(tenantId);
  if (!facts) throw new Error("Site not found");
  const [{ data: settings }, { data: pages }] = await Promise.all([
    admin.from("site_settings").select("meta_title, meta_description").eq("tenant_id", tenantId).maybeSingle(),
    admin.from("pages").select("id, title, slug, seo, blocks").eq("tenant_id", tenantId).eq("status", "published")
      .is("deleted_at", null).order("order_index").limit(30),
  ]);

  const firstFree = await seoFreeRunAvailable(admin, tenantId);
  const charge = !opts.free && !firstFree;
  const source = charge ? await reserveGeneration(tenantId, "seo", userId) : null;

  const list = (pages ?? []).filter((p) => !(p.seo as { no_index?: boolean } | null)?.no_index);
  const system = "You write search-engine titles and meta descriptions for small-business websites. Titles: 45-60 characters, put the main keyword first, end with the business name only on the homepage. Descriptions: 140-155 characters, concrete (services, place, a reason to click), plain language, no hype words, no emojis, no quotation marks. Write in the same language as the page content. Never invent prices, awards, years or claims that aren't in the input.";
  const user = [
    `Business: ${facts.name}`,
    facts.primaryService && `Main service: ${facts.primaryService}`,
    facts.services.length && `Services: ${facts.services.slice(0, 12).map((s) => s.name).join(", ")}`,
    (facts.areas.length || facts.address) && `Location / areas: ${[facts.address, ...facts.areas].filter(Boolean).join(", ")}`,
    (facts.description || facts.about) && `About: ${(facts.description ?? facts.about ?? "").slice(0, 600)}`,
    "",
    "Write the site default (used for the homepage) and one entry per page below, keeping each page's id.",
    ...list.map((p) => `- id=${p.id} path=/${p.slug === "home" ? "" : p.slug} name="${p.title}" content: ${textOf(p.blocks) || firstParagraph(p.blocks) || "(little text)"}`),
  ].filter(Boolean).join("\n");

  let out: z.infer<typeof schema>;
  try {
    out = await callModel(schema, system, user, 400 + list.length * 120);
  } catch (e) {
    if (source) await refundGeneration(tenantId, source);
    throw e;
  }
  if (firstFree && !opts.free) await admin.from("tenants").update({ ai_seo_free_used_at: new Date().toISOString() }).eq("id", tenantId);

  const byId = new Map(out.pages.map((p) => [p.id, p]));
  return {
    charged: charge,
    site: {
      title: out.site.title.trim().slice(0, 70), description: out.site.description.trim().slice(0, 170),
      current: { title: (settings?.meta_title as string | null) ?? null, description: (settings?.meta_description as string | null) ?? null },
    },
    pages: list.filter((p) => byId.has(p.id)).map((p) => {
      const g = byId.get(p.id)!;
      const seo = (p.seo ?? {}) as { title?: string; description?: string };
      return {
        id: p.id, path: p.slug === "home" ? "/" : `/${p.slug}`, name: p.title as string,
        title: g.title.trim().slice(0, 70), description: g.description.trim().slice(0, 170),
        current: { title: seo.title?.trim() || null, description: seo.description?.trim() || null },
      };
    }),
  };
}

/** Saves chosen values. Merges into pages.seo so og_image, canonical, no_index etc. survive. */
export async function applySeo(admin: SupabaseClient, tenantId: string, input: {
  site?: { title?: string; description?: string } | null;
  pages?: { id: string; title?: string; description?: string }[];
}) {
  let n = 0;
  if (input.site && (input.site.title?.trim() || input.site.description?.trim())) {
    await admin.from("site_settings").upsert({
      tenant_id: tenantId,
      ...(input.site.title?.trim() ? { meta_title: input.site.title.trim().slice(0, 70) } : {}),
      ...(input.site.description?.trim() ? { meta_description: input.site.description.trim().slice(0, 170) } : {}),
    }, { onConflict: "tenant_id" });
    n++;
  }
  const ids = (input.pages ?? []).map((p) => p.id);
  if (ids.length) {
    const { data: rows } = await admin.from("pages").select("id, seo").eq("tenant_id", tenantId).in("id", ids);
    for (const r of rows ?? []) {
      const p = input.pages!.find((x) => x.id === r.id)!;
      const seo = {
        ...((r.seo ?? {}) as Record<string, unknown>),
        ...(p.title?.trim() ? { title: p.title.trim().slice(0, 70) } : {}),
        ...(p.description?.trim() ? { description: p.description.trim().slice(0, 170) } : {}),
      };
      await admin.from("pages").update({ seo }).eq("id", r.id).eq("tenant_id", tenantId);
      n++;
    }
  }
  return n;
}

/** After an AiCoder build or import: fill only empty fields, at no charge. */
export async function autoFillSeo(admin: SupabaseClient, tenantId: string) {
  const p = await proposeSeo(admin, tenantId, null, { free: true });
  return applySeo(admin, tenantId, {
    site: { title: p.site.current.title ? undefined : p.site.title, description: p.site.current.description ? undefined : p.site.description },
    pages: p.pages.map((x) => ({ id: x.id, title: x.current.title ? undefined : x.title, description: x.current.description ? undefined : x.description })),
  });
}
