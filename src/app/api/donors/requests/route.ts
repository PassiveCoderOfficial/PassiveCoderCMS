import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getDonorSession, normalizeBdPhone } from "@/lib/donors/auth";
import { geocodeBdArea } from "@/lib/donors/geocode";
import { sendExpoPush, type PushMessage } from "@/lib/donors/push";
import { sendWebPush } from "@/lib/donors/webpush";
import { availabilityOf } from "@/lib/donors/availability";
import { BLOOD_GROUPS, BD_DISTRICTS } from "@/lib/donors/bd-locations";

const DEFAULT_RADIUS_KM = 10;  // creator can widen per request
const NOTIFY_CAP = 200;        // never blast the whole database at once
const ARCHIVE_AFTER_DEADLINE_MS = 24 * 60 * 60 * 1000;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Compatible donor groups for a patient's group (who can donate TO them). */
const CAN_DONATE_TO: Record<string, string[]> = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

/**
 * List requests. A request past its deadline is NOT hidden — it stays listed
 * (flagged deadline_over so the UI can mark it red) until 24h after that
 * deadline, then auto-archives. Archived posts only surface under ?view=mine.
 *
 * ?view=open (default) | deadline_over | mine | all
 */
export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const sp = new URL(req.url).searchParams;
  const view = sp.get("view") ?? "open";
  const supabase = await createAdminClient();
  const now = new Date();

  // Lazily archive requests whose deadline passed over 24h ago, instead of a
  // cron. Anything without a deadline stays until archived by hand.
  await supabase.from("blood_requests")
    .update({ status: "archived", archived_at: now.toISOString(), updated_at: now.toISOString() })
    .eq("tenant_id", tenantId).eq("status", "open")
    .not("needed_by", "is", null)
    .lt("needed_by", new Date(now.getTime() - ARCHIVE_AFTER_DEADLINE_MS).toISOString());

  const me = await getDonorSession(tenantId);
  if (view === "mine" && !me) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }

  let q = supabase.from("blood_requests")
    .select("id, created_by, patient_name, blood_group, bags_needed, hospital, district, police_station, area, lat, lng, contact_phone, note, needed_by, status, radius_km, archived_at, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (view === "mine") {
    q = q.eq("created_by", me!.id);          // every status, including archived
  } else if (view === "all") {
    q = q.neq("status", "archived");
  } else {
    q = q.eq("status", "open");              // open + deadline_over both live here
  }

  const group = sp.get("blood_group");
  if (group && (BLOOD_GROUPS as readonly string[]).includes(group)) q = q.eq("blood_group", group);
  const district = sp.get("district");
  if (district) q = q.eq("district", district);
  const ps = sp.get("police_station");
  if (ps) q = q.eq("police_station", ps);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  let requests = (data ?? []).map((r) => ({
    ...r,
    deadline_over: !!r.needed_by && new Date(r.needed_by) < now,
    is_mine: !!me && r.created_by === me.id,
    created_by: undefined,                    // don't leak creator ids publicly
  }));

  // "Deadline over" is computed, so filter it after the fetch.
  if (view === "deadline_over") requests = requests.filter((r) => r.deadline_over);

  return NextResponse.json({ requests });
}

