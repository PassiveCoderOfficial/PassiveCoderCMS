import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { currentUserId, loadAsParty, buyerName, notifyRecipient } from "@/lib/marketplace-ecom/chat";
import { getMarketplaceChrome } from "@/lib/marketplace-ecom/chrome";

type Ctx = { params: Promise<{ id: string }> };

/** Thread + counterpart details. Opening it marks the caller's side read. */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Unknown store" }, { status: 400 });
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "login_required" }, { status: 401 });

  const party = await loadAsParty(tenantId, id, userId);
  if (!party) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { conv, role } = party;

  const admin = await createAdminClient();
  const url = new URL(req.url);
  const after = url.searchParams.get("after");

  let mq = admin
    .from("chat_messages")
    .select("id, sender_role, body, image_url, product_id, created_at, products(name, slug, images, price)")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(500);
  if (after) mq = mq.gt("created_at", after);

  const [{ data: messages }, { data: vendor }, { data: product }] = await Promise.all([
    mq,
    admin.from("vendors").select("name, slug, logo, phone").eq("id", conv.vendor_id).maybeSingle(),
    conv.product_id
      ? admin.from("products").select("id, name, slug, images, price").eq("id", conv.product_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const unreadCol = role === "buyer" ? "buyer_unread" : "vendor_unread";
  if (conv[unreadCol] > 0) await admin.from("chat_conversations").update({ [unreadCol]: 0 }).eq("id", id);

  // Counterpart's WhatsApp number powers the "Notify on WhatsApp" button.
  // Only ever returned to the other party of this conversation.
  let counterpart: { name: string; avatar: string | null; phone: string | null; shop_slug?: string | null };
  if (role === "buyer") {
    counterpart = { name: vendor?.name ?? "Seller", avatar: vendor?.logo ?? null, phone: vendor?.phone ?? null, shop_slug: vendor?.slug };
  } else {
    const { data: prof } = await admin
      .from("customer_profiles").select("phone").eq("tenant_id", tenantId).eq("customer_id", conv.buyer_id).maybeSingle();
    // No profile phone? Fall back to the phone on their latest order here.
    let phone: string | null = prof?.phone ?? null;
    if (!phone) {
      const { data: o } = await admin
        .from("orders").select("shipping_address").eq("tenant_id", tenantId).eq("customer_id", conv.buyer_id)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      phone = (o?.shipping_address as { phone?: string } | null)?.phone ?? null;
    }
    counterpart = { name: await buyerName(tenantId, conv.buyer_id), avatar: null, phone };
  }

  return NextResponse.json({ role, counterpart, product, messages: messages ?? [] });
}

/** Post a message into the thread and notify the other side. */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Unknown store" }, { status: 400 });
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "login_required" }, { status: 401 });

  const party = await loadAsParty(tenantId, id, userId);
  if (!party) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { conv, role } = party;

  const input = await req.json().catch(() => ({}));
  const body = typeof input.body === "string" ? input.body.trim().slice(0, 2000) : "";
  const imageUrl = typeof input.image_url === "string" && input.image_url.startsWith("https://") ? input.image_url : null;
  const productId = typeof input.product_id === "string" ? input.product_id : null;
  if (!body && !imageUrl && !productId) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  const admin = await createAdminClient();
  let product: { id: string; name: string } | null = null;
  if (productId) {
    const { data } = await admin
      .from("products").select("id, name").eq("id", productId).eq("vendor_id", conv.vendor_id).maybeSingle();
    product = data;
  }

  const { data: msg, error } = await admin
    .from("chat_messages")
    .insert({
      conversation_id: id,
      tenant_id: tenantId,
      sender_role: role,
      sender_id: userId,
      body: body || null,
      image_url: imageUrl,
      product_id: product?.id ?? null,
    })
    .select("id, sender_role, body, image_url, product_id, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const preview = body || (imageUrl ? "Sent a photo" : `Shared a product: ${product?.name ?? ""}`);
  const otherUnread = role === "buyer" ? "vendor_unread" : "buyer_unread";
  await admin
    .from("chat_conversations")
    .update({
      last_message: preview.slice(0, 200),
      last_message_at: msg.created_at,
      [otherUnread]: conv[otherUnread] + 1,
    })
    .eq("id", id);

  const chrome = await getMarketplaceChrome(tenantId);
  const senderName =
    role === "buyer"
      ? await buyerName(tenantId, userId)
      : (await admin.from("vendors").select("name").eq("id", conv.vendor_id).maybeSingle()).data?.name ?? "Seller";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");

  await notifyRecipient({
    conv,
    senderRole: role,
    senderName,
    preview,
    origin: `${proto}://${host}`,
    siteName: chrome?.siteName ?? "our marketplace",
  });

  return NextResponse.json({ message: msg, sender_name: senderName });
}
