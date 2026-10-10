import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { publicView, label, CARD_ORDER, RESULT_FIELDS } from "@/lib/results/fields";
import { findByCertificate, loadSettings, passesSecondFactor, recentMisses } from "@/lib/results/load";

const WINDOW_MIN = 10;
const MAX_MISSES = 20;

/**
 * GET /api/results/lookup?cert=…[&dob=…|&roll=…]
 * Public result search for the results_search block. Exact match only (no
 * listing, no partial search), second factor enforced per site settings,
 * and a per-IP throttle on misses so certificate numbers can't be guessed.
 * GET /api/results/lookup?meta=1 returns the lookup mode + labels for the form.
 */
export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });
  const sp = new URL(req.url).searchParams;
  const admin = await createAdminClient();
  const s = await loadSettings(admin, tenantId);

  if (sp.get("meta") === "1") {
    return NextResponse.json({
      lookupMode: s.lookup_mode,
      labels: Object.fromEntries(RESULT_FIELDS.map((f) => [f, label(s, f)])),
    });
  }

  const cert = (sp.get("cert") ?? "").slice(0, 100);
  if (!cert.trim()) return NextResponse.json({ error: "Enter a certificate number." }, { status: 400 });

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if ((await recentMisses(admin, ip, WINDOW_MIN)) >= MAX_MISSES) {
    return NextResponse.json({ error: "Too many searches. Please wait a few minutes and try again." }, { status: 429 });
  }

  const row = await findByCertificate(admin, tenantId, cert);
  const ok = !!row && passesSecondFactor(row, s, { dob: sp.get("dob") ?? "", roll: sp.get("roll") ?? "" });
  await admin.from("results_lookup_log").insert({ tenant_id: tenantId, ip, found: ok });
  if (!ok || !row) return NextResponse.json({ found: false });

  return NextResponse.json({
    found: true,
    result: publicView(row, s, "full"),
    order: CARD_ORDER,
    labels: Object.fromEntries(RESULT_FIELDS.map((f) => [f, label(s, f)])),
    verifyUrl: `/verify/${encodeURIComponent(row.certificate_no.trim())}`,
  });
}
