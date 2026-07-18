import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAgent } from "@/lib/agent";
import { AGENT_VIEWING_COOKIE } from "@/lib/tenant/current";
import { withCookieDomain } from "@/lib/supabase/cookie-domain";

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
const isLocal = ROOT.includes("localhost");
const proto = isLocal ? "http" : "https";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params;
  const agent = await getAgent();
  if (!agent) return NextResponse.json({ error: "Not a staff member" }, { status: 403 });

  const admin = await createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, slug")
    .eq("id", tenantId)
    .or(`assigned_agent_id.eq.${agent.id},referred_by_agent_id.eq.${agent.id}`)
    .maybeSingle();

  if (!tenant) return NextResponse.json({ error: "You don't have access to this site" }, { status: 403 });

  // Middleware resolves the tenant purely from the subdomain hostname, so the
  // redirect must land on that tenant's own subdomain — not stay on whatever
  // host served this route (e.g. the root/agent-portal domain) — or the
  // dashboard layout below never sees a resolvable tenant.
  const res = NextResponse.redirect(`${proto}://${tenant.slug}.${ROOT}/dashboard`);
  res.cookies.set(AGENT_VIEWING_COOKIE, tenantId, withCookieDomain({
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 8,
  }));
  return res;
}
