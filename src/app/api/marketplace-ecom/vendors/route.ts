import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Ecommerce sellers for this tenant. Filtered on the `ecommerce` capability
 *  so the service-booking vendors sharing this table stay out of the way. */
export async function GET() {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("vendors")
    .select(
      "id, name, slug, contact_name, phone, email, status, commission_rate, logo, description, bkash_number, payout_hold_days, trade_license, pickup_address, pickup_area, rating, created_at",
    )
    .eq("tenant_id", tenantId)
    .contains("capabilities", ["ecommerce"])
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "Shop name required" }, { status: 400 });

  const admin = await createAdminClient();
  const base = slugify(body.slug || body.name);

  // Slug is unique per tenant and drives the public /shop/<slug> URL, so
  // collisions get a numeric suffix rather than failing the insert.
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const { data: clash } = await admin
      .from("vendors")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("slug", slug)
      .maybeSingle();
    if (!clash) break;
    slug = `${base}-${i}`;
  }

  const { data, error } = await admin
    .from("vendors")
    .insert({
      tenant_id: tenantId,
      name: body.name.trim(),
      slug,
      capabilities: ["ecommerce"],
      contact_name: body.contact_name?.trim() || null,
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      description: body.description?.trim() || null,
      address: body.address?.trim() || null,
      pickup_address: body.pickup_address?.trim() || null,
      pickup_area: body.pickup_area?.trim() || null,
      bkash_number: body.bkash_number?.trim() || null,
      trade_license: body.trade_license?.trim() || null,
      nid_number: body.nid_number?.trim() || null,
      commission_rate: body.commission_rate != null && body.commission_rate !== ""
        ? Number(body.commission_rate)
        : 15.0,
      status: body.status === "approved" ? "approved" : "pending",
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...fields } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of [
    "name", "slug", "contact_name", "phone", "email", "description", "address",
    "pickup_address", "pickup_area", "bkash_number", "trade_license", "nid_number",
    "commission_rate", "status", "logo", "banner", "payout_hold_days", "notes",
  ] as const) {
    if (key in fields) patch[key] = fields[key];
  }

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("vendors")
    .update(patch)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
