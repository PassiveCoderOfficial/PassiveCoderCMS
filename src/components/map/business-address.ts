"use client";

import { createClient } from "@/lib/supabase/client";
import type { BusinessAddress } from "./map-location-input";

/**
 * The site's primary Contact details row (Dashboard > Contact): its address,
 * which blocks fall back to, and its saved map. Same row and order as
 * getSiteContact() on the public site.
 */
export async function loadSiteContactRow(tenantId: string | null | undefined): Promise<{ address: string | null; embedUrl: string | null } | null> {
  if (!tenantId) return null;
  const { data } = await createClient()
    .from("contact_details")
    .select("address, maps_embed_url")
    .eq("tenant_id", tenantId)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();
  const row = data as { address?: string | null; maps_embed_url?: string | null } | null;
  if (!row) return null;
  return { address: row.address?.trim() || null, embedUrl: row.maps_embed_url?.trim() || null };
}

/**
 * For "Use my business address" in block settings: the Contact details row
 * (address and saved map pin), else the Business profile's office address.
 */
export async function loadSiteBusinessAddress(tenantId: string | null | undefined): Promise<BusinessAddress> {
  const row = await loadSiteContactRow(tenantId).catch(() => null);
  let address = row?.address ?? null;
  const embedUrl = row?.embedUrl ?? null;
  if (!address) {
    try {
      const res = await fetch("/api/business-profile");
      const p = res.ok ? ((await res.json()) as { profile?: { office_address?: string | null } }).profile : null;
      address = p?.office_address?.trim() || null;
    } catch { /* no profile */ }
  }
  return address || embedUrl ? { address, embedUrl } : null;
}
