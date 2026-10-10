import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { canWriteSite } from "@/lib/auth/site-write";
import { RESULT_FIELDS } from "@/lib/results/fields";

const TEXT = ["institute_name", "signatory_name", "signatory_title", "signature_url"] as const;
const MODES = ["certificate", "certificate_dob", "certificate_roll"];

export async function PUT(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canWriteSite(tenantId))) return NextResponse.json({ error: "Your role can't make changes on this site." }, { status: 403 });
  const body = await req.json().catch(() => ({}));

  const row: Record<string, unknown> = { tenant_id: tenantId, updated_at: new Date().toISOString() };
  for (const f of TEXT) if (f in body) row[f] = typeof body[f] === "string" ? body[f].trim() || null : null;
  if ("lookup_mode" in body) row.lookup_mode = MODES.includes(body.lookup_mode) ? body.lookup_mode : "certificate";
  if ("mask_passport" in body) row.mask_passport = !!body.mask_passport;
  const clean = (o: unknown, bool: boolean) => {
    const out: Record<string, unknown> = {};
    if (o && typeof o === "object") for (const f of RESULT_FIELDS) {
      const v = (o as Record<string, unknown>)[f];
      if (bool && typeof v === "boolean") out[f] = v;
      if (!bool && typeof v === "string" && v.trim()) out[f] = v.trim().slice(0, 60);
    }
    return out;
  };
  if ("public_fields" in body) row.public_fields = clean(body.public_fields, true);
  if ("labels" in body) row.labels = clean(body.labels, false);

  const supabase = await createClient();
  const { error } = await supabase.from("results_settings").upsert(row, { onConflict: "tenant_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
