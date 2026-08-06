import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/super-admin";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    agentId: string;
    action: "status" | "commission" | "referral_code" | "remove";
    status?: string;
    referral_code?: string;
    staff_recurring_pct?: number | null;
  };

  const { agentId, action } = body;
  if (!agentId || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const supabase = await createAdminClient();

  if (action === "status") {
    if (!["active", "suspended", "pending"].includes(body.status ?? "")) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const { error } = await supabase.from("pc_staff").update({ status: body.status, updated_at: new Date().toISOString() }).eq("id", agentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (action === "commission") {
    const { staff_recurring_pct } = body;
    if (staff_recurring_pct != null && (staff_recurring_pct < 0 || staff_recurring_pct > 100)) {
      return NextResponse.json({ error: "Invalid commission rate" }, { status: 400 });
    }
    const { error } = await supabase.from("pc_staff").update({
      staff_recurring_pct: staff_recurring_pct ?? null,
      updated_at: new Date().toISOString(),
    }).eq("id", agentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (action === "referral_code") {
    const code = body.referral_code?.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!code || code.length < 3) return NextResponse.json({ error: "Code must be 3+ alphanumeric chars" }, { status: 400 });
    // Check uniqueness
    const { data: existing } = await supabase.from("pc_staff").select("id").eq("referral_code", code).maybeSingle();
    if (existing && existing.id !== agentId) return NextResponse.json({ error: "Referral code already in use" }, { status: 409 });
    const { error } = await supabase.from("pc_staff").update({ referral_code: code, updated_at: new Date().toISOString() }).eq("id", agentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (action === "remove") {
    // Get user_id first to reset profile role
    const { data: agent } = await supabase.from("pc_staff").select("user_id").eq("id", agentId).single();
    if (agent?.user_id) {
      await supabase.from("profiles").update({ role: "subscriber" }).eq("id", agent.user_id);
    }
    const { error } = await supabase.from("pc_staff").delete().eq("id", agentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
