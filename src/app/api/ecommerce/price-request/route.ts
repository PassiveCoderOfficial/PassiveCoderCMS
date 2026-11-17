import { NextResponse } from "next/server";
import { isBlockedSender } from "@/lib/spam/guard";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { notifyTenantEvent } from "@/lib/push/notify";

// Shopper asks for the price of a product that has none. Saved to
// price_requests and answered from Ecommerce → Price Requests.
const hits = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 10;

function rateLimited(key: string): boolean {
  const now = Date.now();
  const rec = hits.get(key);
  if (!rec || now - rec.first > WINDOW_MS) { hits.set(key, { count: 1, first: now }); return false; }
  rec.count += 1;
  return rec.count > MAX_PER_WINDOW;
}

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function POST(req: Request) {
  const h = await headers();
  const tenantId = h.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Store not found" }, { status: 400 });
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (rateLimited(`${tenantId}:${ip}`)) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  // Honeypot and too-fast submits: pretend success so bots learn nothing.
  if (clip(body.website, 200) || (typeof body.elapsedMs === "number" && body.elapsedMs < 1500)) return NextResponse.json({ ok: true });

  const name = clip(body.name, 120);
  const phone = clip(body.phone, 40);
  const email = clip(body.email, 160);
  if (!name || !phone) return NextResponse.json({ error: "Please add your name and phone." }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Please check the email address." }, { status: 400 });

  if (await isBlockedSender(tenantId, { email, phone, ip }, "price_request", { name, email, phone, message: clip(body.message, 1500) })) return NextResponse.json({ ok: true });

  const admin = await createAdminClient();
  const productId = clip(body.productId, 64);
  const { data: product } = productId
    ? await admin.from("products").select("id, name").eq("id", productId).eq("tenant_id", tenantId).maybeSingle()
    : { data: null };
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const quantity = clip(body.quantity, 80);
  const message = clip(body.message, 1500);
  const now = new Date().toISOString();
  const { data: pr, error } = await admin.from("price_requests").insert({
    tenant_id: tenantId, product_id: product.id, product_name: product.name,
    name, phone, email: email || null, quantity: quantity || null, message: message || null,
    thread: message ? [{ from: "customer", text: message, at: now }] : [],
  }).select("id").single();
  if (error) return NextResponse.json({ error: "Could not save your request." }, { status: 500 });
  await notifyTenantEvent({ tenantId, type: "price_request", id: pr.id, dedupeKey: `price-request:${pr.id}`, title: `Price request: ${product.name}`, body: `${name}${quantity ? `, qty ${quantity}` : ""}${message ? `: ${message.slice(0, 100)}` : ""}` });

  // Tell the store (primary contact email), best effort.
  const { data: contact } = await admin.from("contact_details").select("email").eq("tenant_id", tenantId)
    .order("is_primary", { ascending: false }).limit(1).maybeSingle();
  if (contact?.email) {
    await sendEmail({
      to: contact.email, brandTenantId: tenantId,
      subject: `Price request: ${product.name}`,
      text: `${name} asked for the price of ${product.name}.\n\nPhone: ${phone}${email ? `\nEmail: ${email}` : ""}${quantity ? `\nQuantity: ${quantity}` : ""}${message ? `\n\n${message}` : ""}\n\nReply and set the price in your dashboard: Ecommerce → Price Requests.`,
    }).catch(() => null);
  }
  return NextResponse.json({ ok: true });
}
