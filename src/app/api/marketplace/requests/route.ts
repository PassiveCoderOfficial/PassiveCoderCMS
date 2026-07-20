import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

const ARCHIVE_AFTER_MS = 24 * 60 * 60 * 1000;

/** GET ?status=open|claimed|fulfilled|cancelled|all — admin list of service
 *  requests. Lazily archives fulfilled/cancelled requests older than 24h,
 *  same approach as blood_requests GET (no cron needed for this part). */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();
  const cutoff = new Date(Date.now() - ARCHIVE_AFTER_MS).toISOString();
  await admin.from("service_requests")
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .in("status", ["fulfilled", "cancelled"])
    .lt("updated_at", cutoff);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "open";

  let q = supabase
    .from("service_requests")
    .select("*, service_subcategories(id, name), vendors:claimed_by_vendor_id(id, name, phone)")
    .eq("tenant_id", tenantId)
    .order("urgency", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(300);
  if (status !== "all") q = q.eq("status", status);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

/** PATCH — claim (assign claimed_by_vendor_id), fulfill, or cancel a request. */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...fields } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if ("claimed_by_vendor_id" in fields) {
    patch.claimed_by_vendor_id = fields.claimed_by_vendor_id || null;
    patch.claimed_at = fields.claimed_by_vendor_id ? new Date().toISOString() : null;
    if (fields.claimed_by_vendor_id && !("status" in fields)) patch.status = "claimed";
  }
  if ("status" in fields) {
    if (!["open", "claimed", "fulfilled", "cancelled"].includes(fields.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    patch.status = fields.status;
  }
  for (const key of ["description", "address", "customer_name", "customer_phone", "radius_km"] as const) {
    if (key in fields) patch[key] = fields[key];
  }

  const { data, error } = await supabase
    .from("service_requests")
    .update(patch)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select("*, service_subcategories(id, name), vendors:claimed_by_vendor_id(id, name, phone)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
