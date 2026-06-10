import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Super-admin approves a pending manual payment (bKash/Nagad/bank) and activates
// the subscription + tenant for one year.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();
  const { data: sa } = await admin.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!sa) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { subscriptionId } = await req.json();
  if (!subscriptionId) return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 });

  const { data: sub } = await admin
    .from("subscriptions")
    .select("id, tenant_id, plan_id, manual_ticket_id")
    .eq("id", subscriptionId)
    .maybeSingle();
  if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  await admin.from("subscriptions").update({
    status: "active",
    trial_converted: true,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
  }).eq("id", sub.id);

  await admin.from("tenants").update({ status: "active", plan: sub.plan_id }).eq("id", sub.tenant_id);

  if (sub.manual_ticket_id) {
    await admin.from("support_tickets").update({ status: "resolved", resolved_at: now.toISOString() }).eq("id", sub.manual_ticket_id);
  }

  return NextResponse.json({ ok: true });
}
