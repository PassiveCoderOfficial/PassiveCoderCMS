import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

export async function GET() {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase.from("products")
    .select("id, name, sku, status, price, track_inventory, stock_quantity, low_stock_threshold, images")
    .eq("tenant_id", tenantId)
    .order("name");
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...fields } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ("stock_quantity" in fields) patch.stock_quantity = Math.max(0, Number(fields.stock_quantity) || 0);
  if ("low_stock_threshold" in fields) patch.low_stock_threshold = Math.max(0, Number(fields.low_stock_threshold) || 0);
  if ("track_inventory" in fields) patch.track_inventory = !!fields.track_inventory;

  const { data, error } = await supabase.from("products")
    .update(patch).eq("id", id).eq("tenant_id", tenantId)
    .select("id, name, sku, status, price, track_inventory, stock_quantity, low_stock_threshold, images")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
