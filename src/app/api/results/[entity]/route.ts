import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { canWriteSite } from "@/lib/auth/site-write";
import { slugify } from "@/lib/real-estate/format";

/** Dashboard CRUD for the results module. RLS (migration 140) is the real
 *  guard — editors write, members read; this route scopes to the caller's
 *  tenant and whitelists columns per entity. */
const ENTITIES = {
  results: {
    table: "results",
    order: "created_at",
    select: "*, course:results_courses(name, slug, page_url)",
    fields: [
      "certificate_no", "roll", "student_name", "father_name", "mother_name", "result", "course_id", "course_name",
      "photo_url", "dob", "gender", "passport_no", "issue_date", "duration", "notes", "status",
      "alumni_featured", "alumni_position", "alumni_location", "alumni_quote",
    ],
    required: "student_name",
  },
  courses: {
    table: "results_courses",
    order: "sort_order",
    select: "*",
    fields: ["name", "slug", "code", "level", "duration", "summary", "image_url", "page_url", "featured", "sort_order"],
    required: "name",
  },
} as const;

type EntityKey = keyof typeof ENTITIES;
const resolve = (e: string) => (e in ENTITIES ? ENTITIES[e as EntityKey] : null);

function pick(fields: readonly string[], body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (!(f in body)) continue;
    let v = body[f];
    if (typeof v === "string") v = v.trim();
    if (v === "") v = null;
    if (f === "sort_order" && v != null) v = Number(v) || 0;
    out[f] = v;
  }
  return out;
}

type Ctx = { params: Promise<{ entity: string }> };

async function guard(write: boolean) {
  const tenantId = await apiTenantId();
  if (!tenantId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (write && !(await canWriteSite(tenantId))) return { error: NextResponse.json({ error: "Your role can't make changes on this site." }, { status: 403 }) };
  return { tenantId };
}

function dbError(error: { code?: string; message: string }, entity: string) {
  if (error.code === "23505") return entity === "results" ? "A result with that certificate number already exists." : "That URL slug is already used — change the slug.";
  return error.message;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const cfg = resolve((await params).entity);
  if (!cfg) return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  const g = await guard(false);
  if (g.error) return g.error;
  const supabase = await createClient();
  const { data, error } = await supabase.from(cfg.table).select(cfg.select).eq("tenant_id", g.tenantId)
    .order(cfg.order, { ascending: cfg.order !== "created_at" }).limit(10000);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const entity = (await params).entity;
  const cfg = resolve(entity);
  if (!cfg) return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  const g = await guard(true);
  if (g.error) return g.error;
  const row = pick(cfg.fields, await req.json().catch(() => ({})));
  if (!row[cfg.required]) return NextResponse.json({ error: `${cfg.required.replace("_", " ")} is required` }, { status: 400 });
  if (entity === "results" && !row.certificate_no) return NextResponse.json({ error: "Certificate number is required" }, { status: 400 });
  if (entity === "courses") row.slug = slugify(String(row.slug ?? "") || String(row.name));
  const supabase = await createClient();
  const { data, error } = await supabase.from(cfg.table).insert({ ...row, tenant_id: g.tenantId }).select(cfg.select).single();
  if (error) return NextResponse.json({ error: dbError(error, entity) }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const entity = (await params).entity;
  const cfg = resolve(entity);
  if (!cfg) return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  const g = await guard(true);
  if (g.error) return g.error;
  const body = await req.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const patch = pick(cfg.fields, body);
  if (entity === "courses" && patch.slug) patch.slug = slugify(String(patch.slug));
  if (entity === "results") patch.updated_at = new Date().toISOString();
  const supabase = await createClient();
  const { data, error } = await supabase.from(cfg.table).update(patch).eq("id", body.id).eq("tenant_id", g.tenantId).select(cfg.select).single();
  if (error) return NextResponse.json({ error: dbError(error, entity) }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const cfg = resolve((await params).entity);
  if (!cfg) return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  const g = await guard(true);
  if (g.error) return g.error;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const supabase = await createClient();
  const { error } = await supabase.from(cfg.table).delete().eq("id", id).eq("tenant_id", g.tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
