import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getDonorSession } from "@/lib/donors/auth";
import { availabilityOf } from "@/lib/donors/availability";
import { BLOOD_GROUPS } from "@/lib/donors/bd-locations";

/**
 * GET ?what=stats  → donor counts per blood group (group cards)
 * GET ?what=areas  → distinct area names (form suggestions)
 * GET ?what=mine   → entries the logged-in donor created
 */
export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const what = new URL(req.url).searchParams.get("what") ?? "stats";
  const supabase = await createAdminClient();

  if (what === "stats") {
    const { data } = await supabase.from("donors")
      .select("blood_group")
      .eq("tenant_id", tenantId).eq("is_active", true);
    const counts: Record<string, number> = Object.fromEntries(BLOOD_GROUPS.map(g => [g, 0]));
    for (const row of data ?? []) counts[row.blood_group] = (counts[row.blood_group] ?? 0) + 1;
    return NextResponse.json({ counts, total: data?.length ?? 0 });
  }

  if (what === "areas") {
    // Area suggestions are scoped to a district + thana so, e.g., a Savar
    // suggestion never appears while adding a donor in Uttarkhan. Both are
    // required — no district/thana, no suggestions.
    const district = new URL(req.url).searchParams.get("district");
    const ps = new URL(req.url).searchParams.get("police_station");
    if (!district || !ps) return NextResponse.json({ areas: [] });

    const { data } = await supabase.from("donors")
      .select("area")
      .eq("tenant_id", tenantId).eq("is_active", true)
      .eq("district", district).eq("police_station", ps)
      .not("area", "is", null)
      .limit(2000);
    const areas = [...new Set((data ?? []).map(r => (r.area as string).trim()).filter(Boolean))].sort();
    return NextResponse.json({ areas: areas.slice(0, 300) });
  }

  if (what === "mine") {
    const me = await getDonorSession(tenantId);
    if (!me) return NextResponse.json({ error: "login_required" }, { status: 401 });
    const { data } = await supabase.from("donors")
      .select("id, name, blood_group, district, area, last_donated_on, never_donated, is_available, is_claimed, password_hash, created_at")
      .eq("tenant_id", tenantId).eq("created_by", me.id).eq("is_active", true)
      .order("created_at", { ascending: false });
    return NextResponse.json({
      entries: (data ?? []).map(d => ({
        id: d.id, name: d.name, blood_group: d.blood_group,
        district: d.district, area: d.area,
        last_donated_on: d.last_donated_on,
        availability: availabilityOf(d.last_donated_on, d.is_available, d.never_donated),
        is_available: d.is_available,
        is_claimed: d.is_claimed,
        has_password: !!d.password_hash,
        created_at: d.created_at,
      })),
    });
  }

  return NextResponse.json({ error: "Unknown query" }, { status: 400 });
}
