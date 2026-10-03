import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { addDomainToVercel } from "@/lib/domain/vercel";
import { getNameserverInstructions, getARecordInstructions } from "@/lib/domain/dns";
import { callerCanManageTenant } from "@/lib/auth/verify-bearer";
import { normalizeDomain } from "@/lib/domain/normalize";
import { addWwwRedirectToVercel, removeDomainFromVercel } from "@/lib/domain/vercel";

export async function POST(req: Request) {
  const { tenantId, domain: rawDomain, type } = await req.json() as {
    tenantId: string;
    domain: string;
    type: "nameserver" | "arecord";
  };

  if (!tenantId || !rawDomain || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!(await callerCanManageTenant(req, tenantId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const norm = normalizeDomain(rawDomain, process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com");
  if ("error" in norm) return NextResponse.json({ error: norm.error }, { status: 400 });
  const domain = norm.domain;

  try {
    const supabase = await createAdminClient();

    // One domain, one site. Without this a second site could claim a domain
    // that's already live elsewhere and take over its traffic once verified.
    const { data: taken } = await supabase.from("tenants").select("id")
      .ilike("custom_domain", domain).neq("id", tenantId).limit(1);
    if (taken?.length) {
      return NextResponse.json({ error: "This domain is already connected to another site. If it's yours, contact support." }, { status: 409 });
    }

    // Switching domains: release the old one from Vercel first.
    const { data: current } = await supabase.from("tenants").select("custom_domain").eq("id", tenantId).maybeSingle();
    if (current?.custom_domain && current.custom_domain !== domain) {
      for (const d of [current.custom_domain, `www.${current.custom_domain}`]) {
        await removeDomainFromVercel(d).catch(() => {});
      }
      await supabase.from("domain_orders").delete().eq("tenant_id", tenantId).eq("domain", current.custom_domain);
    }

    // Add to Vercel so it's ready to route when DNS propagates. Don't hard-fail the
    // whole flow if the Vercel API call fails (e.g. token not yet configured) — we
    // still save the domain and return DNS instructions so the client can proceed;
    // the verify cron / Verify button will bind it once Vercel is reachable.
    let vercelWarning: string | null = null;
    try {
      await addDomainToVercel(domain);
      await addWwwRedirectToVercel(domain);
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
      domain,
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
