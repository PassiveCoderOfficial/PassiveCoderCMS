import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const PUBLIC_COLS =
  "id, slug, title, listing_type, property_type, status, price, price_max, price_period, price_on_request, currency, beds, beds_max, baths, area, area_unit, city, country, handover, images, featured, summary, lat, lng, community:re_communities(name, slug), developer:re_developers(name, slug, logo_url)";

/**
 * GET /api/real-estate/public?resource=properties|communities|developers|meta
 * Public catalogue for the storefront blocks, scoped by the subdomain-injected
 * tenant header. Drafts are never returned. Properties accept filters:
 * type (sale|rent|offplan), ptype, community, developer, city, beds (min),
 * minPrice, maxPrice (in the listing's own currency), q, featured, sort, limit.
 */
export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const sp = new URL(req.url).searchParams;
  const resource = sp.get("resource") ?? "properties";
  const admin = await createAdminClient();

  if (resource === "communities") {
    let q = admin.from("re_communities")
      .select("id, name, slug, city, country, image_url, summary, avg_price, currency, rental_yield, featured")
      .eq("tenant_id", tenantId).order("sort_order");
    if (sp.get("featured") === "1") q = q.eq("featured", true);
    if (sp.get("country")) q = q.eq("country", sp.get("country")!);
    const { data } = await q;
    // Live listing counts per community, for the "24 properties" badge.
    const { data: counts } = await admin.from("re_properties").select("community_id")
      .eq("tenant_id", tenantId).neq("status", "draft");
    const tally = new Map<string, number>();
    for (const r of counts ?? []) if (r.community_id) tally.set(r.community_id, (tally.get(r.community_id) ?? 0) + 1);
    return NextResponse.json((data ?? []).map((c) => ({ ...c, listings: tally.get(c.id) ?? 0 })));
  }

  if (resource === "developers") {
    const { data } = await admin.from("re_developers")
      .select("id, name, slug, logo_url, description, website")
      .eq("tenant_id", tenantId).order("sort_order");
    return NextResponse.json(data ?? []);
  }

  if (resource === "meta") {
    const [{ data: communities }, { data: developers }, { data: settings }, { data: types }] = await Promise.all([
      admin.from("re_communities").select("name, slug, city").eq("tenant_id", tenantId).order("sort_order"),
      admin.from("re_developers").select("name, slug").eq("tenant_id", tenantId).order("sort_order"),
      admin.from("re_settings").select("agent_name, whatsapp, phone, default_currency, default_area_unit, brochure_gate").eq("tenant_id", tenantId).maybeSingle(),
      admin.from("re_properties").select("property_type").eq("tenant_id", tenantId).neq("status", "draft"),
    ]);
    const propertyTypes = Array.from(new Set((types ?? []).map((t) => t.property_type))).sort();
    return NextResponse.json({ communities: communities ?? [], developers: developers ?? [], settings, propertyTypes });
  }

  let q = admin.from("re_properties").select(PUBLIC_COLS, { count: "exact" })
    .eq("tenant_id", tenantId).neq("status", "draft");

  const type = sp.get("type");
  if (type === "sale" || type === "rent" || type === "offplan") q = q.eq("listing_type", type);
  if (sp.get("ptype")) q = q.eq("property_type", sp.get("ptype")!);
  if (sp.get("city")) q = q.ilike("city", sp.get("city")!);
  if (sp.get("featured") === "1") q = q.eq("featured", true);
  const beds = sp.get("beds");
  if (beds !== null && beds !== "" && Number.isFinite(Number(beds))) q = q.or(`beds.gte.${Number(beds)},beds_max.gte.${Number(beds)}`);
  const minP = Number(sp.get("minPrice"));
  const maxP = Number(sp.get("maxPrice"));
  if (sp.get("minPrice") && Number.isFinite(minP)) q = q.gte("price", minP);
  if (sp.get("maxPrice") && Number.isFinite(maxP)) q = q.lte("price", maxP);
  const text = (sp.get("q") ?? "").replace(/[%,()]/g, " ").trim();
  if (text) q = q.or(`title.ilike.%${text}%,city.ilike.%${text}%,address.ilike.%${text}%`);

  for (const [param, table] of [["community", "re_communities"], ["developer", "re_developers"]] as const) {
    const slug = sp.get(param);
    if (!slug) continue;
    const { data: ref } = await admin.from(table).select("id").eq("tenant_id", tenantId).eq("slug", slug).maybeSingle();
    if (!ref) return NextResponse.json({ items: [], total: 0 });
    q = q.eq(param === "community" ? "community_id" : "developer_id", ref.id);
  }

  switch (sp.get("sort")) {
    case "price_asc": q = q.order("price", { ascending: true, nullsFirst: false }); break;
    case "price_desc": q = q.order("price", { ascending: false, nullsFirst: false }); break;
    case "newest": q = q.order("created_at", { ascending: false }); break;
    default: q = q.order("featured", { ascending: false }).order("sort_order").order("created_at", { ascending: false });
  }

  const limit = Math.min(Math.max(Number(sp.get("limit")) || 12, 1), 60);
  const page = Math.max(Number(sp.get("page")) || 1, 1);
  q = q.range((page - 1) * limit, page * limit - 1);

  const { data, count, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ items: data ?? [], total: count ?? 0 });
}
