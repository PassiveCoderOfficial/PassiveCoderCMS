import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getStaff } from "@/lib/staff";
import { STAFF_VIEWING_COOKIE } from "@/lib/tenant/current";
import { withCookieDomain } from "@/lib/supabase/cookie-domain";

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
const isLocal = ROOT.includes("localhost");
const proto = isLocal ? "http" : "https";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params;
  const agent = await getStaff();
  if (!agent) return NextResponse.json({ error: "Not a staff member" }, { status: 403 });

  const admin = await createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, slug")
    .eq("id", tenantId)
    .or(`assigned_staff_id.eq.${agent.id},referred_by_staff_id.eq.${agent.id}`)
    .maybeSingle();

  if (!tenant) return NextResponse.json({ error: "You don't have access to this site" }, { status: 403 });

  // Middleware resolves the tenant purely from the subdomain hostname, so the
  // redirect must land on that tenant's own subdomain — not stay on whatever
  // host served this route (e.g. the root/staff-portal domain) — or the
  // dashboard layout below never sees a resolvable tenant.
  const res = NextResponse.redirect(`${proto}://${tenant.slug}.${ROOT}/dashboard`);
  // The redirect target is always a {slug}.ROOT subdomain by construction
  // above, never a custom domain, so the root domain is the real host here —
  // unlike the other callers of withCookieDomain, which must use whatever host
  // the current request actually arrived on.
  // Was 8 hours — long enough that a staff member who viewed a different
  // assigned site earlier that day could later open their OWN site's
  // root-domain dashboard (no subdomain in the URL) and have this stale
  // cookie silently used as the tenant instead (getCurrentTenantId()'s
  // fallback). A real incident: a staff member applied a template intending
  // to change their own site and it landed on a site they'd viewed hours
  // earlier. 30 minutes keeps the "resume where I left off" convenience this
  // cookie exists for while shrinking that window a lot; the confirm dialog
  // on the template-apply action now also names the target site as a second
  // line of defense regardless of how the tenant id was resolved.
  res.cookies.set(STAFF_VIEWING_COOKIE, tenantId, withCookieDomain(ROOT, {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 30,
  }));
  return res;
}
