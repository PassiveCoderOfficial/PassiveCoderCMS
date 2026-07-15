import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getDonorSession, getDonorSettings, normalizeBdPhone, hashPassword, displayBdPhone } from "@/lib/donors/auth";
import { availabilityOf, ageOf } from "@/lib/donors/availability";
import { BLOOD_GROUPS, GENDERS, RELIGIONS, BD_DISTRICTS } from "@/lib/donors/bd-locations";

async function requireAdmin(tenantId: string) {
  const me = await getDonorSession(tenantId);
  if (!me?.is_admin) return null;
  return me;
}

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });
  if (!(await requireAdmin(tenantId))) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim();
  const page = Math.max(0, parseInt(sp.get("page") ?? "0", 10) || 0);

  const supabase = await createAdminClient();
  let query = supabase.from("donors")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .range(page * 30, page * 30 + 29);
  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,area.ilike.%${q}%,district.ilike.%${q}%`);

  const { data, count } = await query;
  const settings = await getDonorSettings(tenantId);

  return NextResponse.json({
    donors: (data ?? []).map(d => ({
      id: d.id, name: d.name,
      phone: displayBdPhone(d.phone), whatsapp: displayBdPhone(d.whatsapp),
      blood_group: d.blood_group, gender: d.gender, religion: d.religion,
      district: d.district, police_station: d.police_station, area: d.area,
      age: ageOf(d.birthdate, d.age_years), birthdate: d.birthdate, age_years: d.age_years,
      last_donated_on: d.last_donated_on, availability: availabilityOf(d.last_donated_on, d.is_available),
      is_available: d.is_available,
      photo_url: d.photo_url, lat: d.lat, lng: d.lng,
      is_claimed: d.is_claimed, is_admin: d.is_admin, is_active: d.is_active,
      has_password: !!d.password_hash, created_at: d.created_at,
    })),
    total: count ?? 0, page, pageSize: 30,
    settings,
  });
}

export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });
  const admin = await requireAdmin(tenantId);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const phone = normalizeBdPhone(body.phone);
  if (!body.name?.trim() || !phone || !(BLOOD_GROUPS as readonly string[]).includes(body.blood_group)) {
    return NextResponse.json({ error: "Name, valid phone and blood group required" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { data, error } = await supabase.from("donors").insert({
    tenant_id: tenantId,
    name: body.name.trim(), phone,
    whatsapp: normalizeBdPhone(body.whatsapp) ?? phone,
    blood_group: body.blood_group,
    gender: (GENDERS as readonly string[]).includes(body.gender) ? body.gender : null,
    religion: (RELIGIONS as readonly string[]).includes(body.religion) ? body.religion : null,
    district: BD_DISTRICTS.includes(body.district) ? body.district : null,
    police_station: body.police_station || null,
    area: body.area?.trim() || null,
    birthdate: body.birthdate || null,
    age_years: body.age_years ? Number(body.age_years) : null,
    last_donated_on: body.last_donated_on || null,
    lat: body.lat ?? null, lng: body.lng ?? null,
    created_by: admin.id,
  }).select("id").single();

  if (error) {
    const msg = error.code === "23505" ? "A donor with this phone already exists" : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });
  const admin = await requireAdmin(tenantId);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const supabase = await createAdminClient();

  // Module settings
  if (body._type === "settings") {
    await supabase.from("donor_settings").upsert({
      tenant_id: tenantId,
      otp_required: !!body.otp_required,
      updated_at: new Date().toISOString(),
    }, { onConflict: "tenant_id" });
    return NextResponse.json({ ok: true });
  }

  // Donor edits (any field, including admin-only flags + password reset)
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ["name", "gender", "religion", "police_station", "area",
                     "birthdate", "age_years", "last_donated_on", "lat", "lng",
                     "is_active", "is_admin", "is_claimed", "is_available"] as const) {
    if (key in fields) patch[key] = fields[key] === "" ? null : fields[key];
  }
  if ("blood_group" in fields && (BLOOD_GROUPS as readonly string[]).includes(fields.blood_group)) {
    patch.blood_group = fields.blood_group;
  }
  if ("district" in fields) patch.district = BD_DISTRICTS.includes(fields.district) ? fields.district : null;
  if ("phone" in fields) {
    const p = normalizeBdPhone(fields.phone);
    if (!p) return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
    patch.phone = p;
  }
  if ("whatsapp" in fields) patch.whatsapp = normalizeBdPhone(fields.whatsapp);
  if ("new_password" in fields && fields.new_password) {
    if (String(fields.new_password).length < 6) {
      return NextResponse.json({ error: "Password too short" }, { status: 400 });
    }
    patch.password_hash = hashPassword(String(fields.new_password));
  }

  const { error } = await supabase.from("donors")
    .update(patch).eq("id", id).eq("tenant_id", tenantId);
  if (error) {
    const msg = error.code === "23505" ? "Another donor already uses this phone" : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });
  const admin = await requireAdmin(tenantId);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (id === admin.id) return NextResponse.json({ error: "You can't delete your own admin account" }, { status: 400 });

  const supabase = await createAdminClient();
  const { error } = await supabase.from("donors")
    .delete().eq("id", id).eq("tenant_id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
