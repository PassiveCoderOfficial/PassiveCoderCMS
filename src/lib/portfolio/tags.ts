/**
 * Portfolio items have no columns for country / type / date, and adding them
 * would need a migration on every site. They live in the existing `tags`
 * array instead, as prefixed tags ("country:Albania", "type:Work visa",
 * "date:2026-06-01"). Plain tags without a prefix keep working as before.
 * The dashboard shows them as separate fields; visitors never see the
 * prefixes.
 */
export type PortfolioFields = { country?: string; kind?: string; date?: string };

const PREFIX = { country: "country:", kind: "type:", date: "date:" } as const;

export function splitPortfolioTags(tags: string[] | null | undefined): { fields: PortfolioFields; tags: string[] } {
  const fields: PortfolioFields = {};
  const rest: string[] = [];
  for (const raw of tags ?? []) {
    const t = String(raw ?? "").trim();
    if (!t) continue;
    const key = (Object.keys(PREFIX) as (keyof typeof PREFIX)[]).find((k) => t.toLowerCase().startsWith(PREFIX[k]));
    if (key && !fields[key]) fields[key] = t.slice(PREFIX[key].length).trim() || undefined;
    else if (!key) rest.push(t);
  }
  return { fields, tags: rest };
}

/** Normalised: trimmed, single spaces, duplicates (any case) dropped. */
export function joinPortfolioTags(fields: PortfolioFields, tags: string[]): string[] {
  const norm = (s: string | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (t: string) => { const k = t.toLowerCase(); if (!seen.has(k)) { seen.add(k); out.push(t); } };
  const country = norm(fields.country), kind = norm(fields.kind), date = norm(fields.date);
  if (country) push(PREFIX.country + country);
  if (kind) push(PREFIX.kind + kind);
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) push(PREFIX.date + date);
  // The fields are authoritative: a prefixed tag typed into the plain tags box is dropped.
  for (const t of tags) {
    const n = norm(t);
    if (n && !Object.values(PREFIX).some((p) => n.toLowerCase().startsWith(p))) push(n);
  }
  return out;
}

/** "Albania Work visa" from the fields, or a tidy file name as a fallback. */
export function portfolioTitle(fields: PortfolioFields, fileName?: string): string {
  const fromFields = [fields.country, fields.kind].map((s) => s?.trim()).filter(Boolean).join(" ");
  if (fromFields) return fromFields;
  const base = (fileName ?? "").replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return base || "Untitled";
}
