import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getApiCaller } from "@/lib/auth/api-caller";
import { trialState } from "@/lib/sites/trial";

/** The current site's trial state for the dashboard banner. */
export async function GET() {
  const tenantId = (await getApiCaller())?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ kind: "none" });
  const admin = await createAdminClient();
  const { data: t } = await admin.from("tenants").select("trial_ends_at, trial_delete_after, status, demo_expires_at").eq("id", tenantId).maybeSingle();
  if (!t || t.demo_expires_at) return NextResponse.json({ kind: "none" });
  return NextResponse.json(trialState(t), { headers: { "Cache-Control": "private, max-age=60" } });
}
