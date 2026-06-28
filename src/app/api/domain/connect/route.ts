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
      vercelWarning = e instanceof Error ? e.message : "Vercel domain registration failed";
      console.error("addDomainToVercel failed (continuing):", vercelWarning);
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

    return NextResponse.json({
      ok: true,
      instructions,
      ...(vercelWarning && {
        warning:
          "Domain saved and DNS instructions ready. Vercel binding is not active yet (admin needs to set VERCEL_API_TOKEN). It will complete automatically once configured.",
      }),
    });
  } catch (err) {
    console.error("Domain connect error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Connect failed" },
      { status: 500 },
    );
  }
}
