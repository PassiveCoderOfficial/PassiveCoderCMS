import { headers } from "next/headers";
import { resolveSiteMetadata } from "@/lib/site/site-metadata";
import { ROOT_TENANT_SLUG } from "@/lib/flags";

export interface TenantChrome {
  name: string;
  faviconUrl: string;
  logoUrl?: string;
}

/**
 * The client's own branding for the sign-in and dashboard chrome when the
 * request comes in on a client host (their subdomain or custom domain).
 * Returns null on the platform's own hosts, where Passive Coder branding
 * stays. A client sharing "theirsite.passivecoder.com/dashboard" with an
 * editor should not show the editor someone else's brand in the tab, the
 * favicon or a link preview.
 */
export async function tenantChrome(): Promise<TenantChrome | null> {
  const h = await headers();
  const tenantId = h.get("x-tenant-id");
  const slug = h.get("x-tenant-slug");
  if (!tenantId || slug === ROOT_TENANT_SLUG) return null;
  const meta = await resolveSiteMetadata(tenantId).catch(() => null);
  if (!meta) return null;
  return { name: meta.siteName, faviconUrl: meta.faviconUrl, logoUrl: meta.logoUrl };
}
