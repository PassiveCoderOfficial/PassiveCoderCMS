import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { tooMany } from "@/lib/rate-limit";

/** Shopper asks to be emailed when a sold-out product / variation is back. */
export async function POST(req: NextRequest) {
  const limited = tooMany(req, "stock-alert", 5);
  if (limited) return limited;
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Store not found" }, { status: 400 });
  const b = await req.json().catch(() => ({})) as { productId?: string; variantId?: string; email?: string };
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 160);
  if (!b.productId || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  const admin = await createAdminClient();
  const { data: p } = await admin.from("products").select("id").eq("id", b.productId).eq("tenant_id", tenantId).maybeSingle();
  if (!p) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  let q = admin.from("product_stock_alerts").select("id").eq("product_id", b.productId).eq("email", email).is("notified_at", null);
  q = b.variantId ? q.eq("variant_id", b.variantId) : q.is("variant_id", null);
  const { data: dup } = await q.limit(1);
  if (!dup?.length) await admin.from("product_stock_alerts").insert({ tenant_id: tenantId, product_id: b.productId, variant_id: b.variantId || null, email });
  return NextResponse.json({ ok: true });
}
