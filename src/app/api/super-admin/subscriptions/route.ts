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

// GET /api/super-admin/subscriptions?id=<uuid>  → single sub + plans
// GET /api/super-admin/subscriptions             → all subs list
export async function GET(req: Request) {
  const { error, supabase } = await authed();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const ticketId = searchParams.get("ticketId");

  const [plansResult, subsResult] = await Promise.all([
    supabase!.from("plans").select("id,name,price_yearly,price_monthly,price_lifetime,currency").order("sort_order"),
    id
      ? supabase!.from("subscriptions").select("*, tenants(name,slug)").eq("id", id).maybeSingle()
      : ticketId
        ? supabase!.from("subscriptions").select("*, tenants(name,slug)").eq("manual_ticket_id", ticketId).maybeSingle()
        : supabase!.from("subscriptions").select("*, tenants(name,slug)").order("created_at", { ascending: false }).limit(500),
  ]);

  const plans = plansResult.data ?? [];

  if (id) {
    return NextResponse.json({ subscription: subsResult.data ?? null, plans });
  }
  if (ticketId) {
    return NextResponse.json({ subscription: subsResult.data ?? null, plans });
  }
  return NextResponse.json({ subscriptions: subsResult.data ?? [], plans });
}

export async function POST(req: Request) {
  const { error, supabase } = await authed();
  if (error) return error;

  const body = await req.json();
  const { tenant_id, plan_id, status, payment_provider, billing_cycle, amount_cents, currency, trial_ends_at, current_period_end } = body;
  if (!tenant_id || !plan_id) return NextResponse.json({ error: "Missing tenant_id or plan_id" }, { status: 400 });

  const payload: Record<string, unknown> = { tenant_id, plan_id, status: status ?? "trial", currency: currency || "USD" };
  if (["monthly", "yearly", "lifetime"].includes(billing_cycle)) payload.billing_cycle = billing_cycle;
  if (payment_provider?.trim()) payload.payment_provider = payment_provider.trim();
  if (amount_cents != null && amount_cents !== "") payload.amount_cents = Math.round(parseFloat(String(amount_cents)) * 100);
  if (trial_ends_at) payload.trial_ends_at = trial_ends_at;
  if (current_period_end) payload.current_period_end = current_period_end;

  const { data, error: dbErr } = await supabase!.from("subscriptions").insert(payload).select("id").single();
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}

export async function PATCH(req: Request) {
  const { error, supabase } = await authed();
  if (error) return error;

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const allowed = ["plan_id","status","payment_provider","billing_cycle","amount_cents","currency","trial_ends_at","current_period_end","notes"];
  const payload: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in updates) payload[k] = updates[k] === "" ? null : updates[k];
  }

  const { data: sub, error: dbErr } = await supabase!.from("subscriptions").update(payload).eq("id", id).select("tenant_id,status,trial_ends_at").single();
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  // Sync tenant status
  if (sub?.tenant_id && "status" in payload) {
    const tenantStatus = sub.status === "active" ? "active"
      : sub.status === "trial" ? "trial"
      : sub.status === "cancelled" ? "cancelled"
      : "suspended";
    await supabase!.from("tenants").update({
      status: tenantStatus,
      ...(sub.trial_ends_at ? { trial_ends_at: sub.trial_ends_at } : {}),
    }).eq("id", sub.tenant_id);
  }

  return NextResponse.json({ ok: true });
}
