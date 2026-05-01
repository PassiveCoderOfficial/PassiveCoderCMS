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

  const body = await req.json() as {
    default_commission_rate?: number;
    default_commission_type?: "recurring" | "one_time";
    agent_signup_enabled?: boolean;
    agent_auto_approve?: boolean;
  };

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.default_commission_rate === "number") {
    if (body.default_commission_rate < 0 || body.default_commission_rate > 100)
      return NextResponse.json({ error: "Commission rate must be 0–100" }, { status: 400 });
    update.default_commission_rate = body.default_commission_rate;
  }
  if (body.default_commission_type && ["recurring", "one_time"].includes(body.default_commission_type)) {
    update.default_commission_type = body.default_commission_type;
  }
  if (typeof body.agent_signup_enabled === "boolean") update.agent_signup_enabled = body.agent_signup_enabled;
  if (typeof body.agent_auto_approve === "boolean") update.agent_auto_approve = body.agent_auto_approve;

  const { error: dbErr } = await supabase!.from("platform_settings").update(update).eq("id", 1);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
