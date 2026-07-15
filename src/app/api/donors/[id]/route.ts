import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getDonorSession, normalizeBdPhone, hashPassword, displayBdPhone } from "@/lib/donors/auth";
import { availabilityOf, ageOf } from "@/lib/donors/availability";
import { BLOOD_GROUPS, BD_DISTRICTS, RELIGIONS, GENDERS } from "@/lib/donors/bd-locations";

async function loadDonor(tenantId: string, id: string) {
  const supabase = await createAdminClient();
  const { data } = await supabase.from("donors")
    .select("*").eq("tenant_id", tenantId).eq("id", id).eq("is_active", true).maybeSingle();
  return data;
}

function canManage(donor: { id: string; created_by: string | null; is_claimed: boolean }, meId: string) {
  if (donor.id === meId) return true;                      // own profile
  return !donor.is_claimed && donor.created_by === meId;   // my unclaimed entry
}

/** Public profile — contact details included (that's the point of the site). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const donor = await loadDonor(tenantId, id);
  if (!donor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createAdminClient();
  let submittedBy: { id: string; name: string } | null = null;
  if (donor.created_by) {
    const { data: creator } = await supabase.from("donors")
      .select("id, name").eq("id", donor.created_by).eq("is_active", true).maybeSingle();
    submittedBy = creator ?? null;
  }

  const me = await getDonorSession(tenantId);

  return NextResponse.json({
    donor: {
      id: donor.id,
      name: donor.name,
      phone: displayBdPhone(donor.phone),
      whatsapp: displayBdPhone(donor.whatsapp),
      blood_group: donor.blood_group,
      gender: donor.gender,
      religion: donor.religion,
      district: donor.district,
      police_station: donor.police_station,
      area: donor.area,
      age: ageOf(donor.birthdate, donor.age_years),
      last_donated_on: donor.last_donated_on,
      availability: availabilityOf(donor.last_donated_on),
      is_claimed: donor.is_claimed,
      created_at: donor.created_at,
    },
    submitted_by: submittedBy,
    viewer: me ? { id: me.id, can_manage: canManage(donor, me.id) } : null,
  });
}

/** Edit — profile owner, or creator while unclaimed. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const me = await getDonorSession(tenantId);
  if (!me) return NextResponse.json({ error: "login_required" }, { status: 401 });

  const donor = await loadDonor(tenantId, id);
  if (!donor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManage(donor, me.id)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if ("name" in body && body.name?.trim()) patch.name = body.name.trim();
  if ("blood_group" in body && (BLOOD_GROUPS as readonly string[]).includes(body.blood_group)) patch.blood_group = body.blood_group;
  if ("gender" in body) patch.gender = (GENDERS as readonly string[]).includes(body.gender) ? body.gender : null;
  if ("religion" in body) patch.religion = (RELIGIONS as readonly string[]).includes(body.religion) ? body.religion : null;
  if ("district" in body) patch.district = BD_DISTRICTS.includes(body.district) ? body.district : null;
  if ("police_station" in body) patch.police_station = body.police_station || null;
  if ("area" in body) patch.area = body.area?.trim() || null;
  if ("birthdate" in body) patch.birthdate = body.birthdate || null;
  if ("age_years" in body) patch.age_years = body.age_years ? Number(body.age_years) : null;
  if ("last_donated_on" in body) patch.last_donated_on = body.last_donated_on || null;
  if ("whatsapp" in body) patch.whatsapp = normalizeBdPhone(body.whatsapp);
  if ("phone" in body) {
    const phone = normalizeBdPhone(body.phone);
    if (!phone) return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
    patch.phone = phone;
  }

  const supabase = await createAdminClient();
  const { error } = await supabase.from("donors")
    .update(patch).eq("id", id).eq("tenant_id", tenantId);
  if (error) {
    const msg = error.code === "23505" ? "Another donor already uses this phone number" : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

/**
 * Creator sets a starter password on an unclaimed entry they created —
 * shared offline so the donor can log in and take over.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const me = await getDonorSession(tenantId);
  if (!me) return NextResponse.json({ error: "login_required" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body.action !== "set-password" || !body.password || body.password.length < 6) {
    return NextResponse.json({ error: "6+ character password required" }, { status: 400 });
  }

  const donor = await loadDonor(tenantId, id);
  if (!donor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (donor.is_claimed) return NextResponse.json({ error: "Profile already claimed by its owner" }, { status: 409 });
  if (donor.created_by !== me.id) return NextResponse.json({ error: "Only the creator can set a password" }, { status: 403 });

  const supabase = await createAdminClient();
  await supabase.from("donors").update({
    password_hash: hashPassword(body.password),
    updated_at: new Date().toISOString(),
  }).eq("id", id).eq("tenant_id", tenantId);

  return NextResponse.json({ ok: true });
}
