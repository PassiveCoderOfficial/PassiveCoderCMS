// Small display helpers shared across screens. Kept dependency-free —
// pulling in a date library for three functions isn't worth the bundle.

/** "just now" / "5m ago" / "3h ago" / "2d ago" / "12 Mar" / "12 Mar 2025" */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";

  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60_000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** Full timestamp for detail views where precision matters more than brevity. */
export function absoluteTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Best display name for a CRM contact, falling back through what exists. */
export function leadDisplayName(lead: {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
}): string {
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim();
  return name || lead.company || lead.email || lead.phone || "Unnamed lead";
}

/** Two-letter avatar initials from whatever identity fields exist. */
export function initials(lead: {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  company?: string | null;
}): string {
  const first = lead.first_name?.trim();
  const last = lead.last_name?.trim();
  if (first || last) {
    return ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase() || "?";
  }
  const fallback = (lead.company || lead.email || "").trim();
  return fallback ? fallback.slice(0, 2).toUpperCase() : "?";
}

/** Title-cases a slug/enum for display: "pending_dns" → "Pending dns". */
export function humanize(value: string | null | undefined): string {
  if (!value) return "—";
  const s = value.replace(/[_-]+/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
