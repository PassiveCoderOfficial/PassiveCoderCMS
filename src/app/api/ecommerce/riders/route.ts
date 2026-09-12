import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

/** Create a rider for one of this tenant's branches. */
export async function POST(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { branch_id, name, phone } = await req.json();
  if (!branch_id || !name?.trim()) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = await createAdminClient();

  // Same tenant-ownership check as branch-availability's — a branch_id must
  // actually belong to the caller's tenant before anything is written
  // against it.
  const { data: branch } = await admin
    .from("restaurant_branches").select("id").eq("id", branch_id).eq("tenant_id", tenantId).maybeSingle();
  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

  const { data, error } = await admin
    .from("restaurant_riders")
    .insert({ branch_id, name: name.trim(), phone: phone?.trim() || null })
    .select("id, name, phone, branch_id, is_active")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ rider: data });
}

/** Deactivate a rider (soft — riders already tied to past orders keep the reference). */
export async function DELETE(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rider_id } = await req.json();
  if (!rider_id) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("restaurant_riders")
    .update({ is_active: false })
    .eq("id", rider_id)
    .in("branch_id",
      // Scope the update to riders whose branch belongs to this tenant —
      // an update with no matching row (wrong tenant) simply affects
      // nothing rather than needing a separate ownership query first.
      (await admin.from("restaurant_branches").select("id").eq("tenant_id", tenantId)).data?.map(b => b.id) ?? [],
    )
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Rider not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
