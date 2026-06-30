import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { removeDomainFromVercel } from "@/lib/domain/vercel";

/**
 * Disconnect a tenant's custom domain: detach from Vercel and clear DB state.
 * The site stays available at the default <slug>.<root> subdomain.
 * LogicBox DNS records are left in place (harmless; the domain just stops being
 * served by this project once removed from Vercel + tenant cleared).
 */
export async function POST(req: Request) {
  const { tenantId } = await req.json() as { tenantId: string };
  if (!tenantId) {
    return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
  }

  try {
    const supabase = await createAdminClient();
    const { data: tenant } = await supabase
      .from("tenants")
      .select("custom_domain")
      .eq("id", tenantId)
      .single();

    const domain = tenant?.custom_domain;
    if (domain) {
      try {
        await removeDomainFromVercel(domain);
      } catch (e) {
        // Non-fatal: domain may already be gone from Vercel.
        console.warn("removeDomainFromVercel:", e instanceof Error ? e.message : e);
      }
    }

    await supabase
      .from("tenants")
      .update({ custom_domain: null, domain_status: "none" })
      .eq("id", tenantId);

    if (domain) {
      await supabase
        .from("domain_orders")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("domain", domain);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Domain disconnect error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Disconnect failed" },
      { status: 500 },
    );
  }
}
