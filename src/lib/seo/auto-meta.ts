/**
 * Free, no-AI SEO defaults so no site ships blank meta tags. Used at render
 * time only when the owner left a field empty; anything they typed wins.
 */

const clean = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

/** Trim to ~155 chars on a word boundary, the length search results show. */
export function clip(s: string, max = 155) {
  const t = clean(s);
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).replace(/[,;:.\s-]+$/, "")}…`;
}

const TEXT_KEYS = ["description", "subtitle", "content", "text", "body", "intro", "paragraph"];

/** The page's first real sentence-length copy, from its blocks in order. */
export function firstParagraph(blocks: unknown): string | null {
  let found: string | null = null;
  const walk = (v: unknown, depth: number) => {
    if (found || depth > 6 || !v || typeof v !== "object") return;
    if (Array.isArray(v)) { for (const x of v) walk(x, depth + 1); return; }
    const o = v as Record<string, unknown>;
    if (o.type === "navigation" || o.type === "footer") return;
    for (const k of TEXT_KEYS) {
      const s = o[k];
      if (typeof s === "string") {
        const t = clean(s);
        if (t.length >= 60) { found = clip(t); return; }
      }
    }
    for (const x of Object.values(o)) walk(x, depth + 1);
  };
  walk(blocks, 0);
  return found;
}

type Facts = { name: string; primaryService: string | null; areas: string[]; address: string | null; description: string | null; about: string | null; services: { name: string }[]; phone: string | null };

/** "Business | Main service in Area". */
export function autoSiteTitle(f: Facts): string {
  const area = f.areas[0] ?? null;
  if (f.primaryService) return clip(`${f.name} | ${f.primaryService}${area ? ` in ${area}` : ""}`, 65);
  return f.name;
}

export function autoSiteDescription(f: Facts): string | null {
  const own = f.description ?? f.about;
  if (own && clean(own).length >= 50) return clip(own);
  const svc = f.services.slice(0, 3).map((s) => s.name);
  if (!svc.length && !f.primaryService) return own ? clip(own) : null;
  const what = svc.length ? svc.join(", ") : f.primaryService;
  const where = f.areas.length ? ` in ${f.areas.slice(0, 2).join(" and ")}` : "";
  return clip(`${f.name} offers ${what}${where}.${f.phone ? ` Call ${f.phone}.` : ""}`);
}
