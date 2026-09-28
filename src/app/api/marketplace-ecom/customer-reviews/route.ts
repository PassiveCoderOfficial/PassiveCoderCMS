import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

/** Store admin: every buyer review, newest first, hidden ones included. */
export async function GET() {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("product_reviews")
    .select("id, reviewer_name, rating, body, tags, images, seller_reply, status, created_at, products(name, slug), vendors(name)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ reviews: data ?? [] });
}

/** Store admin: hide or restore a review (abuse, spam, off-topic). */
export async function PATCH(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, status } = await req.json().catch(() => ({}));
  if (!id || !["published", "hidden"].includes(status)) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }
  const admin = await createAdminClient();
  const { error } = await admin
    .from("product_reviews")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
