import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/super-admin";

async function authed() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), supabase: null };
  if (!await isSuperAdmin(user.id)) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), supabase: null };
  const supabase = await createAdminClient();
  return { error: null, supabase };
}

export async function GET() {
  const { error, supabase } = await authed();
  if (error) return error;
  const { data, error: dbErr } = await supabase!.from("platform_settings").select("*").eq("id", 1).single();
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}

export async function POST(req: Request) {
  const { error, supabase } = await authed();
  if (error) return error;

  const body = await req.json() as Record<string, unknown>;

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  // Simple string fields — save as-is (empty string clears the field)
  const stringFields = [
    "bkash_number", "nagad_number", "bank_details", "manual_payment_instructions",
    "whatsapp_number",
    // Dodo live
    "dodo_live_api_key", "dodo_live_webhook_secret",
    "dodo_live_product_basic_yearly", "dodo_live_product_pro_yearly",
    "dodo_live_product_basic_monthly", "dodo_live_product_pro_monthly",
    // Dodo sandbox
    "dodo_sandbox_api_key", "dodo_sandbox_webhook_secret",
    "dodo_sandbox_product_basic_yearly", "dodo_sandbox_product_pro_yearly",
    "dodo_sandbox_product_basic_monthly", "dodo_sandbox_product_pro_monthly",
    // shurjoPay live
    "shurjopay_live_base_url", "shurjopay_live_username",
    "shurjopay_live_password", "shurjopay_live_prefix",
    // shurjoPay sandbox
    "shurjopay_sandbox_username", "shurjopay_sandbox_password", "shurjopay_sandbox_prefix",
  ] as const;

  for (const k of stringFields) {
    if (typeof body[k] === "string") update[k] = body[k] || null;
  }

  // Mode toggles
  if (body.shurjopay_mode === "sandbox" || body.shurjopay_mode === "live") update.shurjopay_mode = body.shurjopay_mode;
  if (body.dodo_mode === "sandbox" || body.dodo_mode === "live") update.dodo_mode = body.dodo_mode;

  // Numeric fields
  const oneTime = typeof body.default_agent_one_time_pct === "number" ? body.default_agent_one_time_pct : null;
  if (oneTime !== null) {
    if (oneTime < 0 || oneTime > 100) return NextResponse.json({ error: "One-time % must be 0–100" }, { status: 400 });
    update.default_agent_one_time_pct = oneTime;
  }
  const recurring = typeof body.default_staff_recurring_pct === "number" ? body.default_staff_recurring_pct : null;
  if (recurring !== null) {
    if (recurring < 0 || recurring > 100) return NextResponse.json({ error: "Recurring % must be 0–100" }, { status: 400 });
    update.default_staff_recurring_pct = recurring;
  }
  if (typeof body.usd_to_bdt_rate === "number" && body.usd_to_bdt_rate > 0) update.usd_to_bdt_rate = body.usd_to_bdt_rate;
  if (typeof body.default_commission_rate === "number") update.default_commission_rate = body.default_commission_rate;
  if (body.default_commission_type === "recurring" || body.default_commission_type === "one_time") update.default_commission_type = body.default_commission_type;
  if (typeof body.agent_signup_enabled === "boolean") update.agent_signup_enabled = body.agent_signup_enabled;
  if (typeof body.agent_auto_approve === "boolean") update.agent_auto_approve = body.agent_auto_approve;

  const { error: dbErr } = await supabase!.from("platform_settings").update(update).eq("id", 1);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
