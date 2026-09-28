import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { cleanVoucherInput, listVouchers } from "@/lib/marketplace-ecom/voucher-admin";

/** Store admin: platform-funded vouchers (vendor_id null). */
export async function GET() {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await createAdminClient();
  return NextResponse.json({ vouchers: await listVouchers(admin, tenantId, null) });
}

export async function POST(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const c = cleanVoucherInput(await req.json().catch(() => ({})), false);
  if ("error" in c) return NextResponse.json({ error: c.error }, { status: 400 });
  const admin = await createAdminClient();
  const { error } = await admin.from("vouchers").insert({ ...c.row, tenant_id: tenantId, vendor_id: null });
  if (error) return NextResponse.json({ error: error.code === "23505" ? "That code is already taken" : error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

/** Pause/resume, or edit. */
export async function PATCH(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const admin = await createAdminClient();
  const patch: Record<string, unknown> = {};
  if (b.status === "active" || b.status === "paused") patch.status = b.status;
  const { error } = await admin.from("vouchers").update(patch).eq("id", b.id).eq("tenant_id", tenantId).is("vendor_id", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  const admin = await createAdminClient();
  await admin.from("vouchers").delete().eq("id", id).eq("tenant_id", tenantId).is("vendor_id", null).eq("used_count", 0);
  // Used vouchers are paused instead of deleted, so redemption history stays intact.
  await admin.from("vouchers").update({ status: "paused" }).eq("id", id).eq("tenant_id", tenantId).is("vendor_id", null);
  return NextResponse.json({ ok: true });
}
