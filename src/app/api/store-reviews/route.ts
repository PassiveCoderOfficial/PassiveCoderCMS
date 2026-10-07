import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Review from a single-store product page. Anyone may write one; it is saved
 * as 'pending' and only shows after the store approves it (Ecommerce →
 * Reviews). Marked verified when the email has a delivered/completed order
 * for this product in this store.
 */
export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Store not found" }, { status: 400 });
  const input = await req.json().catch(() => ({}));
  if (input.website) return NextResponse.json({ ok: true }); // honeypot
  const productId = String(input.product_id ?? "");
  const rating = Number(input.rating);
  const name = String(input.name ?? "").trim().slice(0, 80);
  const email = String(input.email ?? "").trim().toLowerCase().slice(0, 160);
  const body = String(input.body ?? "").trim().slice(0, 2000);
  if (!productId || !name || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Add your name and a valid email" }, { status: 400 });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "Pick a rating from 1 to 5 stars" }, { status: 400 });
  if (body.length < 3) return NextResponse.json({ error: "Write a few words about the product" }, { status: 400 });
  const images = Array.isArray(input.images)
    ? input.images.filter((u: unknown) => typeof u === "string" && u.includes(`/media/review-photos/${tenantId}/`)).slice(0, 4)
    : [];

  const admin = await createAdminClient();
  const { data: product } = await admin.from("products").select("id, name").eq("id", productId).eq("tenant_id", tenantId).is("vendor_id", null).maybeSingle();
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const { data: orders } = await admin.from("orders").select("items, status").eq("tenant_id", tenantId).ilike("customer_email", email).in("status", ["delivered", "completed"]).limit(50);
  const verified = (orders ?? []).some((o) => Array.isArray(o.items) && (o.items as { product_id?: string }[]).some((i) => i.product_id === productId));

  const { error } = await admin.from("product_reviews").insert({
    tenant_id: tenantId, product_id: productId, reviewer_name: name, reviewer_email: email,
    rating, body, images, tags: [], status: "pending", verified,
  });
  if (error) return NextResponse.json({ error: "Could not save your review" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
