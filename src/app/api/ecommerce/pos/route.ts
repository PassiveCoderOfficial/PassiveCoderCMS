import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { upsertContact } from "@/lib/crm/upsertContact";

interface PosItem { product_id: string; name: string; price: number; quantity: number }

/** In-person quick sale: paid order + stock decrement + accounting income. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const items: PosItem[] = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return NextResponse.json({ error: "No items" }, { status: 400 });

  const admin = await createAdminClient();

  // Server-side prices
  const ids = [...new Set(items.map(i => i.product_id))];
  const { data: products } = await admin.from("products")
    .select("id, name, price, stock_quantity, track_inventory")
    .eq("tenant_id", tenantId).in("id", ids);
  if (!products?.length) return NextResponse.json({ error: "Products not found" }, { status: 400 });

  const priceMap = new Map(products.map(p => [p.id, p]));
  const verified = items.map(i => {
    const p = priceMap.get(i.product_id);
    return { ...i, name: p?.name ?? i.name, price: p?.price ?? i.price };
  });

  const subtotal = verified.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = Math.max(0, Number(body.discount) || 0);
  const total = Math.max(0, subtotal - discount);
  const paymentMethod = body.payment_method || "cash";

  const { data: order, error } = await admin.from("orders")
    .insert({
      tenant_id: tenantId,
      order_number: `POS-${Date.now()}`,
      customer_name: body.customer_name?.trim() || "Walk-in customer",
      customer_email: body.customer_email?.trim().toLowerCase() || "walkin@pos.local",
      status: "completed",
      payment_status: "paid",
      payment_method: paymentMethod,
      items: verified,
      billing_address: { first_name: body.customer_name ?? "Walk-in", last_name: "", email: body.customer_email ?? "" },
      subtotal,
      discount,
      shipping_cost: 0,
      tax: 0,
      total,
      notes: body.notes ?? null,
    })
    .select("id, order_number")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Stock decrement for tracked items
  for (const item of verified) {
    const p = priceMap.get(item.product_id);
    if (!p?.track_inventory) continue;
    await admin.from("products")
      .update({ stock_quantity: Math.max(0, (p.stock_quantity ?? 0) - item.quantity), updated_at: new Date().toISOString() })
      .eq("id", p.id);
  }

  // Accounting income entry
  const { data: settings } = await admin.from("site_settings")
    .select("currency").eq("tenant_id", tenantId).maybeSingle();
  await admin.from("transactions").insert({
    tenant_id: tenantId,
    type: "income",
    status: "completed",
    amount: total,
    currency: settings?.currency || "USD",
    description: `POS sale ${order.order_number}`,
    category: "sales",
    order_id: order.id,
    customer_name: body.customer_name ?? "Walk-in",
    is_public: false,
    date: new Date().toISOString().slice(0, 10),
  }).then(() => {}, () => {});

  // Optional CRM contact when the customer left a phone/email
  if (body.customer_phone || (body.customer_email && !body.customer_email.endsWith("@pos.local"))) {
    await upsertContact({
      tenantId,
      name: body.customer_name,
      phone: body.customer_phone,
      email: body.customer_email,
      source: "order",
      tags: ["customer", "pos"],
      event: {
        type: "order",
        title: `POS sale ${order.order_number} — ${total}`,
        meta: { order_id: order.id, total, payment_method: paymentMethod },
      },
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true, orderId: order.id, orderNumber: order.order_number, total });
}
