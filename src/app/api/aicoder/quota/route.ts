import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { getQuotaStatus } from "@/lib/aicoder/quota";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = await getQuotaStatus(tenantId);
  if (!status) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  return NextResponse.json(status);
}
