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

  // Check both Vercel verification and DNS propagation
  const [vercelOk, dnsOk] = await Promise.all([
    verifyDomainOnVercel(tenant.custom_domain),
    checkDnsResolution(tenant.custom_domain),
  ]);

  if (vercelOk && dnsOk) {
    await supabase
      .from("tenants")
      .update({ domain_status: "active" })
      .eq("id", tenantId);

    // Update domain_orders too
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
    reason: !dnsOk ? "DNS not yet propagated" : "Vercel not yet verified",
  });
}
