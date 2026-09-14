import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { requireModule } from "@/lib/modules/resolve-modules";

/** Create a reservation from the dashboard (staff-entered, e.g. a phone booking). */
export async function POST(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requireModule(tenantId, "pos"))) {
    return NextResponse.json({ error: "Reservations are not available on your plan" }, { status: 403 });
  }

  const { branch_id, customer_name, customer_phone, party_size, reserved_at, notes } = await req.json();
  if (!branch_id || !customer_name?.trim() || !customer_phone?.trim() || !party_size || !reserved_at) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const admin = await createAdminClient();
  const { data: branch } = await admin
    .from("restaurant_branches").select("id").eq("id", branch_id).eq("tenant_id", tenantId).maybeSingle();
  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

  const { data, error } = await admin
    .from("restaurant_reservations")
    .insert({
      tenant_id: tenantId, branch_id,
      customer_name: customer_name.trim(), customer_phone: customer_phone.trim(),
      party_size: Number(party_size), reserved_at, notes: notes?.trim() || null,
      status: "confirmed", // staff entering it directly means it's already confirmed, unlike a public request
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ reservation: data });
}

/** Update a reservation's status (confirm/cancel/complete/no-show) or details. */
export async function PATCH(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requireModule(tenantId, "pos"))) {
    return NextResponse.json({ error: "Reservations are not available on your plan" }, { status: 403 });
  }

  const { reservation_id, ...patch } = await req.json();
  if (!reservation_id) return NextResponse.json({ error: "Missing reservation_id" }, { status: 400 });

  const allowed: Record<string, unknown> = {};
  const validStatuses = ["pending", "confirmed", "cancelled", "completed", "no_show"];
  if (typeof patch.status === "string" && validStatuses.includes(patch.status)) allowed.status = patch.status;
  if (typeof patch.party_size === "number") allowed.party_size = patch.party_size;
  if (typeof patch.reserved_at === "string") allowed.reserved_at = patch.reserved_at;
  if (typeof patch.notes === "string") allowed.notes = patch.notes.trim() || null;

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("restaurant_reservations")
    .update(allowed)
    .eq("id", reservation_id)
    .eq("tenant_id", tenantId)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  return NextResponse.json({ reservation: data });
}

/** Public reservation request form (e.g. embedded on the tenant's site) — always lands as 'pending' for staff to confirm. */
export async function PUT(req: NextRequest) {
  const { tenant_slug, branch_id, customer_name, customer_phone, party_size, reserved_at, notes } = await req.json();
  if (!tenant_slug || !branch_id || !customer_name?.trim() || !customer_phone?.trim() || !party_size || !reserved_at) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const admin = await createAdminClient();
  const { data: tenant } = await admin.from("tenants").select("id").eq("slug", tenant_slug).maybeSingle();
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: branch } = await admin
    .from("restaurant_branches").select("id").eq("id", branch_id).eq("tenant_id", tenant.id).maybeSingle();
  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

  const { error } = await admin.from("restaurant_reservations").insert({
    tenant_id: tenant.id, branch_id,
    customer_name: customer_name.trim(), customer_phone: customer_phone.trim(),
    party_size: Number(party_size), reserved_at, notes: notes?.trim() || null,
    status: "pending",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
