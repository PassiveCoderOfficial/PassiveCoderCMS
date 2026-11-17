"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBuilderStore } from "@/lib/store/builder";
import { visibleSocials } from "@/lib/social-links";
import type { SiteContact } from "@/components/site/site-contact-context";
import type { CreditBase } from "@/lib/site/footer-credit-shared";

/**
 * The site's contact details for block previews.
 *
 * Previews live in the side panels, outside the canvas's SiteContactProvider,
 * yet several layouts draw from it (Contact details, Visit + Map, footer
 * credit and socials, WhatsApp buttons). Same queries as BuilderCanvas,
 * fetched at most once per tenant per page load and shared by every preview.
 */
const cache = new Map<string, Promise<SiteContact>>();

export function loadPreviewSiteContact(tenantId: string): Promise<SiteContact> {
  let hit = cache.get(tenantId);
  if (!hit) {
    const sb = createClient();
    hit = Promise.all([
      sb.from("contact_details").select("phone, whatsapp, email, address").eq("tenant_id", tenantId)
        .order("is_primary", { ascending: false }).order("sort_order", { ascending: true }).limit(1).maybeSingle(),
      sb.from("tenant_business_profiles").select("social_links").eq("tenant_id", tenantId).maybeSingle()
        .then((r) => r, () => ({ data: null, error: true })),
      fetch("/api/site/footer-credit").then((r) => (r.ok ? r.json() : {}), () => ({})) as Promise<{ editable?: boolean; base?: CreditBase }>,
    ]).then(([{ data }, soc, credit]) => {
      const socials = soc.error ? [] : visibleSocials((soc.data as { social_links?: unknown } | null)?.social_links);
      return { ...((data as SiteContact | null) ?? {}), socials, creditEditable: !!credit.editable, creditBase: credit.base };
    }).catch(() => ({}));
    cache.set(tenantId, hit);
  }
  return hit;
}

const resolved = new Map<string, SiteContact>();

/** The builder tenant's contact details; `null` until loaded (or without a tenant). */
export function usePreviewSiteContact(): SiteContact | null {
  const tenantId = useBuilderStore((s) => s.tenantId);
  const [contact, setContact] = useState<SiteContact | null>(() => (tenantId ? resolved.get(tenantId) ?? null : null));
  useEffect(() => {
    if (!tenantId) return;
    if (resolved.has(tenantId)) { setContact(resolved.get(tenantId)!); return; }
    let live = true;
    loadPreviewSiteContact(tenantId).then((c) => {
      resolved.set(tenantId, c);
      if (live) setContact(c);
    });
    return () => { live = false; };
  }, [tenantId]);
  return contact;
}
