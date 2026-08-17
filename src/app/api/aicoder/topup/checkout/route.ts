import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { getDodoClient, resolveDodoConfig } from "@/lib/billing/dodo";

/**
 * Initiates a Dodo checkout for an AiCoder generation top-up package.
 * Unlike plan checkout (fixed 3 SKUs mapped from env/platform_settings),
 * packages are dynamic rows — each carries its own Dodo product id, set by
 * SA after creating the product on Dodo's dashboard. No product id means no
 * checkout, ever — this never guesses at what to charge.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { packageId } = await req.json().catch(() => ({}));
  if (!packageId) return NextResponse.json({ error: "Missing packageId" }, { status: 400 });

  const admin = await createAdminClient();

  const { data: membership } = await admin
    .from("tenant_members")
    .select("user_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: pkg } = await admin
    .from("ai_generation_packages")
    .select("*")
    .eq("id", packageId)
    .eq("active", true)
    .maybeSingle();
  if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });

  const { data: ps } = await admin.from("platform_settings").select("*").eq("id", 1).maybeSingle();
  const dodoConfig = resolveDodoConfig(ps as Record<string, unknown> | null);
  if (!dodoConfig.apiKey) {
    return NextResponse.json({ error: "Dodo API key not configured — set it in SA Settings" }, { status: 400 });
  }

  const productId = dodoConfig.sandbox ? pkg.dodo_product_id_sandbox : pkg.dodo_product_id;
  if (!productId) {
    return NextResponse.json({
      error: `This package has no Dodo product configured yet (${dodoConfig.sandbox ? "sandbox" : "live"} mode) — ask your admin to set it up.`,
    }, { status: 400 });
  }

  const origin = new URL(req.url).origin;
  try {
    const session = await getDodoClient({ apiKey: dodoConfig.apiKey, sandbox: dodoConfig.sandbox }).checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email: user.email!, name: user.email! },
      return_url: `${origin}/dashboard/pages?aicoder_topup=1`,
      cancel_url: `${origin}/dashboard/pages?aicoder_topup=cancelled`,
      metadata: { type: "ai_topup", tenant_id: tenantId, package_id: pkg.id, generations: String(pkg.generations) },
      feature_flags: { redirect_immediately: true },
    });

    return NextResponse.json({ checkoutUrl: session.checkout_url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Dodo checkout init failed" }, { status: 502 });
  }
}
