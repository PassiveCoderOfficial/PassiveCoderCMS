import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { getValidGoogleAccessToken } from "@/lib/analytics/google";

/**
 * Save which GA4 property (of the connected account's list) to pull report
 * data from — set once after connecting, changeable any time.
 *
 * Also auto-fills ga_measurement_id from the property's own web data stream
 * (GA4 Admin API) and saves it to the SAME field the site's own gtag
 * injection already reads ((site)/layout.tsx, (marketing)/layout.tsx) — so
 * picking a property here is the whole setup: no separate "now go copy your
 * Measurement ID and paste it into Settings" step for a DIY client who has
 * no idea what a Measurement ID even is. Reported live: a client connected
 * via OAuth but GA still showed "No data received" because nothing was
 * tagging the site — this closes that gap.
 *
 * A GA4 property can have more than one data stream (web + iOS + Android
 * app streams under one property); this picks the first WEB stream, since
 * that's the only kind whose measurementId a website's gtag.js can use.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { property_id } = await req.json();
  if (!property_id?.trim()) return NextResponse.json({ error: "Missing property_id" }, { status: 400 });

  let measurementId: string | null = null;
  const accessToken = await getValidGoogleAccessToken(tenantId);
  if (accessToken) {
    try {
      const streamsRes = await fetch(
        `https://analyticsadmin.googleapis.com/v1beta/${property_id}/dataStreams`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (streamsRes.ok) {
        const streamsJson = await streamsRes.json();
        const webStream = (streamsJson.dataStreams ?? []).find((s: { webStreamData?: { measurementId?: string } }) => s.webStreamData?.measurementId);
        measurementId = webStream?.webStreamData?.measurementId ?? null;
      }
    } catch {
      // Non-fatal — the report pull (which only needs property_id) still
      // works even if this lookup fails; the site just won't auto-tag.
    }
  }

  const admin = await createAdminClient();
  const patch: Record<string, unknown> = { ga_property_id: property_id };
  // Only ever write a real id here — never clear an existing
  // ga_measurement_id the tenant may have set manually just because this
  // particular property has no web stream (an app-only GA4 property, say).
  if (measurementId) patch.ga_measurement_id = measurementId;

  const { error } = await admin.from("site_settings").update(patch).eq("tenant_id", tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, measurementId });
}
