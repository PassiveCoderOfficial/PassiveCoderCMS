import { layoutLockedFor, LAYOUT_LOCK_MESSAGE } from "@/lib/tenant/layout-lock";
import { NextResponse } from "next/server";
import { importAccess } from "@/lib/import/access";
import { fetchGlobalLayout } from "@/lib/site/global-blocks";
import { reserveCredits, refundCredits, AiCreditsError, type CreditReservation } from "@/lib/ai/credits";
import { languageName, pathOf, relinkForLanguage, translateBlocks, translatedSlug } from "@/lib/i18n-site/translate";
import type { Block } from "@/types/cms";

export const maxDuration = 300;

type Seo = { lang?: string; alternates?: Record<string, string>; title?: string; description?: string; [k: string]: unknown };

/** The site's languages and which language versions of this page exist. */
export async function GET(req: Request) {
  const a = await importAccess("read");
  if ("error" in a) return a.error;
  const pageId = new URL(req.url).searchParams.get("page_id");
  // ?all=1: every main-language page with the state of each translation (Settings > Languages).
  if (!pageId) {
    const [{ data: settings }, { data: pages }] = await Promise.all([
      a.admin.from("site_settings").select("language, site_languages").eq("tenant_id", a.tenantId).maybeSingle(),
      a.admin.from("pages").select("id, slug, title, status, seo, type").eq("tenant_id", a.tenantId).is("deleted_at", null).order("title"),
    ]);
    const main = ((settings?.language as string) || "en").split("-")[0];
    const langs = ((settings?.site_languages as string[]) ?? []).filter((l) => l !== main);
    const all = pages ?? [];
    const bySlug = new Map(all.map((p) => [p.slug as string, p]));
    const base = all.filter((p) => !((p.seo ?? {}) as Seo).lang && p.slug !== "product-template");
    return NextResponse.json({
      main, languages: langs.map((l) => ({ code: l, name: languageName(l) })),
      pages: base.map((p) => ({
        id: p.id, title: p.title, slug: p.slug, status: p.status, type: p.type,
        versions: Object.fromEntries(langs.map((l) => { const v = bySlug.get(translatedSlug(p.slug as string, l)); return [l, v ? (v.status as string) : null]; })),
      })),
    });
  }
  const [{ data: page }, { data: settings }] = await Promise.all([
    a.admin.from("pages").select("id, slug, title, seo").eq("id", pageId ?? "").eq("tenant_id", a.tenantId).maybeSingle(),
    a.admin.from("site_settings").select("language, site_languages").eq("tenant_id", a.tenantId).maybeSingle(),
  ]);
  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });
  const main = ((settings?.language as string) || "en").split("-")[0];
  const langs = ((settings?.site_languages as string[]) ?? []).filter((l) => l !== main);
  const seo = (page.seo ?? {}) as Seo;
  if (seo.lang) return NextResponse.json({ isTranslation: true, lang: seo.lang, main, languages: langs });
  const slugs = langs.map((l) => translatedSlug(page.slug as string, l));
  const { data: versions } = slugs.length
    ? await a.admin.from("pages").select("id, slug, status, updated_at").eq("tenant_id", a.tenantId).in("slug", slugs).is("deleted_at", null)
    : { data: [] };
  return NextResponse.json({
    main, languages: langs,
    versions: langs.map((l) => {
      const v = (versions ?? []).find((x) => x.slug === translatedSlug(page.slug as string, l));
      return { lang: l, name: languageName(l), id: v?.id ?? null, status: v?.status ?? null, path: pathOf(translatedSlug(page.slug as string, l)) };
    }),
  });
}

/**
 * Create (or refresh) one language version of a page.
 * mode "ai": translated by AI (10 AI Credits); "copy": a copy to translate by hand.
 * The version carries its own translated header and footer, links pointing at
 * other translated pages, and both pages get hreflang alternates.
 */
