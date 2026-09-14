import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export const maxDuration = 300;

/**
 * Restaurant vertical Tier 2, item #3 (docs/business/06-restaurant-vertical.md):
 * inventory low-stock flagging. Auto-deduction on order (POS + web
 * checkout) and the in-page low-stock badge already existed
 * (ecommerce/inventory) — what was actually missing is a PROACTIVE alert,
 * not something an owner only sees if they happen to open Inventory. Same
 * once-per-crossing pattern as usage-warnings/route.ts: email fires when a
 * product first crosses its threshold, not every day it stays low.
 */
async function handle(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.INTERNAL_CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await createAdminClient();
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
  const summary = { checked: 0, warned: 0, errors: 0 };

  // Only products that actually track inventory and have a real threshold
  // set — the default of 0 would otherwise flag "0 in stock" as low, which
  // is "out", not "low", and already shown as such in the inventory page.
  const { data: lowProducts } = await admin
    .from("products")
    .select("id, name, tenant_id, stock_quantity, low_stock_threshold")
    .eq("track_inventory", true)
    .gt("low_stock_threshold", 0)
    .order("tenant_id");

  if (!lowProducts?.length) return NextResponse.json(summary);

  // Group by tenant so a restaurant with 5 low items gets ONE email, not 5.
  const byTenant = new Map<string, typeof lowProducts>();
  for (const p of lowProducts) {
    summary.checked++;
    if ((p.stock_quantity ?? 0) > (p.low_stock_threshold ?? 0)) continue; // not actually low
    const list = byTenant.get(p.tenant_id) ?? [];
    list.push(p);
    byTenant.set(p.tenant_id, list);
  }

  for (const [tenantId, products] of byTenant) {
    // One notice per distinct set of low products — re-fires if the set
    // changes (a new item drops low, or the list shrinks then grows again),
    // not on a fixed schedule, so restocking and re-running low doesn't get
    // silently suppressed by an old notice.
    const signature = products.map(p => p.id).sort().join(",");
    const { data: notice } = await admin
      .from("tenant_low_stock_notices")
      .select("signature")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (notice?.signature === signature) continue;

    const { data: tenant } = await admin
      .from("tenants").select("id, name, slug, owner_id").eq("id", tenantId).maybeSingle();
    if (!tenant?.owner_id) continue;

    const { data: owner } = await admin
      .from("profiles").select("email").eq("id", tenant.owner_id).maybeSingle();
    if (!owner?.email) continue;

    const lines = products
      .sort((a, b) => (a.stock_quantity ?? 0) - (b.stock_quantity ?? 0))
      .map(p => `  - ${p.name}: ${p.stock_quantity ?? 0} left (threshold ${p.low_stock_threshold})`)
      .join("\n");

    const sent = await sendEmail({
      to: owner.email,
      subject: `${tenant.name ?? "Your site"}: ${products.length} item${products.length === 1 ? "" : "s"} running low`,
      text: `Hi,\n\n${products.length} item${products.length === 1 ? " is" : "s are"} running low on stock:\n\n${lines}\n\nRestock or adjust thresholds here:\nhttps://${rootDomain}/dashboard/ecommerce/inventory\n\n(You'll only get this once per set of low items — it won't repeat daily while they stay low.)`,
    });
    if (!sent.ok) { summary.errors++; continue; }

    await admin.from("tenant_low_stock_notices").upsert({
      tenant_id: tenantId,
      signature,
      notified_at: new Date().toISOString(),
    }, { onConflict: "tenant_id" });
    summary.warned++;
  }

  console.log("[low-stock]", JSON.stringify(summary));
  return NextResponse.json(summary);
}

export const POST = handle;
