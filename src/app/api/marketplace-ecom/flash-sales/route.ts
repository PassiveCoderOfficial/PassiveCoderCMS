import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

/** Store admin: flash-sale campaigns with their products. */
export async function GET() {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await createAdminClient();
  const [{ data: sales }, { data: products }] = await Promise.all([
    admin
      .from("flash_sales")
      .select("id, title, starts_at, ends_at, status, flash_sale_items(id, product_id, sale_price, quantity_limit, sold, products(name, price, images))")
      .eq("tenant_id", tenantId)
      .order("starts_at", { ascending: false })
      .limit(30),
    admin
      .from("products")
      .select("id, name, price, vendors!inner(name, status)")
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .eq("approval_status", "approved")
      .eq("vendors.status", "approved")
      .order("name")
      .limit(500),
  ]);
  return NextResponse.json({ sales: sales ?? [], products: products ?? [] });
}

/**
 * Actions:
 *  { action: "create", title, starts_at, ends_at }
 *  { action: "status", id, status }
 *  { action: "add_item", flash_sale_id, product_id, sale_price, quantity_limit }
 *  { action: "remove_item", item_id }
 */
export async function POST(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const admin = await createAdminClient();

  if (b.action === "create") {
    const starts = new Date(b.starts_at);
    const ends = new Date(b.ends_at);
    if (isNaN(+starts) || isNaN(+ends) || ends <= starts) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }
    const { error } = await admin.from("flash_sales").insert({
      tenant_id: tenantId,
      title: String(b.title ?? "").trim() || "Flash Sale",
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      status: "active",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (b.action === "status") {
    if (!["draft", "active", "ended"].includes(b.status)) return NextResponse.json({ error: "Bad status" }, { status: 400 });
    await admin.from("flash_sales").update({ status: b.status }).eq("id", b.id).eq("tenant_id", tenantId);
    return NextResponse.json({ ok: true });
  }

  if (b.action === "add_item") {
    const { data: sale } = await admin.from("flash_sales").select("id").eq("id", b.flash_sale_id).eq("tenant_id", tenantId).maybeSingle();
    const { data: product } = await admin.from("products").select("id, price").eq("id", b.product_id).eq("tenant_id", tenantId).maybeSingle();
    if (!sale || !product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const price = Number(b.sale_price);
    if (!(price > 0) || price >= Number(product.price)) {
      return NextResponse.json({ error: `Sale price must be below the normal price (৳${Number(product.price).toLocaleString()})` }, { status: 400 });
    }
    const limit = b.quantity_limit === "" || b.quantity_limit == null ? null : Math.max(1, Math.floor(Number(b.quantity_limit)));
    const { error } = await admin.from("flash_sale_items").upsert(
      { flash_sale_id: sale.id, tenant_id: tenantId, product_id: product.id, sale_price: price, quantity_limit: limit },
      { onConflict: "flash_sale_id,product_id" },
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (b.action === "remove_item") {
    await admin.from("flash_sale_items").delete().eq("id", b.item_id).eq("tenant_id", tenantId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
