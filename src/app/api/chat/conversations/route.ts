import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { currentUserId, vendorIdForUser, buyerName } from "@/lib/marketplace-ecom/chat";

/** Inbox. `?as=vendor` lists the signed-in seller's conversations; default
 *  lists the signed-in buyer's. */
export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Unknown store" }, { status: 400 });
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "login_required" }, { status: 401 });

  const asVendor = new URL(req.url).searchParams.get("as") === "vendor";
  const admin = await createAdminClient();
  let query = admin
    .from("chat_conversations")
    .select("id, vendor_id, buyer_id, product_id, last_message, last_message_at, buyer_unread, vendor_unread, vendors(name, logo), products(name, slug, images, price)")
    .eq("tenant_id", tenantId)
    .order("last_message_at", { ascending: false })
    .limit(100);

  if (asVendor) {
    const vid = await vendorIdForUser(tenantId, userId);
    if (!vid) return NextResponse.json({ error: "not_a_seller" }, { status: 403 });
    query = query.eq("vendor_id", vid);
  } else {
    query = query.eq("buyer_id", userId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const rows = await Promise.all(
    (data ?? []).map(async (c) => {
      const v = c.vendors as unknown as { name: string; logo: string | null } | null;
      return {
        id: c.id,
        title: asVendor ? await buyerName(tenantId, c.buyer_id) : v?.name ?? "Seller",
        avatar: asVendor ? null : v?.logo ?? null,
        product: c.products,
        last_message: c.last_message,
        last_message_at: c.last_message_at,
        unread: asVendor ? c.vendor_unread : c.buyer_unread,
      };
    }),
  );
  return NextResponse.json({ conversations: rows });
}

/** Buyer opens (or reopens) a conversation with a seller, optionally about a
 *  product. One thread per buyer-seller pair; the latest product wins. */
export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Unknown store" }, { status: 400 });
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "login_required" }, { status: 401 });

  const { vendor_id, product_id } = await req.json().catch(() => ({}));
  if (!vendor_id) return NextResponse.json({ error: "vendor_id required" }, { status: 400 });

  const admin = await createAdminClient();
  const { data: vendor } = await admin
    .from("vendors")
    .select("id, user_id")
    .eq("id", vendor_id)
    .eq("tenant_id", tenantId)
    .eq("status", "approved")
    .maybeSingle();
  if (!vendor) return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  if (vendor.user_id === userId) {
    return NextResponse.json({ error: "You can't message your own shop" }, { status: 400 });
  }

  let productId: string | null = null;
  if (product_id) {
    const { data: p } = await admin
      .from("products").select("id").eq("id", product_id).eq("vendor_id", vendor_id).maybeSingle();
    productId = p?.id ?? null;
  }

  const { data: existing } = await admin
    .from("chat_conversations")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("vendor_id", vendor_id)
    .eq("buyer_id", userId)
    .maybeSingle();

  if (existing) {
    if (productId) await admin.from("chat_conversations").update({ product_id: productId }).eq("id", existing.id);
    return NextResponse.json({ id: existing.id });
  }

  const { data: created, error } = await admin
    .from("chat_conversations")
    .insert({ tenant_id: tenantId, vendor_id, buyer_id: userId, product_id: productId })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: created.id });
}
