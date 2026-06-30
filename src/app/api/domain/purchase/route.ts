import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createContact, registerDomain } from "@/lib/domain/logicbox";
import { addDomainToVercel } from "@/lib/domain/vercel";
import { setupAutomaticDns } from "@/lib/domain/dns";

export async function POST(req: Request) {
  const { tenantId, domain, contact } = await req.json() as {
    tenantId: string;
    domain: string;
    contact: {
      name: string;
      email: string;
      company: string;
      address: string;
      city: string;
      state: string;
      country: string;
      zip: string;
      phone: string;
    };
  };

  if (!tenantId || !domain || !contact) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const contactId = await createContact(contact);
    const { orderId } = await registerDomain(domain, contactId);

    // setupAutomaticDns activates the DNS zone (by domain-name) then adds A records.
    await setupAutomaticDns(domain);

    // Register with Vercel
    await addDomainToVercel(domain);

    // Record in DB
    const supabase = await createAdminClient();
    await supabase.from("domain_orders").insert({
      tenant_id: tenantId,
      domain,
      logicbox_order_id: orderId,
      status: "registered",
      dns_type: "automatic",
    });

    await supabase
      .from("tenants")
      .update({ custom_domain: domain, domain_status: "active" })
      .eq("id", tenantId);

    return NextResponse.json({ ok: true, domain });
  } catch (err) {
    console.error("Domain purchase error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Purchase failed" },
      { status: 500 },
    );
  }
}
