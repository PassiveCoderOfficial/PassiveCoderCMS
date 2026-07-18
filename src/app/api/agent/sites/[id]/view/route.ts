import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAgent } from "@/lib/agent";
import { AGENT_VIEWING_COOKIE } from "@/lib/tenant/current";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params;
  const agent = await getAgent();
  if (!agent) return NextResponse.json({ error: "Not a staff member" }, { status: 403 });

  const admin = await createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("id", tenantId)
    .or(`assigned_agent_id.eq.${agent.id},referred_by_agent_id.eq.${agent.id}`)
    .maybeSingle();

  if (!tenant) return NextResponse.json({ error: "You don't have access to this site" }, { status: 403 });

  const res = NextResponse.redirect(new URL("/dashboard", req.url));
  res.cookies.set(AGENT_VIEWING_COOKIE, tenantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
