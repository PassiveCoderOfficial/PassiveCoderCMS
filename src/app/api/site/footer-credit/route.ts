import { NextResponse } from "next/server";
import { apiTenantId } from "@/lib/tenant/api";
import { creditPolicyFor } from "@/lib/site/footer-credit";

/** Dashboard: the site's footer credit policy (may it change it, and the default it shows). */
export async function GET() {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await creditPolicyFor(tenantId));
}
