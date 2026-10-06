import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Block } from "@/types/cms";

/**
 * Point a new site's header at its built-in booking page (/book): the header
 * button becomes "Book now", or, if the site already has a button, a "Book"
 * menu item is added. Applied to the shared header and to any per-page
 * navigation blocks. Idempotent: does nothing once /book is linked.
 */
type NavData = { items?: { id?: string; label: string; url: string }[]; showCta?: boolean; ctaLabel?: string; ctaUrl?: string };

function patchNav(blocks: Block[]): boolean {
  let changed = false;
  for (const b of blocks) {
    if (b.type !== "navigation") continue;
    const d = (b.data ?? {}) as NavData;
    const linked = d.ctaUrl === "/book" || (d.items ?? []).some((i) => i.url === "/book");
    if (linked) continue;
    if (!d.showCta || !d.ctaUrl || /^#?$/.test(d.ctaUrl) || /contact/i.test(d.ctaUrl)) {
      d.showCta = true; d.ctaLabel = "Book now"; d.ctaUrl = "/book";
    } else {
      d.items = [...(d.items ?? []), { id: "nav-book", label: "Book", url: "/book" }];
    }
    b.data = d as typeof b.data;
    changed = true;
  }
  return changed;
}

export async function ensureBookingNav(admin: SupabaseClient, tenantId: string): Promise<void> {
  const { data: si } = await admin.from("site_identity").select("global_header").eq("tenant_id", tenantId).maybeSingle();
  const gh = si?.global_header as Block[] | Block | null | undefined;
  const header = Array.isArray(gh) ? gh : gh ? [gh] : [];
  if (header.length && patchNav(header)) {
    await admin.from("site_identity").update({ global_header: Array.isArray(gh) ? header : header[0] }).eq("tenant_id", tenantId);
  }
  const { data: pages } = await admin.from("pages").select("id, blocks").eq("tenant_id", tenantId).is("deleted_at", null);
  for (const p of pages ?? []) {
    const blocks = (p.blocks as Block[] | null) ?? [];
    if (patchNav(blocks)) await admin.from("pages").update({ blocks }).eq("id", p.id);
  }
}
