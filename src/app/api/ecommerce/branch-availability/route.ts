import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

/**
 * Toggle a product's per-branch availability (the menu "86" flip) —
 * docs/business/06-restaurant-vertical.md phase 3. Absence of a row means
 * available by default (see migration 087), so this only ever needs to
 * upsert, never insert a full table of every product on day one.
 */
export async function POST(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { branch_id, product_id, in_stock } = await req.json();
  if (!branch_id || !product_id || typeof in_stock !== "boolean") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = await createAdminClient();

  // The branch must actually belong to this tenant — without this check a
  // staff session for tenant A could toggle stock on tenant B's branch by
  // guessing/reusing a branch_id.
  const { data: branch } = await admin
    .from("restaurant_branches").select("id").eq("id", branch_id).eq("tenant_id", tenantId).maybeSingle();
  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

  const { error } = await admin
    .from("branch_product_availability")
    .upsert({ branch_id, product_id, in_stock, updated_at: new Date().toISOString() }, { onConflict: "branch_id,product_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
