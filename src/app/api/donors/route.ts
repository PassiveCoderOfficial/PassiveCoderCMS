import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getDonorSession, normalizeBdPhone } from "@/lib/donors/auth";
import { availabilityOf, ageOf } from "@/lib/donors/availability";
import { BLOOD_GROUPS, BD_DISTRICTS, RELIGIONS, GENDERS } from "@/lib/donors/bd-locations";
import { normalizeSocials } from "@/lib/donors/socials";
import { geocodeBdArea } from "@/lib/donors/geocode";

const PAGE_SIZE = 20;

const PUBLIC_FIELDS =
  "id, name, blood_group, gender, religion, district, police_station, area, birthdate, age_years, last_donated_on, never_donated, is_available, is_claimed, created_at, photo_url, lat, lng";

// Ready-first ordering so eligible donors surface, but randomized within each
// tier so older/less-recent entries still get exposure on each page load.
const TIER_RANK: Record<string, number> = { ready: 0, soon: 1, unknown: 2, not_ready: 3, unavailable: 4 };

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Public list with filters — no phone numbers in the list payload. */
export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const sp = new URL(req.url).searchParams;
  const page = Math.max(0, parseInt(sp.get("page") ?? "0", 10) || 0);
  const hasBounds = sp.has("sw_lat") && sp.has("sw_lng") && sp.has("ne_lat") && sp.has("ne_lng");

  const supabase = await createAdminClient();
  // Fetch the full matching set (capped) — availability, ready-first
  // ordering, radius distance and random shuffle are all computed in-app, so
  // we can't lean on SQL LIMIT/OFFSET for the visible page. Community
  // directories are small enough that this is fine.
  let q = supabase.from("donors")
    .select(PUBLIC_FIELDS, { count: "exact" })
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .limit(3000);

  const group = sp.get("blood_group");
  if (group && (BLOOD_GROUPS as readonly string[]).includes(group)) q = q.eq("blood_group", group);
  const district = sp.get("district");
  if (district) q = q.eq("district", district);
  const ps = sp.get("police_station");
  if (ps) q = q.eq("police_station", ps);
  const gender = sp.get("gender");
  if (gender && (GENDERS as readonly string[]).includes(gender)) q = q.eq("gender", gender);
  const religion = sp.get("religion");
  if (religion && (RELIGIONS as readonly string[]).includes(religion)) q = q.eq("religion", religion);
  const area = sp.get("area");
  if (area) q = q.ilike("area", `%${area}%`);
  const search = sp.get("q");
  if (search) q = q.or(`name.ilike.%${search}%,area.ilike.%${search}%`);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  let donors = (data ?? []).map((d) => ({
    ...d,
    age: ageOf(d.birthdate, d.age_years),
    availability: availabilityOf(d.last_donated_on, d.is_available, d.never_donated),
    _rand: Math.random(),
    birthdate: undefined,
  }));

  // Availability filter is computed, so filter after fetch
  const avail = sp.get("availability");
  if (avail && ["ready", "soon", "not_ready", "unknown", "unavailable"].includes(avail)) {
    donors = donors.filter((d) => d.availability === avail);
  }

  // Map viewport bounds — filters to donors visible in the current map frame,
  // but ALWAYS keeps donors that have no coordinates (a donor without a pin
  // must never silently disappear from the list). Done post-fetch so the
  // null-coord donors survive.
  if (hasBounds) {
    const swLat = parseFloat(sp.get("sw_lat")!), swLng = parseFloat(sp.get("sw_lng")!);
    const neLat = parseFloat(sp.get("ne_lat")!), neLng = parseFloat(sp.get("ne_lng")!);
    const loLat = Math.min(swLat, neLat), hiLat = Math.max(swLat, neLat);
    const loLng = Math.min(swLng, neLng), hiLng = Math.max(swLng, neLng);
    donors = donors.filter((d) =>
      d.lat == null || d.lng == null ||
      (d.lat >= loLat && d.lat <= hiLat && d.lng >= loLng && d.lng <= hiLng),
    );
  }

  // GPS radius filter (?lat=&lng=&radius_km=) — Haversine distance, then sort
  // nearest-first (distance beats the ready-first ordering when searching by
  // location — closeness is what matters there).
  const lat = parseFloat(sp.get("lat") ?? "");
  const lng = parseFloat(sp.get("lng") ?? "");
  const radiusKm = parseFloat(sp.get("radius_km") ?? "");
  let sorted;
  if (!isNaN(lat) && !isNaN(lng) && !isNaN(radiusKm)) {
    sorted = donors
      .filter((d) => d.lat != null && d.lng != null)
      .map((d) => ({ ...d, distance_km: Math.round(haversineKm(lat, lng, d.lat as number, d.lng as number) * 10) / 10 }))
      .filter((d) => d.distance_km <= radiusKm)
      .sort((a, b) => a.distance_km - b.distance_km);
  } else {
    // Ready donors first, random within each availability tier so older
    // entries still get shown across page loads.
    sorted = donors.sort((a, b) => {
      const t = (TIER_RANK[a.availability] ?? 9) - (TIER_RANK[b.availability] ?? 9);
      return t !== 0 ? t : a._rand - b._rand;
    });
  }

  const total = sorted.length;
  const start = page * PAGE_SIZE;
  const pageItems = sorted.slice(start, start + PAGE_SIZE).map(({ _rand, ...rest }) => rest);

  return NextResponse.json({ donors: pageItems, total, pageSize: PAGE_SIZE, page });
}

/** Create a donor entry — requires a logged-in donor account. */
export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const me = await getDonorSession(tenantId);
  if (!me) return NextResponse.json({ error: "login_required" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const phone = normalizeBdPhone(body.phone);
  if (!body.name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "Enter a valid 11-digit number (01XXXXXXXXX)" }, { status: 400 });
  if (!(BLOOD_GROUPS as readonly string[]).includes(body.blood_group)) {
    return NextResponse.json({ error: "Pick a blood group" }, { status: 400 });
  }
  if (body.district && !BD_DISTRICTS.includes(body.district)) {
    return NextResponse.json({ error: "Unknown district" }, { status: 400 });
  }

  const whatsapp = body.same_whatsapp ? phone : normalizeBdPhone(body.whatsapp) ?? phone;

  // No map pin? Geocode the area/thana/district so the donor still lands on
  // the map and isn't hidden by map-viewport filtering.
  let lat = typeof body.lat === "number" ? body.lat : null;
  let lng = typeof body.lng === "number" ? body.lng : null;
  if (lat == null || lng == null) {
    const geo = await geocodeBdArea({ area: body.area, police_station: body.police_station, district: body.district });
    if (geo) { lat = geo.lat; lng = geo.lng; }
  }

  const supabase = await createAdminClient();
  const { data, error } = await supabase.from("donors")
    .insert({
      tenant_id: tenantId,
      name: body.name.trim(),
      phone,
      whatsapp,
      blood_group: body.blood_group,
      gender: (GENDERS as readonly string[]).includes(body.gender) ? body.gender : null,
      religion: (RELIGIONS as readonly string[]).includes(body.religion) ? body.religion : null,
      district: body.district || null,
      police_station: body.police_station || null,
      area: body.area?.trim() || null,
      birthdate: body.birthdate || null,
      age_years: body.age_years ? Number(body.age_years) : null,
      last_donated_on: body.last_donated_on || null,
      never_donated: !!body.never_donated,
      lat, lng,
      socials: normalizeSocials(body.socials),
      created_by: me.id,
    })
    .select("id")
    .single();

  if (error) {
    const msg = error.code === "23505"
      ? "A donor with this phone number already exists" : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