export async function POST(req: Request) {
  const a = await importAccess("write");
  if ("error" in a) return a.error;
  if (await layoutLockedFor(a.admin, a.userId, a.tenantId)) return NextResponse.json({ error: LAYOUT_LOCK_MESSAGE }, { status: 403 });
  const { page_id, lang, mode } = await req.json().catch(() => ({})) as { page_id?: string; lang?: string; mode?: "ai" | "copy" };
  const [{ data: base }, { data: settings }] = await Promise.all([
    a.admin.from("pages").select("id, slug, title, type, status, seo, blocks, draft_blocks, excerpt, featured_image, settings").eq("id", page_id ?? "").eq("tenant_id", a.tenantId).maybeSingle(),
    a.admin.from("site_settings").select("language, site_languages").eq("tenant_id", a.tenantId).maybeSingle(),
  ]);
  if (!base) return NextResponse.json({ error: "Page not found" }, { status: 404 });
  const main = ((settings?.language as string) || "en").split("-")[0];
  if (!lang || !((settings?.site_languages as string[]) ?? []).includes(lang)) return NextResponse.json({ error: "Add this language in Settings > Languages first." }, { status: 400 });
  const baseSeo = (base.seo ?? {}) as Seo;
  if (baseSeo.lang) return NextResponse.json({ error: "Open the main-language page to create translations." }, { status: 400 });

  // The page plus the site's header/footer, since a translated page shows its own.
  const { header, footer, prefooter } = await fetchGlobalLayout(a.tenantId);
  const own = ((base.draft_blocks ?? base.blocks) as Block[] | null) ?? [];
  let blocks: Block[] = [...header, ...own, ...prefooter, ...footer].map((b, i) => ({ ...b, id: `${b.id}-${lang}`, order: i }));
  let title = base.title as string;
  let seoTitle = baseSeo.title ?? "";
  let seoDesc = baseSeo.description ?? "";

  let reservation: CreditReservation | null = null;
  if (mode === "ai") {
    try { reservation = await reserveCredits(a.tenantId, "translate", { userId: a.userId }); }
    catch (e) { return NextResponse.json({ error: e instanceof AiCreditsError ? e.message : "AI is not available right now." }, { status: 402 }); }
    try {
      const [tb, meta] = await Promise.all([
        translateBlocks(blocks, main, lang),
        translateBlocks([{ title, seo_title: seoTitle, description: seoDesc }], main, lang),
      ]);
      blocks = tb;
      title = meta[0].title || title; seoTitle = (meta[0] as { seo_title?: string }).seo_title ?? seoTitle; seoDesc = meta[0].description ?? seoDesc;
    } catch (e) {
      if (reservation) await refundCredits(reservation);
      return NextResponse.json({ error: e instanceof Error ? e.message : "Translation failed" }, { status: 502 });
    }
  }

  // Internal links go to the same language when that version exists.
  const { data: allPages } = await a.admin.from("pages").select("slug").eq("tenant_id", a.tenantId).is("deleted_at", null);
  const slugSet = new Set((allPages ?? []).map((p) => p.slug as string));
  const target = translatedSlug(base.slug as string, lang);
  slugSet.add(target);
  blocks = relinkForLanguage(blocks, lang, main, slugSet) as Block[];

  // hreflang on the base and every version, in all languages that exist.
  const alternates: Record<string, string> = { ...(baseSeo.alternates ?? {}), [main]: pathOf(base.slug as string), [lang]: pathOf(target) };
  const seo: Seo = { ...baseSeo, lang, alternates, ...(seoTitle ? { title: seoTitle } : {}), ...(seoDesc ? { description: seoDesc } : {}) };
  const status = mode === "ai" ? base.status : "draft";

  const { data: existing } = await a.admin.from("pages").select("id").eq("tenant_id", a.tenantId).eq("slug", target).is("deleted_at", null).maybeSingle();
  let id = existing?.id as string | undefined;
  if (id) {
    // Write blocks and draft together (the draft-rev trigger nulls a stale draft otherwise).
    const { error } = await a.admin.from("pages").update({ title, blocks, draft_blocks: null, seo, status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { data, error } = await a.admin.from("pages").insert({
      tenant_id: a.tenantId, title, slug: target, type: base.type ?? "page", status, blocks, seo,
      excerpt: base.excerpt, featured_image: base.featured_image, settings: base.settings ?? {}, created_by: a.userId,
    }).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    id = data.id as string;
  }
  // Base page and the other versions learn about this language.
  const siblings = Object.values(alternates).map((p) => (p === "/" ? "home" : p.slice(1)));
  const { data: sibRows } = await a.admin.from("pages").select("id, seo").eq("tenant_id", a.tenantId).in("slug", siblings).is("deleted_at", null);
  for (const s of sibRows ?? []) {
    if (s.id === id) continue;
    await a.admin.from("pages").update({ seo: { ...((s.seo ?? {}) as Seo), alternates } }).eq("id", s.id);
  }
  return NextResponse.json({ id, slug: target, path: pathOf(target), status, charged: !!reservation?.credits });
}
