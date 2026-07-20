import { createAdminClient } from "@/lib/supabase/server";
import { sendWebPush, type WebPushSub } from "@/lib/donors/webpush";

const WAVE_SIZE = 5;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface ServiceRequestForNotify {
  id: string;
  tenant_id: string;
  subcategory_id: string | null;
  lat: number | null;
  lng: number | null;
  radius_km: number;
  address: string | null;
  notified_vendor_ids: string[];
}

/**
 * Find the nearest WAVE_SIZE (5) approved vendors offering this request's
 * service, within radius, excluding anyone already notified — send them web
 * push, and record who got notified. Used both by the initial urgent-request
 * notify (src/app/api/marketplace/public/requests/route.ts) and every
 * escalation wave (src/app/api/cron/escalate-requests/route.ts) so the
 * matching logic exists in exactly one place.
 */
export async function notifyNextVendorWave(req: ServiceRequestForNotify): Promise<{ notifiedIds: string[] }> {
  const supabase = await createAdminClient();

  if (req.lat == null || req.lng == null || !req.subcategory_id) return { notifiedIds: [] };

  const { data: offerings } = await supabase
    .from("vendor_services")
    .select("vendor_id, vendors!inner(id, name, lat, lng, status)")
    .eq("tenant_id", req.tenant_id)
    .eq("subcategory_id", req.subcategory_id)
    .eq("active", true)
    .eq("vendors.status", "approved");

  const already = new Set(req.notified_vendor_ids);
  type VendorRow = { id: string; name: string; lat: number | null; lng: number | null; status: string };
  const candidates = (offerings ?? [])
    .map((o) => o.vendors as unknown as VendorRow)
    .filter((v) => v && !already.has(v.id) && v.lat != null && v.lng != null)
    .map((v) => ({ ...v, dist: haversineKm(req.lat!, req.lng!, v.lat as number, v.lng as number) }))
    .filter((v) => v.dist <= req.radius_km)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, WAVE_SIZE);

  if (!candidates.length) return { notifiedIds: [] };

  const vendorIds = candidates.map((v) => v.id);
  const { data: subs } = await supabase
    .from("vendor_web_push")
    .select("endpoint, p256dh, auth")
    .eq("tenant_id", req.tenant_id)
    .in("vendor_id", vendorIds);

  await sendWebPush(req.tenant_id, (subs ?? []) as WebPushSub[], {
    title: "New job request nearby",
    body: req.address ? `Near ${req.address}. Tap to view.` : "Tap to view the request.",
    url: "/dashboard/marketplace/requests",
    requestId: req.id,
  });

  const notifiedVendorIds = [...req.notified_vendor_ids, ...vendorIds];
  await supabase.from("service_requests").update({
    notified_vendor_ids: notifiedVendorIds,
    notified_count: notifiedVendorIds.length,
    last_notified_at: new Date().toISOString(),
  }).eq("id", req.id);

  return { notifiedIds: vendorIds };
}
