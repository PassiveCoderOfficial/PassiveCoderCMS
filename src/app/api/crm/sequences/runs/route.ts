import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiCaller } from "@/lib/auth/api-caller";

/** GET ?contact_id= → runs for a contact; PATCH {id} → stop an active run. */
export async function GET(req: NextRequest) {
  const caller = await getApiCaller();
  const supabase = caller?.supabase ?? (await createClient());
  const tenantId = caller?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const contactId = new URL(req.url).searchParams.get("contact_id");
  let q = supabase.from("crm_sequence_runs")
    .select("id, sequence_id, contact_id, source, next_step, next_run_at, status, stop_reason, created_at, crm_sequences(name, steps)")
    .eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(50);
  if (contactId) q = q.eq("contact_id", contactId);
  const { data } = await q;
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  const caller = await getApiCaller();
  const supabase = caller?.supabase ?? (await createClient());
  const tenantId = caller?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await supabase.from("crm_sequence_runs")
    .update({ status: "stopped", stop_reason: "manual", updated_at: new Date().toISOString() })
    .eq("id", id).eq("tenant_id", tenantId).eq("status", "active");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
