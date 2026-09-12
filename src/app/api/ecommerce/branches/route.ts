import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

/** Create a branch for the current tenant. */
export async function POST(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, address, phone } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("restaurant_branches")
    .insert({ tenant_id: tenantId, name: name.trim(), address: address?.trim() || null, phone: phone?.trim() || null })
    .select("id, name, address, phone, is_active")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ branch: data });
}

/** Update a branch's own fields (name/address/phone/is_active). */
export async function PATCH(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { branch_id, ...patch } = await req.json();
  if (!branch_id) return NextResponse.json({ error: "Missing branch_id" }, { status: 400 });

  const allowed: Record<string, unknown> = {};
  if (typeof patch.name === "string") allowed.name = patch.name.trim();
  if (typeof patch.address === "string") allowed.address = patch.address.trim() || null;
  if (typeof patch.phone === "string") allowed.phone = patch.phone.trim() || null;
  if (typeof patch.is_active === "boolean") allowed.is_active = patch.is_active;
  allowed.updated_at = new Date().toISOString();

  const admin = await createAdminClient();
  // .eq("tenant_id", ...) in the same update is the ownership check — a
  // branch_id belonging to another tenant simply matches zero rows.
  const { data, error } = await admin
    .from("restaurant_branches")
    .update(allowed)
    .eq("id", branch_id)
    .eq("tenant_id", tenantId)
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Branch not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
