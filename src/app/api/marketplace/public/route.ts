import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/** GET — public catalog for the storefront booking block: categories with
 *  subcategories, and approved vendors offering each subcategory (with price). */
export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const supabase = await createAdminClient();

  const [{ data: categories }, { data: vendorServices }] = await Promise.all([
    supabase
      .from("service_categories")
      .select("id, name, slug, sort_order, icon, service_subcategories(id, name, sort_order)")
      .eq("tenant_id", tenantId)
      .order("sort_order"),
    supabase
      .from("vendor_services")
      .select("subcategory_id, price, vendors!inner(id, name, status)")
      .eq("tenant_id", tenantId)
      .eq("active", true)
      .eq("vendors.status", "approved"),
  ]);

  return NextResponse.json({
    categories: categories ?? [],
    vendorServices: vendorServices ?? [],
  });
}
