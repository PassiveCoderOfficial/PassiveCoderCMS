import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export const maxDuration = 300;

/**
 * Daily allowance check: warn owners approaching their plan's monthly visitor
 * limit.
 *
 * Warnings only. Nothing is charged and nothing is suspended for going over —
 * the plan allowance is a soft cap, and the point of the email is to give the
 * owner a reason to upgrade before their traffic becomes a problem, not to
 * bill them by surprise for succeeding.
 */
const THRESHOLDS = [100, 80] as const; // highest first — only the top one fires

function body(opts: {
  siteName: string; used: number; limit: number; pct: number; planName: string; upgradeUrl: string;
}): string {
  const { siteName, used, limit, pct, planName, upgradeUrl } = opts;
  if (pct >= 100) {
    return `Hi,\n\n${siteName} has passed the ${limit.toLocaleString()} monthly visitors included with ${planName} — you're at about ${used.toLocaleString()} this month.\n\nNothing has been switched off and you have not been charged anything extra. Your site is working exactly as before.\n\nWe're telling you because it usually means the site is doing its job. If this keeps up, a larger plan will give you more headroom:\n${upgradeUrl}\n\nHappy to talk it through if you'd rather.`;
  }
  return `Hi,\n\nQuick heads up: ${siteName} has used about ${used.toLocaleString()} of the ${limit.toLocaleString()} monthly visitors included with ${planName} — roughly ${pct}% of the allowance, and there's still time left in the month.\n\nNothing happens if you go over. No extra charge, no interruption. We just thought you'd want to know your traffic is growing.\n\nIf you want more headroom:\n${upgradeUrl}`;
}

async function handle(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.INTERNAL_CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await createAdminClient();
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
  const summary = { checked: 0, warned: 0, skipped: 0, errors: 0 };

  // First day of the current month — the window the allowance is stated in,
  // and the key that lets a new month re-warn.
  const period = new Date();
  period.setUTCDate(1);
  const periodKey = period.toISOString().slice(0, 10);

  const { data: subs, error } = await admin
    .from("subscriptions")
    .select("tenant_id, plan_id, status")
    .in("status", ["active", "past_due"]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: plans } = await admin
    .from("plans").select("id, name, visitor_limit_monthly");
  const planById = new Map((plans ?? []).map(p => [p.id, p]));

  for (const sub of subs ?? []) {
    summary.checked++;
    const plan = planById.get(sub.plan_id);
    const limit = plan?.visitor_limit_monthly ?? 0;
    if (!limit || limit <= 0) { summary.skipped++; continue; }

    const { data: used } = await admin.rpc("tenant_views_this_month", { t: sub.tenant_id });
    const views = Number(used ?? 0);
    const pct = Math.floor((views / limit) * 100);

    const threshold = THRESHOLDS.find(t => pct >= t);
    if (!threshold) continue;

    // One notice per threshold per month.
    const { data: notice } = await admin
      .from("tenant_usage_notices")
      .select("period, threshold")
      .eq("tenant_id", sub.tenant_id)
      .maybeSingle();
    if (notice?.period === periodKey && (notice?.threshold ?? 0) >= threshold) continue;

    const { data: tenant } = await admin
      .from("tenants").select("id, name, slug, owner_id").eq("id", sub.tenant_id).maybeSingle();
    if (!tenant?.owner_id) continue;

    const { data: owner } = await admin
      .from("profiles").select("email").eq("id", tenant.owner_id).maybeSingle();
    if (!owner?.email) continue;

    const sent = await sendEmail({
      to: owner.email,
      subject: pct >= 100
        ? `${tenant.name ?? "Your site"} passed its monthly visitor allowance`
        : `${tenant.name ?? "Your site"} is at ${pct}% of its monthly visitors`,
      text: body({
        siteName: tenant.name ?? tenant.slug ?? "your website",
        used: views,
        limit,
        pct,
        planName: plan?.name ?? sub.plan_id,
        upgradeUrl: `https://${rootDomain}/dashboard/subscription`,
      }),
    });
    if (!sent.ok) { summary.errors++; continue; }

    await admin.from("tenant_usage_notices").upsert({
      tenant_id: sub.tenant_id,
      period: periodKey,
      threshold,
      notified_at: new Date().toISOString(),
    }, { onConflict: "tenant_id" });
    summary.warned++;
  }

  console.log("[usage-warnings]", JSON.stringify(summary));
  return NextResponse.json(summary);
}

export const POST = handle;
