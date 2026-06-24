import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/super-admin";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    agentId: string;
    action: "status" | "commission" | "referral_code" | "remove" | "staff";
    status?: string;
    commission_rate?: number;
    commission_type?: "recurring" | "one_time";
    referral_code?: string;
    is_staff?: boolean;
    one_time_pct_override?: number | null;
    staff_recurring_pct?: number | null;
  };

  const { agentId, action } = body;
  if (!agentId || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const supabase = await createAdminClient();

  if (action === "status") {
    if (!["active", "suspended", "pending"].includes(body.status ?? "")) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const { error } = await supabase.from("agents").update({ status: body.status, updated_at: new Date().toISOString() }).eq("id", agentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (action === "commission") {
    const { commission_rate, commission_type } = body;
    if (typeof commission_rate !== "number" || commission_rate < 0 || commission_rate > 100) {
      return NextResponse.json({ error: "Invalid commission rate" }, { status: 400 });
    }
    const updatePayload: Record<string, unknown> = { commission_rate, updated_at: new Date().toISOString() };
    if (commission_type && ["recurring", "one_time"].includes(commission_type)) {
      updatePayload.commission_type = commission_type;
    }
    const { error } = await supabase.from("agents").update(updatePayload).eq("id", agentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (action === "referral_code") {
    const code = body.referral_code?.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!code || code.length < 3) return NextResponse.json({ error: "Code must be 3+ alphanumeric chars" }, { status: 400 });
    // Check uniqueness
    const { data: existing } = await supabase.from("agents").select("id").eq("referral_code", code).maybeSingle();
    if (existing && existing.id !== agentId) return NextResponse.json({ error: "Referral code already in use" }, { status: 409 });
    const { error } = await supabase.from("agents").update({ referral_code: code, updated_at: new Date().toISOString() }).eq("id", agentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (action === "staff") {
    const { is_staff, one_time_pct_override, staff_recurring_pct } = body;
    const { error } = await supabase.from("agents").update({
      is_staff: is_staff ?? false,
      one_time_pct_override: one_time_pct_override ?? null,
      staff_recurring_pct: staff_recurring_pct ?? null,
      updated_at: new Date().toISOString(),
    }).eq("id", agentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (action === "remove") {
    // Get user_id first to reset profile role
    const { data: agent } = await supabase.from("agents").select("user_id").eq("id", agentId).single();
    if (agent?.user_id) {
      await supabase.from("profiles").update({ role: "subscriber" }).eq("id", agent.user_id);
    }
    const { error } = await supabase.from("agents").delete().eq("id", agentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
