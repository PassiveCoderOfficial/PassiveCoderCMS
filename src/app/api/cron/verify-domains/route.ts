import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyDomainOnVercel } from "@/lib/domain/vercel";
import { checkDnsResolution } from "@/lib/domain/dns";

/**
 * Auto-verify pending custom domains.
 * Runs on a schedule (Vercel Cron → GET with Authorization: Bearer CRON_SECRET)
 * or manually (POST with x-cron-secret: INTERNAL_CRON_SECRET).
 * For every tenant whose domain_status is pending, checks Vercel verification +
 * DNS propagation and flips to "active" when both pass — so clients never need
 * to click "Verify".
 */
async function handle(authorized: boolean) {
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createAdminClient();
  const { data: pending, error } = await supabase
    .from("tenants")
    .select("id, custom_domain, domain_status")
    .not("custom_domain", "is", null)
    .in("domain_status", ["pending", "pending_dns"]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let activated = 0;
  const results: Array<{ domain: string; active: boolean }> = [];

  for (const t of pending ?? []) {
    if (!t.custom_domain) continue;
    const [vercelOk, dnsOk] = await Promise.all([
      verifyDomainOnVercel(t.custom_domain),
      checkDnsResolution(t.custom_domain),
    ]);
    if (vercelOk && dnsOk) {
      await supabase.from("tenants").update({ domain_status: "active" }).eq("id", t.id);
      await supabase.from("domain_orders").update({ status: "active" }).eq("tenant_id", t.id).eq("domain", t.custom_domain);
      activated++;
      results.push({ domain: t.custom_domain, active: true });
    } else {
      results.push({ domain: t.custom_domain, active: false });
    }
  }

  return NextResponse.json({ checked: pending?.length ?? 0, activated, results });
}

export async function GET(req: Request) {
  // Vercel Cron sends: Authorization: Bearer ${CRON_SECRET}
  const auth = req.headers.get("authorization");
  const ok = !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`;
  return handle(ok);
}

export async function POST(req: Request) {
  const ok = req.headers.get("x-cron-secret") === process.env.INTERNAL_CRON_SECRET;
  return handle(ok);
}
