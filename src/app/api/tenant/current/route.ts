import { NextResponse } from "next/server";
import { apiTenantId } from "@/lib/tenant/api";

// Returns the current user's resolved tenant id. Resolved server-side so client
// components get a reliable value (honours auth cookies, SA impersonation, and
// subdomain context) rather than depending on the browser auth session.
export async function GET() {
  const tenantId = await apiTenantId();
  return NextResponse.json({ tenantId });
}
