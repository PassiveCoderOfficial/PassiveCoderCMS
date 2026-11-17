import { NextResponse } from "next/server";
import { importAccess } from "@/lib/import/access";
import { reserveCredits, refundCredits, AiCreditsError, type CreditReservation } from "@/lib/ai/credits";
import { translateBlocks } from "@/lib/i18n-site/translate";
import { ownType } from "@/lib/collections/server";
import { isTranslatable, type CollectionEntry, type EntryText } from "@/lib/collections/types";

export const maxDuration = 120;

/**
 * AI-translate entries into one site language: title, excerpt, body and every
 * translatable field. Up to 20 entries per call = 10 AI Credits.
 * Existing hand-made translations are overwritten only for the fields sent.
 */
export async function POST(req: Request, { params }: { params: Promise<{ typeId: string }> }) {
  const a = await importAccess("write");
  if ("error" in a) return a.error;
  const { typeId } = await params;
  const type = await ownType(a.admin, a.tenantId, typeId);
  if (!type) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { entry_ids, lang } = (await req.json().catch(() => ({}))) as { entry_ids?: string[]; lang?: string };
  const ids = (entry_ids ?? []).slice(0, 20);
  if (!ids.length) return NextResponse.json({ error: "No entries" }, { status: 400 });

  const [{ data: rows }, { data: settings }] = await Promise.all([
    a.admin.from("collection_entries").select("*").in("id", ids).eq("type_id", typeId),
    a.admin.from("site_settings").select("language, site_languages").eq("tenant_id", a.tenantId).maybeSingle(),
  ]);
  if (!lang || !((settings?.site_languages as string[]) ?? []).includes(lang)) return NextResponse.json({ error: "Add this language in Settings > Languages first." }, { status: 400 });
  const main = ((settings?.language as string) || "en").split("-")[0];
  const fields = type.fields.filter(isTranslatable);
  const entries = (rows ?? []) as CollectionEntry[];

  // Shape the translator understands: strings under title/excerpt/body/text,
  // string lists under items. Field keys ride along under "key" (never translated).
  const payload = entries.map((e) => ({
    title: e.title, excerpt: e.excerpt, body: e.body,
    fields: fields.map((f) => {
      const v = e.data?.[f.key];
      return Array.isArray(v) ? { key: f.key, items: v.map(String) } : { key: f.key, text: v == null ? "" : String(v) };
    }),
  }));

  let reservation: CreditReservation;
  try { reservation = await reserveCredits(a.tenantId, "translate", { userId: a.userId }); }
  catch (e) { return NextResponse.json({ error: e instanceof AiCreditsError ? e.message : "AI is not available right now." }, { status: 402 }); }
  try {
    const out = await translateBlocks(payload, main, lang);
    await Promise.all(entries.map((e, i) => {
      const t = out[i];
      const data: Record<string, unknown> = {};
      for (const f of t.fields) {
        if ("items" in f && Array.isArray(f.items)) data[f.key] = f.items;
        else if ("text" in f && f.text) data[f.key] = f.text;
      }
      const next: EntryText = { ...(e.translations?.[lang] ?? {}), title: t.title, excerpt: t.excerpt, body: t.body, data: { ...(e.translations?.[lang]?.data ?? {}), ...data } };
      return a.admin.from("collection_entries").update({ translations: { ...(e.translations ?? {}), [lang]: next } }).eq("id", e.id);
    }));
    return NextResponse.json({ ok: true, translated: entries.length });
  } catch (e) {
    await refundCredits(reservation).catch(() => {});
    return NextResponse.json({ error: e instanceof Error ? e.message : "Translation failed" }, { status: 502 });
  }
}
