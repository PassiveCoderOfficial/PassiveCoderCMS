/**
 * The plan's page limit is enforced by the enforce_page_limit() trigger on
 * `pages` (migration 117), which raises
 *   "Page limit reached (6 pages on this plan). Upgrade to add more."
 * with SQLSTATE P0001. Every path that creates pages (New Page, template
 * apply, AiCoder Full Site, imports) gets that raw Postgres text back, so this
 * is the one place that recognises it and turns it into a message an owner
 * can act on. Safe to import from client and server code.
 */

/** Where an owner changes plan. */
export const PAGE_LIMIT_UPGRADE_HREF = "/dashboard/subscription";

/** Machine-readable code API routes send alongside the friendly message. */
export const PAGE_LIMIT_CODE = "page_limit";

const RAW_RE = /page limit reached(?:\s*\((\d+)\s*pages?)?/i;
const FRIENDLY_RE = /Upgrade to Pro for unlimited pages/;

function messageOf(err: unknown): string {
  if (typeof err === "string") return err;
  // PostgrestError is a plain object, not an Error instance.
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string") return err.message;
  return "";
}

/** True for the trigger's error (raw or already mapped by friendlyPageLimitMessage). */
export function isPageLimitError(err: unknown): boolean {
  const msg = messageOf(err);
  return RAW_RE.test(msg) || FRIENDLY_RE.test(msg);
}

/** The owner-facing message. `limit` comes from the error text, or null when unknown. */
export function pageLimitMessage(limit: number | null): string {
  return limit != null && limit >= 0
    ? `Your plan includes ${limit} page${limit === 1 ? "" : "s"}. Upgrade to Pro for unlimited pages.`
    : "You've reached your plan's page limit. Upgrade to Pro for unlimited pages.";
}

/** Friendly message for a page-limit error, or null when `err` is something else. */
export function friendlyPageLimitMessage(err: unknown): string | null {
  const msg = messageOf(err);
  if (FRIENDLY_RE.test(msg)) return msg;
  const m = RAW_RE.exec(msg);
  if (!m) return null;
  return pageLimitMessage(m[1] ? Number(m[1]) : null);
}
