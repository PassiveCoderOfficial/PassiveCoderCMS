import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { currentUserId, vendorIdForUser } from "@/lib/marketplace-ecom/chat";

type Ctx = { params: Promise<{ id: string }> };

/** Seller replies publicly to a review of one of their products. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Unknown store" }, { status: 400 });
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "login_required" }, { status: 401 });
  const vid = await vendorIdForUser(tenantId, userId);
  if (!vid) return NextResponse.json({ error: "not_a_seller" }, { status: 403 });

  const { reply } = await req.json().catch(() => ({}));
  const text = typeof reply === "string" ? reply.trim().slice(0, 1000) : "";

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("product_reviews")
    .update({ seller_reply: text || null, seller_replied_at: text ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .eq("vendor_id", vid)
    .select("id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
