import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

/** Vendor listings awaiting review. */
export async function GET(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "pending";

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("products")
    .select(
      "id, name, slug, price, compare_price, images, description, short_description, stock_quantity, category_ids, approval_status, rejection_reason, status, created_at, vendors(id, name, slug)",
    )
    .eq("tenant_id", tenantId)
    .not("vendor_id", "is", null)
    .eq("approval_status", status)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ids, action, reason } = await req.json();
  const targets: string[] = ids?.length ? ids : id ? [id] : [];
  if (!targets.length) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }

  const approving = action === "approve";
  const patch: Record<string, unknown> = {
    approval_status: approving ? "approved" : "rejected",
    rejection_reason: approving ? null : (reason?.trim() || "Did not meet listing guidelines"),
    approved_at: approving ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
  // Approval puts the listing live; rejection pulls it back to draft so it
  // can't sit visible in the catalogue while the seller fixes it.
  patch.status = approving ? "active" : "draft";

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("products")
    .update(patch)
    .in("id", targets)
    .eq("tenant_id", tenantId)
    .not("vendor_id", "is", null)
    .select("id, name, approval_status, status");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ updated: data ?? [] });
}
