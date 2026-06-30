import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkDnsResolution } from "@/lib/domain/dns";
import { verifyDomainOnVercel } from "@/lib/domain/vercel";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("custom_domain, domain_status")
    .eq("id", tenantId)
    .single();

  if (!tenant?.custom_domain) {
    return NextResponse.json({ verified: false, reason: "No domain configured" });
  }

  if (tenant.domain_status === "active") {
    return NextResponse.json({ verified: true });
  }

  // Vercel's own "verified" flag is authoritative: Vercel only marks a domain verified
  // once DNS points at it correctly (and it then issues SSL). For both methods —
  // A-record (apex → 76.76.21.21) and Vercel nameservers (apex → Vercel's own IPs) —
  // Vercel verification is the reliable signal. The raw DNS-IP check is a best-effort
  // fallback only (it can't match the dynamic Vercel-NS apex IPs).
  const [vercelOk, dnsOk] = await Promise.all([
    verifyDomainOnVercel(tenant.custom_domain),
    checkDnsResolution(tenant.custom_domain),
  ]);

  if (vercelOk || dnsOk) {
    await supabase
      .from("tenants")
      .update({ domain_status: "active" })
      .eq("id", tenantId);
    await supabase
      .from("domain_orders")
      .update({ status: "active" })
      .eq("tenant_id", tenantId)
      .eq("domain", tenant.custom_domain);
    return NextResponse.json({ verified: true });
  }

  return NextResponse.json({
    verified: false,
    vercel: vercelOk,
    dns: dnsOk,
    reason: "Domain not yet verified by Vercel — DNS can take a few minutes to propagate.",
  });
}
