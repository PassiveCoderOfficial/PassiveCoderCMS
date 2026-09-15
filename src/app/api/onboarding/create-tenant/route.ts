import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { applyTemplateBySlug } from "@/modules/templates/apply-by-slug";
import { verifyBearerUser } from "@/lib/auth/verify-bearer";

export async function POST(req: Request) {
  const body = await req.json();
  const { siteName, slug, userId, planId, templateId, templateMode } = body;

  // Real gap, found while porting onboarding to the Passive Coder Admin
  // mobile app: this route previously trusted `userId` from the request
  // body with no verification at all — anyone who could POST here could
  // create a tenant (and, via the upsert below, claim ownership) under any
  // user id they typed in, not just their own. Cookie session first (web,
  // unchanged), Bearer fallback (mobile — the app has no cookie), same
  // dual-auth shape as callerCanManageTenant elsewhere in this codebase.
  // Either way, the VERIFIED caller id must equal the userId in the body —
  // this endpoint creates real billing/ownership records, so trusting an
  // unverified client-supplied id here was never sound.
  const cookieAuth = await createClient();
  const { data: { user: cookieUser } } = await cookieAuth.auth.getUser();
  let callerId = cookieUser?.id ?? null;
  if (!callerId) {
    const bearer = await verifyBearerUser(req);
    callerId = bearer?.userId ?? null;
  }
  if (!callerId || callerId !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const billingCycle = body.billingCycle === "monthly" ? "monthly" : "yearly";
  // No automatic trial any more (reverted 2026-09-13 — see
  // docs/business/04-pricing-and-packaging.md). Dodo and shurjoPay both
  // charge at signup now; "manual" is the only path that doesn't, and only
  // because staff arrange it case by case on request, not because the
  // system grants one automatically. Recorded regardless of method so the
  // dashboard payment prompt knows which rail to offer.
  const payMethod: string = ["dodo", "shurjopay", "manual"].includes(body.payMethod) ? body.payMethod : "manual";
  // URL param wins; fallback to persistent cookie (last-ref-wins affiliate tracking)
  const cookieStore = await cookies();
  const referralCode: string | undefined = body.referralCode || cookieStore.get("ref_code")?.value || undefined;

  if (!siteName || !slug || !userId)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const supabase = await createAdminClient();

  // Check if slug exists (maybeSingle — no error on missing row)
  const { data: existing } = await supabase
    .from("tenants")
    .select("id,slug,owner_id")
    .eq("slug", slug)
    .maybeSingle();

  let tenant: { id: string; slug: string };

  if (existing) {
    // Slug owned by someone else → conflict
    if (existing.owner_id !== userId) {
      return NextResponse.json({ error: "Subdomain taken" }, { status: 409 });
    }
    // Slug owned by this user (previous incomplete attempt) → reuse
    tenant = { id: existing.id, slug: existing.slug };
  } else {
    // Resolve referral code to staff id
    let referredByStaffId: string | null = null;
    if (referralCode) {
      const { data: staffRow } = await supabase.from("pc_staff").select("id").eq("referral_code", referralCode).eq("status", "active").maybeSingle();
      referredByStaffId = staffRow?.id ?? null;
    }

    const { data: created, error } = await supabase
      .from("tenants")
      .insert({ slug, name: siteName, owner_id: userId, status: "onboarded", referred_by_staff_id: referredByStaffId })
      .select("id,slug")
      .single();

    if (error) {
      // Race condition or missed existing check — fetch and reuse if owned by this user
      if (error.code === "23505") {
        const { data: race } = await supabase
          .from("tenants")
          .select("id,slug,owner_id")
          .eq("slug", slug)
          .maybeSingle();
        if (race && race.owner_id === userId) {
          tenant = { id: race.id, slug: race.slug };
        } else {
          return NextResponse.json({ error: "Subdomain taken" }, { status: 409 });
        }
      } else {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      tenant = created;
    }
  }

  // Upsert member (idempotent)
  await supabase.from("tenant_members").upsert(
    { tenant_id: tenant.id, user_id: userId, role: "owner", joined_at: new Date().toISOString() },
    { onConflict: "tenant_id,user_id" },
  );

  // Upsert subscription row — no trial_ends_at set here any more. It stays
  // null unless a staff member grants one manually for a specific customer
  // (see super-admin subscription edit), rather than every signup getting
  // one automatically.
  await supabase.from("subscriptions").upsert(
    {
      tenant_id: tenant.id, plan_id: planId ?? "basic", status: "onboarded",
      billing_cycle: billingCycle, payment_method: payMethod,
    },
    { onConflict: "tenant_id" },
  );

  // Upsert site_settings (idempotent)
  await supabase.from("site_settings").upsert(
    {
      tenant_id: tenant.id,
      site_name: siteName,
      site_description: "",
      site_url: `${(process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000").includes("localhost") ? "http" : "https"}://${slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000"}`,
      timezone: "UTC",
      language: "en",
      maintenance_mode: false,
      site_theme: "system",
      currency: "USD",
      currency_symbol: "$",
      currency_position: "before",
    },
    { onConflict: "tenant_id" },
  );

  // Apply template (seeding is best-effort — don't fail tenant creation if it errors).
  // Always called: "blank" or an unknown slug seeds a minimal starter site, so a
  // tenant is never left fully empty.
  await applyTemplateBySlug(
    supabase,
    tenant.id,
    templateId ?? "blank",
    (templateMode as "theme" | "full") ?? "full",
    { siteName },
  ).catch(err => console.error(`[apply-template] tenant=${tenant.id} slug=${templateId ?? "blank"}`, err));

  // ENM is deliberately NOT provisioned here. Creating an expert directory
  // account for everyone who signs up for a website produces listings nobody
  // asked for and inflates ENM's expert count with people who will never use
  // it. The owner opts in from the dashboard instead, which is also where we
  // collect the business details a real profile needs.

  return NextResponse.json({ tenantId: tenant.id, slug: tenant.slug });
}
