import { NextResponse } from "next/server";
import { apiUser, getApiCaller } from "@/lib/auth/api-caller";
import { rateLimited } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/server";
import { geocodeSearch } from "@/lib/maps/geocode";

/**
 * GET /api/maps/geocode?q=<address or place>
 * Search for the Map location control (block settings, Dashboard > Contact)
 * when the browser has no Places search. Signed-in dashboard users only, 60
 * searches per 10 minutes each. Results lean to the site's country.
 */
export async function GET(req: Request) {
  const caller = await getApiCaller(req);
  const user = caller?.user ?? (await apiUser(req));
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (rateLimited(`maps-geocode:${user.id}`, 60, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many searches. Please wait a few minutes." }, { status: 429 });
  }
  const q = (new URL(req.url).searchParams.get("q") ?? "").replace(/\s+/g, " ").trim();
  if (q.length < 2 || q.length > 200) return NextResponse.json({ error: "Type an address or place name." }, { status: 400 });

  let region: string | null = null;
  if (caller?.tenantId) {
    const admin = await createAdminClient();
    const { data } = await admin.from("tenant_business_profiles").select("country_code").eq("tenant_id", caller.tenantId).maybeSingle();
    region = (data as { country_code?: string | null } | null)?.country_code ?? null;
  }
  return NextResponse.json(await geocodeSearch(q, { region }));
}
