import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { apiSupabase } from "@/lib/auth/api-caller";
import { sendEmail } from "@/lib/email";

/**
 * After a product is saved: email everyone waiting for a variation (or the
 * product) that is now in stock. Caller must be able to edit the store.
 */
export async function POST(req: NextRequest) {
  const { productId } = await req.json().catch(() => ({})) as { productId?: string };
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });
  // Cookie session on the web, Bearer token from the mobile app; RLS applies either way.
  const sb = await apiSupabase(req);
  const { data: product } = await sb.from("products").select("id, name, slug, tenant_id, track_inventory, stock_quantity").eq("id", productId).maybeSingle();
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data: canEdit } = await sb.rpc("is_tenant_editor", { t: product.tenant_id });
  if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = await createAdminClient();
  const { data: alerts } = await admin.from("product_stock_alerts").select("id, email, variant_id").eq("product_id", productId).is("notified_at", null);
  if (!alerts?.length) return NextResponse.json({ sent: 0 });
  const { data: variants } = await admin.from("product_variants").select("id, name, stock_quantity, is_active").eq("product_id", productId);
  const productInStock = !product.track_inventory || Number(product.stock_quantity) > 0;
  const { data: site } = await admin.from("site_settings").select("site_url, site_name").eq("tenant_id", product.tenant_id).maybeSingle();
  const base = (site?.site_url as string | null)?.replace(/\/$/, "") ?? "";
  let sent = 0;
  for (const a of alerts) {
    const v = a.variant_id ? (variants ?? []).find((x) => x.id === a.variant_id) : null;
    const back = a.variant_id ? !!v && v.is_active !== false && (v.stock_quantity === null || Number(v.stock_quantity) > 0) : productInStock;
    if (!back) continue;
    const label = v ? `${product.name} (${v.name})` : product.name;
    const url = `${base}/products/${product.slug}`;
    const r = await sendEmail({
      to: a.email, brandTenantId: product.tenant_id,
      subject: `${label} is back in stock`,
      html: `<p>Good news: <strong>${label}</strong> is back in stock at ${site?.site_name ?? "our store"}.</p><p><a href="${url}">Order it now</a></p>`,
    });
    if (r.ok) { sent++; await admin.from("product_stock_alerts").update({ notified_at: new Date().toISOString() }).eq("id", a.id); }
  }
  return NextResponse.json({ sent });
}
