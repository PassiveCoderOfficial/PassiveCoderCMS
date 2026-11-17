import { NextResponse } from "next/server";
import { importAccess } from "@/lib/import/access";
import { LANGUAGE_NAMES } from "@/lib/i18n-site/translate";

/** The site's main language, its translated languages, and the Google widget switch. */
export async function GET() {
  const a = await importAccess("read");
  if ("error" in a) return a.error;
  const { data } = await a.admin.from("site_settings").select("language, site_languages, auto_translate_enabled").eq("tenant_id", a.tenantId).maybeSingle();
  const { count } = await a.admin.from("pages").select("id", { count: "exact", head: true }).eq("tenant_id", a.tenantId).not("seo->>lang", "is", null).is("deleted_at", null);
  return NextResponse.json({
    main: ((data?.language as string) || "en").split("-")[0],
    languages: (data?.site_languages as string[]) ?? [],
    googleWidget: !!data?.auto_translate_enabled,
    translatedPages: count ?? 0,
    available: LANGUAGE_NAMES,
  });
}

/**
 * Save languages. Native translations and the Google widget can't run side
 * by side (the widget would re-translate already translated pages), so
 * adding languages switches the widget off, and switching the widget on
 * requires no extra languages.
 */
export async function POST(req: Request) {
  const a = await importAccess("write");
  if ("error" in a) return a.error;
  const b = await req.json().catch(() => ({})) as { main?: string; languages?: string[]; googleWidget?: boolean };
  const main = (b.main || "en").split("-")[0];
  const languages = [...new Set((b.languages ?? []).map((l) => l.split("-")[0]).filter((l) => l && l !== main && l in LANGUAGE_NAMES))];
  if (b.googleWidget && languages.length) return NextResponse.json({ error: "Turn off your own languages first: the Google widget and native translations can't run together." }, { status: 400 });
  const { error } = await a.admin.from("site_settings").upsert({
    tenant_id: a.tenantId, language: main, site_languages: languages,
    auto_translate_enabled: languages.length ? false : !!b.googleWidget,
  }, { onConflict: "tenant_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, main, languages, googleWidget: languages.length ? false : !!b.googleWidget });
}
