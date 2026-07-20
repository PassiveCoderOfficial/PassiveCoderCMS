import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/** GET — public vendor directory: approved vendors grouped with the service
 *  categories they cover (name only, not price/phone — those stay inside
 *  the booking flow, not exposed to anonymous browsers). */
export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("vendors")
    .select(`
      id, name, address,
      vendor_services!inner(
        subcategory_id,
        service_subcategories(id, name, category_id, service_categories(id, name, icon))
      )
    `)
    .eq("tenant_id", tenantId)
    .eq("status", "approved")
    .eq("vendor_services.active", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const vendors = (data ?? []).map((v) => {
    const categoryMap = new Map<string, { id: string; name: string; icon: string | null }>();
    for (const vs of v.vendor_services as unknown as Array<{ service_subcategories: { category_id: string; service_categories: { id: string; name: string; icon: string | null } } }>) {
      const cat = vs.service_subcategories?.service_categories;
      if (cat && !categoryMap.has(cat.id)) categoryMap.set(cat.id, cat);
    }
    return { id: v.id, name: v.name, address: v.address, categories: Array.from(categoryMap.values()) };
  });

  return NextResponse.json({ vendors });
}
