import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

/** Create a table for one of this tenant's branches. */
export async function POST(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { branch_id, table_number } = await req.json();
  if (!branch_id || !table_number?.trim()) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = await createAdminClient();
  const { data: branch } = await admin
    .from("restaurant_branches").select("id").eq("id", branch_id).eq("tenant_id", tenantId).maybeSingle();
  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

  const { data, error } = await admin
    .from("restaurant_tables")
    .insert({ branch_id, table_number: table_number.trim() })
    .select("id, table_number, qr_token, branch_id, is_active")
    .single();

  if (error) {
    // The unique (branch_id, table_number) index (087) is what actually
    // catches a duplicate — surface it as a normal validation error rather
    // than a raw constraint-violation message.
    if (error.code === "23505") return NextResponse.json({ error: "That table number already exists" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ table: data });
}

/** Deactivate a table (soft — past orders keep the reference and qr_token). */
export async function DELETE(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { table_id } = await req.json();
  if (!table_id) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const admin = await createAdminClient();
  const { data: ownedBranchIds } = await admin.from("restaurant_branches").select("id").eq("tenant_id", tenantId);
  const { data, error } = await admin
    .from("restaurant_tables")
    .update({ is_active: false })
    .eq("id", table_id)
    .in("branch_id", (ownedBranchIds ?? []).map(b => b.id))
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Table not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
