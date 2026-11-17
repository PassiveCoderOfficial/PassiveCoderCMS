import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { applyTemplateBySlug } from "@/modules/templates/apply-by-slug";
import { ensureBookingNav } from "@/lib/booking/nav";

/**
 * Create a site for someone (Super Admin "New site", a reseller's "New
 * client site"): the tenant, its subscription row, the owner membership,
 * the template, and booking ready in the header. One path, so sites made
 * either way are set up the same.
 */
export async function createSite(admin: SupabaseClient, a: {
  name: string; slug: string; plan?: string | null; ownerUserId?: string | null;
  templateSlug?: string | null; templateMode?: "theme" | "full";
  assignedStaffId?: string | null; resellerPartnerId?: string | null;
  /** Subscription billing. Default yearly USD with no amount: there is no monthly
   *  billing, and an unset price means the billing system uses the package defaults. */
  billing?: { cycle: "monthly" | "yearly" | "lifetime"; currency: "USD" | "BDT" };
}): Promise<{ id: string } | { error: string; status: number }> {
  const { data: existing } = await admin.from("tenants").select("id").eq("slug", a.slug).maybeSingle();
  if (existing) return { error: "Subdomain already taken", status: 409 };
  const plan = a.plan ?? "basic";

  const { data, error } = await admin.from("tenants").insert({
    name: a.name, slug: a.slug, plan, status: "onboarded",
    owner_id: a.ownerUserId ?? null, onboarding_completed: true,
    assigned_staff_id: a.assignedStaffId ?? null,
    reseller_partner_id: a.resellerPartnerId ?? null,
  }).select("id").single();
  if (error) return { error: error.message, status: 400 };

  // Every site gets its subscription row at creation; 'onboarded' = not billed yet.
  const billing = a.billing ?? { cycle: "yearly", currency: "USD" };
  await admin.from("subscriptions").insert({
    tenant_id: data.id, plan_id: plan, status: "onboarded", billing_cycle: billing.cycle, payment_provider: "manual",
    amount_cents: null,
    currency: billing.currency,
  });

  if (a.ownerUserId) {
    await admin.from("tenant_members").insert({ tenant_id: data.id, user_id: a.ownerUserId, role: "owner" });
  }

  // Best-effort: never fail site creation because seeding errored.
  await applyTemplateBySlug(admin as never, data.id, a.templateSlug ?? "blank", a.templateMode ?? "full", { siteName: a.name })
    .catch((err) => console.error(`[apply-template] tenant=${data.id} slug=${a.templateSlug ?? "blank"}`, err));
  await ensureBookingNav(admin, data.id).catch((err) => console.error(`[booking-nav] tenant=${data.id}`, err));

  return { id: data.id as string };
}
