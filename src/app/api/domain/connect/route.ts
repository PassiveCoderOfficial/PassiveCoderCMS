import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { addDomainToVercel } from "@/lib/domain/vercel";
import { getNameserverInstructions, getARecordInstructions } from "@/lib/domain/dns";

export async function POST(req: Request) {
  const { tenantId, domain, type } = await req.json() as {
    tenantId: string;
    domain: string;
    type: "nameserver" | "arecord";
  };

  if (!tenantId || !domain || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // Add to Vercel so it's ready to route when DNS propagates
    await addDomainToVercel(domain);

    const supabase = await createAdminClient();
    await supabase
      .from("tenants")
      .update({ custom_domain: domain, domain_status: "pending" })
      .eq("id", tenantId);

    await supabase.from("domain_orders").insert({
      tenant_id: tenantId,
      domain,
      status: "pending_dns",
      dns_type: type,
    });

    const instructions =
      type === "nameserver"
        ? getNameserverInstructions()
        : getARecordInstructions(domain);

    return NextResponse.json({ ok: true, instructions });
  } catch (err) {
    console.error("Domain connect error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Connect failed" },
      { status: 500 },
    );
  }
}
