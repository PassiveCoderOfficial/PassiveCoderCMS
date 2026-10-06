import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Block } from "@/types/cms";

/**
 * Turn on the header builder's "Booking button" (and, for new sites, the
 * footer's "Booking section") instead of writing /book links into a site's
 * menu. The options live on the navigation/footer blocks, so owners switch
 * them off or relabel them in the header builder like any other setting.
 *
 * A switch an owner has turned off (false) is respected; only unset ones are
 * turned on. Earlier versions wrote a hardcoded "Book" menu item / CTA; those
 * are converted to the option here.
 */
type NavData = {
  items?: { id?: string; label: string; url: string }[];
  showCta?: boolean; ctaLabel?: string; ctaUrl?: string;
  showBooking?: boolean;
};
type FooterData = { showBooking?: boolean };

function patch(blocks: Block[], footer: boolean): boolean {
  let changed = false;
  for (const b of blocks) {
    if (b.type === "navigation") {
      const d = (b.data ?? {}) as NavData;
      // Undo the hardcoded link from the first version of this helper.
      if (d.items?.some((i) => i.id === "nav-book")) { d.items = d.items.filter((i) => i.id !== "nav-book"); changed = true; }
      if (d.ctaUrl === "/book" && d.ctaLabel === "Book now") { d.showCta = false; d.ctaUrl = ""; d.ctaLabel = ""; changed = true; }
      if (d.showBooking === undefined) { d.showBooking = true; changed = true; }
      b.data = d as typeof b.data;
    } else if (footer && b.type === "footer") {
      const d = (b.data ?? {}) as FooterData;
      if (d.showBooking === undefined) { d.showBooking = true; b.data = d as typeof b.data; changed = true; }
    }
  }
  return changed;
}

/** Header booking button on (all sites); footer booking section too when `footer` is set (new sites). */
export async function ensureBookingChrome(admin: SupabaseClient, tenantId: string, opts: { footer?: boolean } = {}): Promise<number> {
  const footer = !!opts.footer;
  let updates = 0;
  const { data: si } = await admin.from("site_identity").select("global_header, global_footer").eq("tenant_id", tenantId).maybeSingle();
  for (const col of ["global_header", "global_footer"] as const) {
    const raw = si?.[col] as Block[] | Block | null | undefined;
    const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
    if (arr.length && patch(arr, footer)) {
      await admin.from("site_identity").update({ [col]: Array.isArray(raw) ? arr : arr[0] }).eq("tenant_id", tenantId);
      updates++;
    }
  }
  const { data: pages } = await admin.from("pages").select("id, blocks, draft_blocks").eq("tenant_id", tenantId).is("deleted_at", null);
  for (const p of pages ?? []) {
    const blocks = (p.blocks as Block[] | null) ?? [];
    const draft = p.draft_blocks as Block[] | null;
    const live = patch(blocks, footer);
    if (draft) {
      // A blocks-only write makes the pages trigger discard the unpublished
      // draft, so patch the draft too and write both together. If the draft
      // itself doesn't change, leave the page alone rather than lose it.
      if (patch(draft, footer)) { await admin.from("pages").update({ blocks, draft_blocks: draft }).eq("id", p.id); updates++; }
    } else if (live) {
      await admin.from("pages").update({ blocks }).eq("id", p.id); updates++;
    }
  }
  return updates;
}

/** New sites: booking button in the header and booking section in the footer. */
export const ensureBookingNav = (admin: SupabaseClient, tenantId: string) => ensureBookingChrome(admin, tenantId, { footer: true });
