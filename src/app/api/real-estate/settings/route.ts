import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { canWriteSite } from "@/lib/auth/site-write";

const FIELDS = ["agent_name", "agent_title", "agent_photo", "whatsapp", "phone", "email", "default_currency", "default_area_unit", "licence_text", "brochure_gate"] as const;

export async function PUT(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canWriteSite(tenantId))) return NextResponse.json({ error: "Your role can't make changes on this site." }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const row: Record<string, unknown> = { tenant_id: tenantId, updated_at: new Date().toISOString() };
  for (const f of FIELDS) if (f in body) row[f] = typeof body[f] === "string" ? body[f].trim() || null : body[f];
  if (!row.default_currency) row.default_currency = "SAR";
  if (row.default_area_unit !== "sqft") row.default_area_unit = "sqm";

  const supabase = await createClient();
  const { error } = await supabase.from("re_settings").upsert(row, { onConflict: "tenant_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
