import type { SupabaseClient } from "@supabase/supabase-js";
import { getVariantsForBlock, VARIANT_DATA_FIELD } from "./block-variants";
import type { BlockType } from "@/types/cms";

/**
 * Keeps new sites from being layout clones of recent ones.
 *
 * Found 2026-09-30: consecutive sites shipped with the same homepage skeleton
 * (fullscreen hero > stats > dark service cards > alternating features >
 * outlined icon cards > steps > testimonials > FAQ) with only colours and copy
 * changed, because every build path repeated itself — hand-written seed
 * scripts copied the previous one, the demo builder used one fixed sequence,
 * and AiCoder's planner picked the same variants for similar briefs.
 *
 * Every build path goes through here: it reads the homepage layouts of the
 * most recently built sites and steers the new one away from them.
 */

type Sectionish = { type: string; variant?: string | null };
const CHROME = new Set(["navigation", "footer", "header_logo", "header_nav", "header_cta", "header_booking", "header_cart", "header_account"]);

/** A homepage's layout as "type:variant" steps, chrome excluded. */
export function layoutSignature(blocks: unknown[]): string[] {
  return (blocks as Record<string, unknown>[])
    .filter((b) => b && typeof b.type === "string" && !CHROME.has(b.type as string))
    .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))
    .map((b) => {
      const type = b.type as string;
      const field = VARIANT_DATA_FIELD[type as BlockType];
      const data = (b.data ?? {}) as Record<string, unknown>;
      const variant = (b.templateVariant as string | undefined) ?? (field ? (data[field] as string | undefined) : undefined) ?? "-";
      return `${type}:${variant}`;
    });
}

function lcs(a: string[], b: string[]): number {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[a.length][b.length];
}

/**
 * 0 = nothing in common, 1 = identical. Half is "same section order"
 * (longest common run of section types), half is "same layouts" (overlap of
 * type:variant pairs), so two sites with the same order but different
 * layouts, or the same layouts shuffled, both score in the middle.
 */
export function layoutSimilarity(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const ta = a.map((s) => s.split(":")[0]);
  const tb = b.map((s) => s.split(":")[0]);
  const order = lcs(ta, tb) / Math.max(ta.length, tb.length);
  const A = new Set(a), B = new Set(b);
  const inter = [...A].filter((x) => B.has(x)).length;
  const jaccard = inter / new Set([...A, ...B]).size;
  return +(0.5 * order + 0.5 * jaccard).toFixed(3);
}

const NICHE = new Set(["menu-cards", "menu-pricing", "program-cards-dark", "membership-cards", "transformation-cards"]);

/** Above this a new homepage counts as a clone of an existing one. */
export const CLONE_THRESHOLD = 0.45;

/** Homepage layouts of the most recently created real (non-template) sites. */
export async function recentHomeLayouts(
  admin: SupabaseClient,
  limit = 8,
  excludeTenantId?: string,
): Promise<{ slug: string; signature: string[] }[]> {
  const { data } = await admin
    .from("tenants")
    .select("id, slug, created_at, pages!inner(slug, blocks, template_id)")
    .eq("pages.slug", "home")
    .is("pages.template_id", null)
    .order("created_at", { ascending: false })
    .limit(limit + 1);
  return ((data ?? []) as { id: string; slug: string; pages: { blocks: unknown }[] }[])
    .filter((t) => t.id !== excludeTenantId)
    .slice(0, limit)
    .map((t) => ({ slug: t.slug, signature: layoutSignature(Array.isArray(t.pages?.[0]?.blocks) ? (t.pages[0].blocks as unknown[]) : []) }))
    .filter((t) => t.signature.length > 0);
}

/** How often each type:variant appears across the recent layouts. */
function usage(recent: { signature: string[] }[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of recent) for (const s of new Set(r.signature)) m.set(s, (m.get(s) ?? 0) + 1);
  return m;
}

/**
 * Re-pick each section's variant so the page doesn't reuse layouts recent
 * sites already used. Keeps the planned variant when nobody recent used it;
 * otherwise takes the least-used variant of that block type (ties broken by
 * `seed` so two sites built the same day don't pick identically), never the
 * same variant twice on one page.
 */
export function diversifyVariants<T extends Sectionish>(sections: T[], recent: { signature: string[] }[], seed = ""): T[] {
  const used = usage(recent);
  const onPage = new Set<string>();
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return sections.map((s, i) => {
    // Industry-specific layouts (restaurant menus, gym memberships…) are only
    // kept when the planner chose them; never swapped in as an "alternative".
    const options = getVariantsForBlock(s.type as BlockType).map((v) => v.key).filter((k) => !NICHE.has(k) || k === s.variant);
    if (!options.length) return s;
    const planned = s.variant ?? "";
    const score = (k: string) => (used.get(`${s.type}:${k}`) ?? 0) * 10 + (onPage.has(`${s.type}:${k}`) ? 100 : 0);
    let pick = planned && options.includes(planned) ? planned : options[(h + i) % options.length];
    if (score(pick) > 0) {
      const rotated = options.map((_, j) => options[(h + i + j) % options.length]);
      pick = rotated.reduce((best, k) => (score(k) < score(best) ? k : best), rotated[0]);
    }
    onPage.add(`${s.type}:${pick}`);
    return { ...s, variant: pick };
  });
}

/** Prompt text telling a planner which recent layouts to steer away from. */
export function avoidanceBrief(recent: { slug: string; signature: string[] }[]): string {
  if (!recent.length) return "";
  return [
    "Recently built sites on this platform used these homepage layouts (section:variant, in order).",
    "Do NOT produce the same section order or reuse the same variants; this site must look clearly different:",
    ...recent.slice(0, 6).map((r) => `- ${r.signature.join(" > ")}`),
  ].join("\n");
}

/**
 * Same steering for already-built block arrays (demo builder, seed scripts):
 * re-pick overused variants (written back to templateVariant or the block's
 * variant data field) and rotate the middle sections by `seed`, keeping the
 * hero first and closing CTA/contact sections last.
 */
export function diversifyBlocks<B extends { type: string; order?: number; templateVariant?: string; data?: Record<string, unknown> }>(
  blocks: B[],
  recent: { signature: string[] }[],
  seed = "",
): B[] {
  const sorted = [...blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const isFixedStart = (b: B) => CHROME.has(b.type) || b.type === "hero";
  const isFixedEnd = (b: B) => CHROME.has(b.type) || ["cta", "contact", "newsletter", "faq"].includes(b.type);
  const start: B[] = [], end: B[] = [], middle: B[] = [];
  sorted.forEach((b, i) => {
    if (middle.length === 0 && end.length === 0 && isFixedStart(b)) start.push(b);
    else if (sorted.slice(i).every(isFixedEnd)) end.push(b);
    else middle.push(b);
  });
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const r = middle.length > 1 ? h % middle.length : 0;
  const ordered = [...start, ...middle.slice(r), ...middle.slice(0, r), ...end];

  const varied = diversifyVariants(
    ordered.map((b) => {
      const field = VARIANT_DATA_FIELD[b.type as BlockType];
      return { type: b.type, variant: b.templateVariant ?? (field ? (b.data?.[field] as string | undefined) : undefined) };
    }),
    recent,
    seed,
  );
  return ordered.map((b, i) => {
    const v = varied[i].variant;
    if (!v) return { ...b, order: i };
    const field = VARIANT_DATA_FIELD[b.type as BlockType];
    return field
      ? { ...b, order: i, data: { ...(b.data ?? {}), [field]: v } }
      : { ...b, order: i, templateVariant: v };
  });
}
