import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { canWriteSite } from "@/lib/auth/site-write";
import { slugify } from "@/lib/real-estate/format";

/** Dashboard CRUD for the real estate module. RLS (migration 112) is the
 *  real guard — editors write, members read; this route only scopes to the
 *  caller's tenant and whitelists columns per entity. */
const ENTITIES = {
  properties: {
    table: "re_properties",
    order: "sort_order",
    select: "*, community:re_communities(name, slug), developer:re_developers(name, slug, logo_url)",
    fields: [
      "slug", "title", "listing_type", "property_type", "status", "price", "price_max", "price_period",
      "price_on_request", "currency", "beds", "beds_max", "baths", "area", "area_unit", "community_id",
      "developer_id", "city", "country", "address", "lat", "lng", "furnishing", "handover", "payment_plan",
      "amenities", "highlights", "images", "floor_plans", "brochure_url", "video_url", "tour_url", "summary",
      "description", "permit_number", "reference", "featured", "sort_order", "seo_title", "seo_description",
    ],
    slugFrom: "title",
  },
  communities: {
    table: "re_communities",
    order: "sort_order",
    select: "*",
    fields: [
      "name", "slug", "city", "country", "image_url", "summary", "description", "highlights", "avg_price",
      "currency", "rental_yield", "lat", "lng", "featured", "sort_order",
    ],
    slugFrom: "name",
  },
  developers: {
    table: "re_developers",
    order: "sort_order",
    select: "*",
    fields: ["name", "slug", "logo_url", "description", "website", "sort_order"],
    slugFrom: "name",
  },
  leads: {
    table: "re_leads",
    order: "created_at",
    select: "*, property:re_properties(title, slug)",
    fields: ["status", "message"],
    slugFrom: null,
  },
} as const;

type EntityKey = keyof typeof ENTITIES;

function resolve(entity: string) {
  return (entity in ENTITIES ? ENTITIES[entity as EntityKey] : null);
}

const NUMERIC = new Set(["price", "price_max", "beds", "beds_max", "baths", "area", "lat", "lng", "avg_price", "rental_yield", "sort_order"]);

function pick(fields: readonly string[], body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (!(f in body)) continue;
    let v = body[f];
    if (typeof v === "string") v = v.trim();
    if (v === "") v = null;
    if (NUMERIC.has(f) && v != null) {
      const n = Number(v);
      v = Number.isFinite(n) ? n : null;
    }
    out[f] = v;
  }
  return out;
}

type Ctx = { params: Promise<{ entity: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const cfg = resolve((await params).entity);
  if (!cfg) return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from(cfg.table).select(cfg.select).eq("tenant_id", tenantId)
    .order(cfg.order, { ascending: cfg.order !== "created_at" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const cfg = resolve((await params).entity);
  if (!cfg || !cfg.slugFrom) return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canWriteSite(tenantId))) return NextResponse.json({ error: "Your role can't make changes on this site." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const row = pick(cfg.fields, body);
  const label = String(row[cfg.slugFrom] ?? "").trim();
  if (!label) return NextResponse.json({ error: `${cfg.slugFrom} is required` }, { status: 400 });
  row.slug = slugify(String(row.slug ?? "") || label);

  const supabase = await createClient();
  const { data, error } = await supabase.from(cfg.table).insert({ ...row, tenant_id: tenantId }).select(cfg.select).single();
  if (error) {
    const msg = error.code === "23505" ? "That URL slug is already used — change the slug." : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const cfg = resolve((await params).entity);
  if (!cfg) return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canWriteSite(tenantId))) return NextResponse.json({ error: "Your role can't make changes on this site." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const patch = pick(cfg.fields, body);
  if ("slug" in patch && patch.slug) patch.slug = slugify(String(patch.slug));
  if (cfg.table === "re_properties") patch.updated_at = new Date().toISOString();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from(cfg.table).update(patch).eq("id", body.id).eq("tenant_id", tenantId).select(cfg.select).single();
  if (error) {
    const msg = error.code === "23505" ? "That URL slug is already used — change the slug." : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const cfg = resolve((await params).entity);
  if (!cfg) return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canWriteSite(tenantId))) return NextResponse.json({ error: "Your role can't make changes on this site." }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const supabase = await createClient();
  const { error } = await supabase.from(cfg.table).delete().eq("id", id).eq("tenant_id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
