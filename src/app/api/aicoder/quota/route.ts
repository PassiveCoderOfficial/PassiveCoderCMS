import { NextResponse } from "next/server";
import { getApiCaller, apiSupabase } from "@/lib/auth/api-caller";
import { getCreditStatus } from "@/lib/ai/credits";

export async function GET() {
  const supabase = await apiSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = (await getApiCaller())?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = await getCreditStatus(tenantId);
  if (!status) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  return NextResponse.json(status);
}
