import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiCaller } from "@/lib/auth/api-caller";
import { EXPERTS_STARTER_NAME, expertsStarterSteps, sanitizeSteps, starterSteps, SEQUENCE_TRIGGERS, type SequenceTrigger } from "@/lib/crm/sequences";

async function ctx() {
  const caller = await getApiCaller();
  return { supabase: caller?.supabase ?? (await createClient()), tenantId: caller?.tenantId ?? null };
}
const trig = (v: unknown): SequenceTrigger => (SEQUENCE_TRIGGERS.includes(v as SequenceTrigger) ? (v as SequenceTrigger) : "any");

export async function GET() {
  const { supabase, tenantId } = await ctx();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await supabase.from("crm_sequences").select("*").eq("tenant_id", tenantId).order("created_at");
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { supabase, tenantId } = await ctx();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  // starter: true -> general follow-up; starter: "experts" -> ENM's enquiry nudges (EN/BN).
  const experts = body.starter === "experts";
  const starter = body.starter === true;
  const lang = body.lang === "bn" ? "bn" : "en";
  const { data, error } = await supabase.from("crm_sequences").insert({
    tenant_id: tenantId,
    name: (experts ? EXPERTS_STARTER_NAME[lang] : starter ? "New lead follow-up" : String(body.name ?? "").trim()).slice(0, 120) || "Sequence",
    trigger: experts ? "experts_enquiry" : starter ? "any" : trig(body.trigger),
    enabled: starter || experts ? true : body.enabled !== false,
    steps: experts ? expertsStarterSteps(lang) : starter ? starterSteps() : sanitizeSteps(body.steps),
  }).select("*").single();
  // Before migration 191 the trigger check rejects experts_enquiry.
  if (error) return NextResponse.json({ error: error.code === "23514" ? "Experts follow-ups are not switched on yet." : error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { supabase, tenantId } = await ctx();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, ...f } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof f.name === "string") patch.name = f.name.trim().slice(0, 120) || "Sequence";
  if ("trigger" in f) patch.trigger = trig(f.trigger);
  if (typeof f.enabled === "boolean") patch.enabled = f.enabled;
  if ("steps" in f) patch.steps = sanitizeSteps(f.steps);
  const { data, error } = await supabase.from("crm_sequences").update(patch)
    .eq("id", id).eq("tenant_id", tenantId).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { supabase, tenantId } = await ctx();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await supabase.from("crm_sequences").delete().eq("id", id).eq("tenant_id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
