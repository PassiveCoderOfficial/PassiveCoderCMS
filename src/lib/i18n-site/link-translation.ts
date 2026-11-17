import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { LANGUAGE_NAMES, pathOf } from "@/lib/i18n-site/translate";

type Seo = { lang?: string; alternates?: Record<string, string>; [k: string]: unknown };

/**
 * Mark an existing page as the `lang` version of a main-language page, for
 * translations written by hand or by an outside AI (MCP) rather than by the
 * built-in AI translator (api/pages/translations). Same result as that route:
 * the page gets seo.lang (own localized chrome, lang/dir on the wrapper), the
 * base page and every sibling version share one hreflang `alternates` map,
 * and the language is added to the site's languages, which switches the
 * Google widget off (the two can't run together, see api/site-languages).
 *
 * The base page is `baseId`, or found from the slug convention
 * ("ar" -> home, "ar/about" -> about).
 */
export async function linkPageTranslation(admin: SupabaseClient, tenantId: string, pageId: string, rawLang: string, baseId?: string) {
  const lang = rawLang.trim().toLowerCase().split("-")[0];
  if (!(lang in LANGUAGE_NAMES)) throw new Error(`Unknown language code "${rawLang}".`);
  const { data: settings } = await admin.from("site_settings").select("language, site_languages").eq("tenant_id", tenantId).maybeSingle();
  const main = ((settings?.language as string) || "en").split("-")[0];
  if (lang === main) throw new Error(`"${lang}" is the site's main language; translations are for the other languages.`);

  const { data: page } = await admin.from("pages").select("id, slug, seo").eq("id", pageId).eq("tenant_id", tenantId).is("deleted_at", null).maybeSingle();
  if (!page) throw new Error("Page not found on this site.");
  const slug = page.slug as string;

  type Row = { id: string; slug: string; seo: unknown };
  let base = null as Row | null;
  if (baseId) {
    const { data } = await admin.from("pages").select("id, slug, seo").eq("id", baseId).eq("tenant_id", tenantId).is("deleted_at", null).maybeSingle();
    base = (data as Row | null) ?? null;
  } else {
    const baseSlug = slug === lang ? "home" : slug.startsWith(`${lang}/`) ? slug.slice(lang.length + 1) : null;
    if (baseSlug) {
      // Archived pages can share a slug with the live one (an old template's
      // "about"), which made maybeSingle() fail and hid the real base page.
      const { data } = await admin.from("pages").select("id, slug, seo").eq("slug", baseSlug).eq("tenant_id", tenantId).is("deleted_at", null).neq("status", "archived").maybeSingle();
      base = (data as Row | null) ?? null;
    }
  }
  if (!base) throw new Error(`Give translationOf (the main-language page id), or use the slug "${lang}/<page slug>" ("${lang}" for the home page).`);
  if (base.id === page.id) throw new Error("A page can't be a translation of itself.");
  const baseSeo = (base.seo ?? {}) as Seo;
  if (baseSeo.lang) throw new Error("translationOf must be a main-language page.");

  const alternates: Record<string, string> = { ...(baseSeo.alternates ?? {}), [main]: pathOf(base.slug), [lang]: pathOf(slug) };
  const ownSeo = (page.seo ?? {}) as Seo;
  const { error } = await admin.from("pages").update({ seo: { ...ownSeo, lang, alternates } }).eq("id", page.id).eq("tenant_id", tenantId);
  if (error) throw new Error(error.message);

  const siblingSlugs = Object.values(alternates).map((p) => (p === "/" ? "home" : p.slice(1)));
  const { data: sibs } = await admin.from("pages").select("id, seo").eq("tenant_id", tenantId).in("slug", siblingSlugs).is("deleted_at", null).neq("status", "archived");
  for (const s of sibs ?? []) {
    if (s.id === page.id) continue;
    await admin.from("pages").update({ seo: { ...((s.seo ?? {}) as Seo), alternates } }).eq("id", s.id).eq("tenant_id", tenantId);
  }

  const langs = [...new Set([...(((settings?.site_languages as string[]) ?? [])), lang])].filter((l) => l !== main);
  const { error: sErr } = await admin.from("site_settings").upsert(
    { tenant_id: tenantId, site_languages: langs, auto_translate_enabled: false },
    { onConflict: "tenant_id" },
  );
  if (sErr) throw new Error(sErr.message);
  return { lang, translationOf: base.id, alternates, siteLanguages: langs, googleTranslate: false };
}
