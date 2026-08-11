import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { apiTenantId } from "@/lib/tenant/api";

// Returns the current tenant id for client components. Resolved server-side so
// they get a reliable value (honours auth cookies, SA impersonation, and
// subdomain context) rather than depending on the browser auth session.
export async function GET() {
  // On a tenant subdomain the proxy has already resolved the tenant and
  // injected the header — trust it first. apiTenantId() requires a signed-in
  // user, so on a public storefront it returns null for every shopper, and
  // anything keyed off this (site currency above all) silently fell back to
  // platform defaults: a Bangladeshi store quoting prices in dollars.
  const subdomainTenantId = (await headers()).get("x-tenant-id");
  if (subdomainTenantId) return NextResponse.json({ tenantId: subdomainTenantId });

  const tenantId = await apiTenantId();
  return NextResponse.json({ tenantId });
}
