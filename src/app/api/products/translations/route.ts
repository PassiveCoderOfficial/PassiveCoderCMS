import { NextResponse } from "next/server";
import { importAccess } from "@/lib/import/access";
import { reserveCredits, refundCredits, AiCreditsError, type CreditReservation } from "@/lib/ai/credits";
import { languageName, translateBlocks } from "@/lib/i18n-site/translate";

export const maxDuration = 120;

const FIELDS = ["name", "short_description", "description", "seo_title", "seo_description"] as const;

/** Every product with the languages it already has (Settings > Languages, Products tab). */
export async function GET() {
  const a = await importAccess("read");
  if ("error" in a) return a.error;
  const [{ data: settings }, { data: products }] = await Promise.all([
    a.admin.from("site_settings").select("language, site_languages").eq("tenant_id", a.tenantId).maybeSingle(),
    a.admin.from("products").select("id, name, slug, status, translations").eq("tenant_id", a.tenantId).order("name").limit(1000),
  ]);
  const main = ((settings?.language as string) || "en").split("-")[0];
  const langs = ((settings?.site_languages as string[]) ?? []).filter((l) => l !== main);
  return NextResponse.json({
    main, languages: langs.map((l) => ({ code: l, name: languageName(l) })),
    products: (products ?? []).map((p) => ({
      id: p.id, title: p.name, slug: p.slug, status: p.status,
      versions: Object.fromEntries(langs.map((l) => [l, (p.translations as Record<string, unknown> | null)?.[l] ? "published" : null])),
    })),
  });
}

/** Translate one product into one language with AI (10 AI Credits). */
export async function POST(req: Request) {
  const a = await importAccess("write");
  if ("error" in a) return a.error;
  const { product_id, lang } = await req.json().catch(() => ({})) as { product_id?: string; lang?: string };
  const [{ data: p }, { data: settings }] = await Promise.all([
    a.admin.from("products").select("id, name, slug, short_description, description, seo, translations").eq("id", product_id ?? "").eq("tenant_id", a.tenantId).maybeSingle(),
    a.admin.from("site_settings").select("language, site_languages").eq("tenant_id", a.tenantId).maybeSingle(),
  ]);
  if (!p) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (!lang || !((settings?.site_languages as string[]) ?? []).includes(lang)) return NextResponse.json({ error: "Add this language in Settings > Languages first." }, { status: 400 });
  const main = ((settings?.language as string) || "en").split("-")[0];
  const seo = (p.seo ?? {}) as { title?: string; description?: string };

  let reservation: CreditReservation;
  try { reservation = await reserveCredits(a.tenantId, "translate", { userId: a.userId }); }
  catch (e) { return NextResponse.json({ error: e instanceof AiCreditsError ? e.message : "AI is not available right now." }, { status: 402 }); }
  try {
    const [t] = await translateBlocks([{
      name: p.name ?? "", short_description: p.short_description ?? "", description: p.description ?? "",
      seo_title: seo.title ?? "", seo_description: seo.description ?? "",
    }], main, lang);
    const clean = Object.fromEntries(FIELDS.map((f) => [f, String((t as Record<string, string>)[f] ?? "").trim()]).filter(([, v]) => v));
    const translations = { ...((p.translations ?? {}) as Record<string, unknown>), [lang]: clean };
    const { error } = await a.admin.from("products").update({ translations }).eq("id", p.id).eq("tenant_id", a.tenantId);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, path: `/${lang}/products/${p.slug}` });
  } catch (e) {
    await refundCredits(reservation).catch(() => {});
    return NextResponse.json({ error: e instanceof Error ? e.message : "Translation failed" }, { status: 502 });
  }
}
