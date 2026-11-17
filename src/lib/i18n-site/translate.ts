import "server-only";
import { z } from "zod";
import { callModel } from "@/lib/aicoder/generate";

/**
 * AI translation of page blocks for native multi-language sites. Collects
 * every visitor-facing string in the block tree (titles, text, button labels,
 * FAQ answers, alt text...), sends them in batches, and writes the
 * translations back in place. URLs, colours, ids, icons and settings are
 * never touched.
 */

export const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", ar: "Arabic", bn: "Bangla", hi: "Hindi", ur: "Urdu", fr: "French", es: "Spanish", de: "German",
  it: "Italian", pt: "Portuguese", ru: "Russian", tr: "Turkish", fa: "Persian", zh: "Chinese", ja: "Japanese",
  ko: "Korean", ms: "Malay", id: "Indonesian", th: "Thai", vi: "Vietnamese", nl: "Dutch", tl: "Filipino",
  ta: "Tamil", ml: "Malayalam", ne: "Nepali", si: "Sinhala", sw: "Swahili", he: "Hebrew", pl: "Polish", uk: "Ukrainian",
};
export const languageName = (code: string) => LANGUAGE_NAMES[code.split("-")[0]] ?? code.toUpperCase();

// Keys whose string values are what visitors read.
const TEXT_KEYS = new Set([
  "title", "subtitle", "heading", "subheading", "description", "content", "text", "body", "label", "buttonText",
  "ctaText", "ctaLabel", "secondaryCtaText", "question", "answer", "name", "role", "quote", "caption", "alt",
  "tagline", "eyebrow", "badge", "placeholder", "submitText", "successMessage", "intro", "note", "features",
  "items", "bookingLabel", "bookingTitle", "bookingText", "copyright", "address", "hours", "excerpt", "summary",
  "price_label", "period", "unit", "cta", "highlight", "position", "author", "category", "linkText", "linkLabel", "submitLabel", "kicker", "message", "seo_title", "seo_description", "short_description",
]);
const SKIP_KEYS = new Set(["id", "type", "url", "href", "src", "image", "imageUrl", "icon", "color", "background", "style", "variant", "slug", "link", "email", "phone", "whatsapp", "embed", "video", "videoUrl", "logo", "logoUrl", "className", "anchor"]);
// Also every *Label / *Text / *Title / *Placeholder field (buttonLabel, categoryButtonLabel, bookingTitle...).
const isTextKey = (k: string) => TEXT_KEYS.has(k) || /^(?!show).+(Label|Text|Title|Placeholder)$/.test(k);
const looksLikeData = (s: string) => /^(https?:|\/|#|mailto:|tel:|data:|rgb|hsl|var\(|\d+(px|rem|em|%)?$)/i.test(s.trim()) || s.trim().length < 2;

type Ref = { obj: Record<string, unknown> | unknown[]; key: string | number };

function collect(node: unknown, refs: Ref[], parentKey = "", depth = 0) {
  if (depth > 12 || node == null) return;
  if (Array.isArray(node)) {
    node.forEach((v, i) => {
      if (typeof v === "string") { if (isTextKey(parentKey) && !looksLikeData(v)) refs.push({ obj: node, key: i }); }
      else collect(v, refs, parentKey, depth + 1);
    });
    return;
  }
  if (typeof node !== "object") return;
  const o = node as Record<string, unknown>;
  for (const [k, v] of Object.entries(o)) {
    if (SKIP_KEYS.has(k)) continue;
    if (typeof v === "string") { if (isTextKey(k) && !looksLikeData(v)) refs.push({ obj: o, key: k }); }
    else collect(v, refs, k, depth + 1);
  }
}

const batchSchema = z.object({ t: z.array(z.string()) });

/**
 * Staff scripts: translations written ahead of time (source -> target) instead
 * of a model call. Strings not in the map stay as they are and are recorded
 * in `missing`, so a dry run can dump every string that needs translating.
 */
let dictionary: { map: Record<string, string>; missing: Set<string> } | null = null;
export function useTranslationDictionary(map: Record<string, string> | null) {
  dictionary = map ? { map, missing: new Set() } : null;
  return dictionary?.missing ?? new Set<string>();
}

/** Returns a translated deep copy of the blocks. */
export async function translateBlocks<T>(blocks: T, from: string, to: string): Promise<T> {
  const copy = JSON.parse(JSON.stringify(blocks)) as T;
  const refs: Ref[] = [];
  collect(copy, refs);
  const get = (r: Ref) => (r.obj as Record<string | number, unknown>)[r.key] as string;
  const set = (r: Ref, v: string) => { (r.obj as Record<string | number, unknown>)[r.key] = v; };

  if (dictionary) {
    const d = dictionary;
    refs.forEach((r) => { const src = get(r), t = d.map[src.trim()]; if (t) set(r, t); else d.missing.add(src.trim()); });
    return copy;
  }

  const system = `You translate website text from ${languageName(from)} to ${languageName(to)} for a small business site. Natural, friendly, and clear, as a native speaker would write it. Keep any HTML tags, line breaks, numbers, prices, phone numbers, brand and product names exactly as they are. Return exactly one translation per input, in the same order.`;
  // Batches of 25 strings, 6 at a time: a whole page finishes in well under a minute.
  const chunks: Ref[][] = [];
  for (let i = 0; i < refs.length; i += 25) chunks.push(refs.slice(i, i + 25));
  const run = async (chunk: Ref[]) => {
    const input = chunk.map(get);
    const out = await callModel(batchSchema, system, `Translate each string in this JSON array:\n${JSON.stringify(input)}\n\nReply as {"t": [...]} with ${input.length} strings.`, 300 + input.join(" ").length);
    if (out.t.length !== input.length) throw new Error("The translation came back incomplete. Try again.");
    chunk.forEach((r, j) => set(r, out.t[j] || get(r)));
  };
  for (let i = 0; i < chunks.length; i += 6) await Promise.all(chunks.slice(i, i + 6).map(run));
  return copy;
}

/** Page path for a language version: home -> "ar", about -> "ar/about". */
export const translatedSlug = (baseSlug: string, lang: string) => (baseSlug === "home" ? lang : `${lang}/${baseSlug}`);
export const pathOf = (slug: string) => (slug === "home" ? "/" : `/${slug}`);

/**
 * Links inside a `lang` version of a page: internal page links go to that
 * language's version when it exists (slugSet), shop links to /<lang>/shop,
 * and the header's switch to `lang` (a menu item with `lang`, or the nav's
 * native language button) becomes the switch back to the main language.
 */
export function relinkForLanguage(v: unknown, lang: string, main: string, slugSet: Set<string>): unknown {
  const walk = (n: unknown): unknown => {
    if (Array.isArray(n)) return n.map(walk);
    if (!n || typeof n !== "object") return n;
    const item = n as { lang?: string; url?: string; languageSwitch?: string; languageSwitchMode?: string };
    if (item.lang?.toLowerCase() === lang && typeof item.url === "string") {
      return { ...item, lang: main, url: "/", label: languageName(main), ...("title" in item ? { title: languageName(main) } : {}) };
    }
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(n)) {
      if (typeof x === "string" && /^(href|url|link)$/i.test(k) && x.startsWith("/") && !x.startsWith("//")) {
        const [p, rest = ""] = x.split(/(?=[#?])/);
        if (p === "/shop") { o[k] = `/${lang}/shop${rest}`; continue; }
        const t = translatedSlug(p === "/" ? "home" : p.slice(1), lang);
        o[k] = slugSet.has(t) ? `${pathOf(t)}${rest}` : x;
      } else o[k] = walk(x);
    }
    if (item.languageSwitchMode === "native" && item.languageSwitch?.toLowerCase() === lang) {
      o.languageSwitch = main;
      o.languageSwitchUrl = "/";
    }
    return o;
  };
  return walk(v);
}
