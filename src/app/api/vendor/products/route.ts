import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { currentVendor } from "@/lib/marketplace-ecom/vendor-auth";

/** Fields a vendor may set on their own listing. Anything outside this list —
 *  approval_status above all — is decided by the platform, not the seller. */
const EDITABLE = [
  "name",
  "description",
  "short_description",
  "price",
  "compare_price",
  "sku",
  "stock_quantity",
  "track_inventory",
  "low_stock_threshold",
  "weight",
  "images",
  "category_ids",
  "attributes",
  "brand",
] as const;

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function GET() {
  const vendor = await currentVendor();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("products")
    .select(
      "id, name, slug, price, compare_price, images, stock_quantity, track_inventory, status, approval_status, rejection_reason, category_ids, created_at",
    )
    .eq("vendor_id", vendor.vendor_id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const vendor = await currentVendor();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const row: Record<string, unknown> = {
    tenant_id: vendor.tenant_id,
    vendor_id: vendor.vendor_id,
    name: body.name.trim(),
    // Slug is globally unique on products, so it carries the vendor prefix to
    // keep two sellers listing "Cotton Panjabi" from colliding.
    slug: `${vendor.slug ?? vendor.vendor_id.slice(0, 6)}-${slugify(body.name)}-${Date.now().toString(36)}`,
    status: "draft",
    approval_status: "pending",
    price: Number(body.price ?? 0),
  };
  for (const key of EDITABLE) {
    if (key in body && key !== "name") row[key] = body[key];
  }

  const admin = await createAdminClient();
  const { data, error } = await admin.from("products").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const vendor = await currentVendor();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const { id, ...fields } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of EDITABLE) if (key in fields) patch[key] = fields[key];

  // A vendor may pull their own listing off sale or put an approved one back,
  // but re-approval is the platform's call.
  if (fields.status === "draft" || fields.status === "active") patch.status = fields.status;

  const admin = await createAdminClient();
  const { data: existing } = await admin
    .from("products")
    .select("approval_status")
    .eq("id", id)
    .eq("vendor_id", vendor.vendor_id)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  // Editing a rejected listing sends it back to the review queue rather than
  // leaving it stuck as rejected forever.
  if (existing.approval_status === "rejected") {
    patch.approval_status = "pending";
    patch.rejection_reason = null;
  }

  const { data, error } = await admin
    .from("products")
    .update(patch)
    .eq("id", id)
    .eq("vendor_id", vendor.vendor_id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const vendor = await currentVendor();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = await createAdminClient();
  const { error } = await admin
    .from("products")
    .delete()
    .eq("id", id)
    .eq("vendor_id", vendor.vendor_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
