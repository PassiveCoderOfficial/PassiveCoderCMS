import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { currentVendor } from "@/lib/marketplace-ecom/vendor-auth";
import { cleanVoucherInput, listVouchers } from "@/lib/marketplace-ecom/voucher-admin";

/** Seller: shop vouchers, funded by the seller (reduce their revenue). */
export async function GET() {
  const v = await currentVendor();
  if (!v) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await createAdminClient();
  return NextResponse.json({ vouchers: await listVouchers(admin, v.tenant_id, v.vendor_id) });
}

export async function POST(req: NextRequest) {
  const v = await currentVendor();
  if (!v) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const c = cleanVoucherInput(await req.json().catch(() => ({})), true);
  if ("error" in c) return NextResponse.json({ error: c.error }, { status: 400 });
  const admin = await createAdminClient();
  const { error } = await admin.from("vouchers").insert({ ...c.row, tenant_id: v.tenant_id, vendor_id: v.vendor_id });
  if (error) return NextResponse.json({ error: error.code === "23505" ? "That code is already taken" : error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const v = await currentVendor();
  if (!v) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (b.status !== "active" && b.status !== "paused") return NextResponse.json({ error: "Bad status" }, { status: 400 });
  const admin = await createAdminClient();
  await admin.from("vouchers").update({ status: b.status }).eq("id", b.id).eq("vendor_id", v.vendor_id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const v = await currentVendor();
  if (!v) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  const admin = await createAdminClient();
  await admin.from("vouchers").delete().eq("id", id).eq("vendor_id", v.vendor_id).eq("used_count", 0);
  await admin.from("vouchers").update({ status: "paused" }).eq("id", id).eq("vendor_id", v.vendor_id);
  return NextResponse.json({ ok: true });
}
