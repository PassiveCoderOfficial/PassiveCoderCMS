import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createContact, registerDomain } from "@/lib/domain/logicbox";
import { addDomainToVercel } from "@/lib/domain/vercel";

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
    // registerDomain sets the domain's nameservers to the configured (Vercel)
    // nameservers, so Vercel hosts the DNS zone — no separate DNS-host step.
    const { orderId } = await registerDomain(domain, contactId);

    // Add to Vercel (creates the zone + records on Vercel's side, issues SSL).
    await addDomainToVercel(domain);

    const supabase = await createAdminClient();
    await supabase.from("domain_orders").insert({
      tenant_id: tenantId,
      domain,
      logicbox_order_id: orderId,
      status: "registered",
      dns_type: "nameserver",
    });

    await supabase
      .from("tenants")
      .update({ custom_domain: domain, domain_status: "pending" })
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
