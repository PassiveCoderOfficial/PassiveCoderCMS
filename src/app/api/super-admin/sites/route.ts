import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireManagerOrSuperAdmin } from "@/lib/super-admin";
import { verifyBearerManagerOrSuperAdminUser } from "@/lib/auth/verify-bearer";
import { applyTemplateBySlug } from "@/modules/templates/apply-by-slug";
import { ensureBookingNav } from "@/lib/booking/nav";

export async function GET(req: Request) {
  const caller = (await requireManagerOrSuperAdmin()) ?? (await verifyBearerManagerOrSuperAdminUser(req));
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("tenants")
    // plan + the subscription row, so the Sites list can show billing state
    // next to each site (sites with no subscription used to be invisible to
    // billing entirely).
    .select("id,name,slug,status,plan,demo_expires_at,custom_domain,domain_status,created_at,onboarding_completed,deletion_requested_at,owner_id,subscriptions(id,plan_id,status,billing_cycle,amount_cents,custom_amount_cents,currency,next_payment_due,current_period_end,payment_provider)")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sites: data ?? [] });
}

export async function POST(req: Request) {
  const caller = (await requireManagerOrSuperAdmin()) ?? (await verifyBearerManagerOrSuperAdminUser(req));
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, slug, plan, owner_user_id, template_id, template_mode, assigned_staff_id } = await req.json();
  if (!name || !slug) return NextResponse.json({ error: "Missing name or slug" }, { status: 400 });

  const supabase = await createAdminClient();

  // Check slug availability
  const { data: existing } = await supabase.from("tenants").select("id").eq("slug", slug).maybeSingle();
  if (existing) return NextResponse.json({ error: "Subdomain already taken" }, { status: 409 });

  const { data, error } = await supabase
    .from("tenants")
    .insert({
      name,
      slug,
      plan: plan ?? "basic",
      status: "onboarded",
      owner_id: owner_user_id ?? null,
      onboarding_completed: true,
      assigned_staff_id: assigned_staff_id ?? null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Every site gets its subscription row at creation. Sites made here used to
  // get a plan but no subscription, so billing, dunning and the Subscriptions
  // list never knew they existed. 'onboarded' = not billed yet; the super
  // admin sets price, cycle and next payment date on the site's Billing card.
  const sitePlan = plan ?? "basic";
  const { data: planRow } = await supabase.from("plans").select("price_monthly").eq("id", sitePlan).maybeSingle();
  await supabase.from("subscriptions").insert({
    tenant_id: data.id,
    plan_id: sitePlan,
    status: "onboarded",
    billing_cycle: "monthly",
    payment_provider: "manual",
    amount_cents: planRow?.price_monthly ?? null,
    currency: "USD",
  });

  // If owner provided, add them as tenant member with owner role
  if (owner_user_id) {
    await supabase.from("tenant_members").insert({
      tenant_id: data.id,
      user_id: owner_user_id,
      role: "owner",
    });
  }

  // Apply template (best-effort — never fail site creation because seeding errored)
  await applyTemplateBySlug(
    supabase,
    data.id,
    template_id ?? "blank",
    (template_mode as "theme" | "full") ?? "full",
    { siteName: name },
  ).catch(err => console.error(`[apply-template] tenant=${data.id} slug=${template_id ?? "blank"}`, err));

  // Booking ready from day one (settings/hours come from migration 126); link /book in the header.
  await ensureBookingNav(supabase, data.id).catch(err => console.error(`[booking-nav] tenant=${data.id}`, err));

  return NextResponse.json(data);
}
