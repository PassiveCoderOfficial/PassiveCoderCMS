import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { addDomainToVercel } from "@/lib/domain/vercel";
import { getNameserverInstructions, getARecordInstructions, setupAutomaticDns } from "@/lib/domain/dns";

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
    const supabase = await createAdminClient();

    // Add to Vercel so it's ready to route when DNS propagates. Don't hard-fail the
    // whole flow if the Vercel API call fails (e.g. token not yet configured) — we
    // still save the domain and return DNS instructions so the client can proceed;
    // the verify cron / Verify button will bind it once Vercel is reachable.
    let vercelWarning: string | null = null;
    try {
      await addDomainToVercel(domain);
    } catch (e) {
      vercelWarning = e instanceof Error ? e.message : "Vercel domain registration failed";
      console.error("addDomainToVercel failed (continuing):", vercelWarning);
    }

    // Nameserver method: we host the DNS zone via LogicBox Web-Services nameservers.
    // Auto-create the A records (by domain-name; no order-id needed) so the client
    // only has to point their nameservers to us. Non-fatal if LogicBox creds are
    // missing — the client can still set NS and we retry, or fall back to A-record.
    let dnsWarning: string | null = null;
    if (type === "nameserver") {
      try {
        await setupAutomaticDns(domain);
      } catch (e) {
        dnsWarning = e instanceof Error ? e.message : "LogicBox DNS setup failed";
        console.error("setupAutomaticDns failed (continuing):", dnsWarning);
      }
    }

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

    const warn = [vercelWarning, dnsWarning].filter(Boolean).length > 0
      ? "Domain saved and DNS instructions ready. Some automation is not active yet (admin needs to set VERCEL_API_TOKEN / LogicBox API keys). It completes automatically once configured."
      : null;

    return NextResponse.json({
      ok: true,
      instructions,
      ...(warn && { warning: warn }),
    });
  } catch (err) {
    console.error("Domain connect error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Connect failed" },
      { status: 500 },
    );
  }
}
