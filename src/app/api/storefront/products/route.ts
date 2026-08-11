import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const PAGE_SIZE = 24;

/** Public catalog. Only active, approved listings from approved vendors are
 *  ever returned — the same guarantee products_public_read makes at the RLS
 *  layer, restated here because this route reads with the service role. */
export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Unknown store" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category")?.trim();
  const vendor = searchParams.get("vendor")?.trim();
  const sort = searchParams.get("sort") ?? "new";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const min = searchParams.get("min");
  const max = searchParams.get("max");

  const admin = await createAdminClient();
  let query = admin
    .from("products")
    .select(
      "id, name, slug, price, compare_price, images, stock_quantity, track_inventory, featured, category_ids, vendor_id, vendors!inner(id, name, slug, status, rating)",
      { count: "exact" },
    )
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .eq("approval_status", "approved")
    .eq("vendors.status", "approved");

  if (q) query = query.ilike("name", `%${q}%`);
  if (vendor) query = query.eq("vendors.slug", vendor);
  if (category) query = query.contains("category_ids", JSON.stringify([category]));
  if (min) query = query.gte("price", Number(min));
  if (max) query = query.lte("price", Number(max));

  if (sort === "price_asc") query = query.order("price", { ascending: true });
  else if (sort === "price_desc") query = query.order("price", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const from = (page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    products: data ?? [],
    page,
    page_size: PAGE_SIZE,
    total: count ?? 0,
    has_more: (count ?? 0) > from + PAGE_SIZE,
  });
}
