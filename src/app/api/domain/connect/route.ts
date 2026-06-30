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
    const supabase = await createAdminClient();

    // Add to Vercel so it's ready to route when DNS propagates. Don't hard-fail the
    // whole flow if the Vercel API call fails (e.g. token not yet configured) — we
    // still save the domain and return DNS instructions so the client can proceed;
    // the verify cron / Verify button will bind it once Vercel is reachable.
    let vercelWarning: string | null = null;
    try {
      await addDomainToVercel(domain);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Vercel domain registration failed";
      // 409 / "already in use" = domain is already on the project → success, not an error.
      if (/already in use|domain_already_in_use|409/i.test(msg)) {
        console.log("addDomainToVercel: domain already on project (ok)");
      } else {
        vercelWarning = msg;
        console.error("addDomainToVercel failed (continuing):", vercelWarning);
      }
    }

    // Nameserver method = Vercel nameservers. Vercel hosts the zone and auto-creates
    // records once the domain is added to the project (above). No external DNS host.
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

    const warn = vercelWarning
      ? "Domain saved and DNS instructions ready. Vercel binding is not active yet (admin needs to set VERCEL_API_TOKEN). It completes automatically once configured."
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