/** Post an urgent request — requires a donor account. Notifies nearby matches. */
export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const me = await getDonorSession(tenantId);
  if (!me) return NextResponse.json({ error: "login_required" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const phone = normalizeBdPhone(body.contact_phone);
  if (!(BLOOD_GROUPS as readonly string[]).includes(body.blood_group)) {
    return NextResponse.json({ error: "Pick a valid blood group" }, { status: 400 });
  }
  if (!phone) return NextResponse.json({ error: "A valid contact number is required" }, { status: 400 });
  if (body.district && !BD_DISTRICTS.includes(body.district)) {
    return NextResponse.json({ error: "Unknown district" }, { status: 400 });
  }

  // Same geocoding fallback as donors: pin > area/thana/district.
  let lat = typeof body.lat === "number" ? body.lat : null;
  let lng = typeof body.lng === "number" ? body.lng : null;
  if (lat == null || lng == null) {
    const geo = await geocodeBdArea({
      area: body.area, police_station: body.police_station, district: body.district,
    });
    if (geo) { lat = geo.lat; lng = geo.lng; }
  }

  const radiusKm = Math.min(100, Math.max(1, Number(body.radius_km) || DEFAULT_RADIUS_KM));

  const supabase = await createAdminClient();
  const { data: created, error } = await supabase.from("blood_requests").insert({
    tenant_id: tenantId,
    created_by: me.id,
    patient_name: body.patient_name?.trim() || null,
    blood_group: body.blood_group,
    bags_needed: Math.min(20, Math.max(1, Number(body.bags_needed) || 1)),
    hospital: body.hospital?.trim() || null,
    district: body.district || null,
    police_station: body.police_station || null,
    area: body.area?.trim() || null,
    lat, lng,
    contact_phone: phone,
    note: body.note?.trim() || null,
    needed_by: body.needed_by || null,
    radius_km: radiusKm,
  }).select("id, blood_group, hospital, area, district").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // ── Notify compatible, available, nearby donors ──────────────────────────
  const compatible = CAN_DONATE_TO[body.blood_group] ?? [body.blood_group];
  const { data: candidates } = await supabase.from("donors")
    .select("id, lat, lng, last_donated_on, is_available, never_donated")
    .eq("tenant_id", tenantId).eq("is_active", true).eq("is_available", true)
    .in("blood_group", compatible)
    .limit(2000);

  let matches = (candidates ?? []).filter((d) => {
    // Notify anyone not provably ineligible: "ready" (past cooldown, or
    // never donated) plus "unknown" (no date on file). Most entries have no
    // recorded date, so requiring "ready" alone silenced nearly the whole
    // directory. Only skip donors inside the cooldown or marked unavailable.
    const a = availabilityOf(d.last_donated_on, d.is_available, d.never_donated);
    return a === "ready" || a === "unknown";
  });

  if (lat != null && lng != null) {
    matches = matches
      .filter((d) => d.lat != null && d.lng != null)
      .map((d) => ({ ...d, dist: haversineKm(lat!, lng!, d.lat as number, d.lng as number) }))
      .filter((d) => d.dist <= radiusKm)
      .sort((a, b) => a.dist - b.dist);
  }
  // Never notify the person who posted it.
  matches = matches.filter((d) => d.id !== me.id).slice(0, NOTIFY_CAP);

  let notified = 0;
  if (matches.length) {
    const donorIds = matches.map((m) => m.id);
    const where = [created.hospital, created.area, created.district].filter(Boolean).join(", ");
    const title = `${created.blood_group} blood needed urgently`;
    const bodyText = where ? `Near ${where}. Tap if you can help.` : "Tap if you can help.";

    // Native app devices…
    const { data: devices } = await supabase.from("donor_devices")
      .select("expo_token").eq("tenant_id", tenantId).in("donor_id", donorIds);
    const messages: PushMessage[] = (devices ?? []).map((d) => ({
      to: d.expo_token, title, body: bodyText,
      data: { type: "blood_request", requestId: created.id },
    }));
    const expoResult = await sendExpoPush(messages);

    // …and browsers subscribed to web push.
    const { data: webSubs } = await supabase.from("donor_web_push")
      .select("endpoint, p256dh, auth").eq("tenant_id", tenantId).in("donor_id", donorIds);
    const webResult = await sendWebPush(tenantId, webSubs ?? [], {
      title, body: bodyText, url: "/donors/requests", requestId: created.id,
    });

    notified = expoResult.sent + webResult.sent;
    if (notified) {
      await supabase.from("blood_requests")
        .update({ notified_count: notified }).eq("id", created.id);
    }
  }

  return NextResponse.json({ ok: true, id: created.id, notified }, { status: 201 });
}

/** Close/fulfil a request — creator or admin only. */
export async function PATCH(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const me = await getDonorSession(tenantId);
  if (!me) return NextResponse.json({ error: "login_required" }, { status: 401 });

  const { id, status } = await req.json().catch(() => ({}));
  // "open" doubles as unarchive — putting a request back in the public list.
  if (!id || !["fulfilled", "cancelled", "archived", "open"].includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { data: reqRow } = await supabase.from("blood_requests")
    .select("created_by").eq("id", id).eq("tenant_id", tenantId).maybeSingle();
  if (!reqRow) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (reqRow.created_by !== me.id && !me.is_admin) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  await supabase.from("blood_requests")
    .update({
      status,
      archived_at: status === "archived" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id).eq("tenant_id", tenantId);
  return NextResponse.json({ ok: true });
}
