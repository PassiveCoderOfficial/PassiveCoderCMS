import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getApiCaller } from "@/lib/auth/api-caller";

// Returns the current tenant id for client components. Resolved server-side so
// they get a reliable value (honours auth cookies, SA impersonation, and
// subdomain context) rather than depending on the browser auth session.
export async function GET() {
  // On a tenant subdomain the proxy has already resolved the tenant and
  // injected the header — trust it first. getApiCaller() requires a signed-in
  // user, so on a public storefront it returns null for every shopper, and
  // anything keyed off this (site currency above all) silently fell back to
  // platform defaults: a Bangladeshi store quoting prices in dollars.
  // Several dashboard widgets ask for this on every page; let the browser
  // reuse the answer for half a minute (private: never shared between users).
  const cache = { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" } };
  const subdomainTenantId = (await headers()).get("x-tenant-id");
  if (subdomainTenantId) return NextResponse.json({ tenantId: subdomainTenantId }, cache);

  const tenantId = (await getApiCaller())?.tenantId ?? null;
  return NextResponse.json({ tenantId }, cache);
}
