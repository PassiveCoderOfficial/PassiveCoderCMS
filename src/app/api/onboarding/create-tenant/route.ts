import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { seedTemplate } from "@/lib/templates/seed-template";

export async function POST(req: Request) {
  const body = await req.json();
  const { siteName, slug, userId, planId, templateId, templateMode } = body;
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
    // Resolve referral code to agent id
    let referredByAgentId: string | null = null;
    if (referralCode) {
      const { data: agentRow } = await supabase.from("agents").select("id").eq("referral_code", referralCode).eq("status", "active").maybeSingle();
      referredByAgentId = agentRow?.id ?? null;
    }

    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: created, error } = await supabase
      .from("tenants")
      .insert({ slug, name: siteName, owner_id: userId, status: "trial", trial_ends_at: trialEndsAt, referred_by_agent_id: referredByAgentId })
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

  // Upsert subscription row with trial end date (14-day trial)
  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from("subscriptions").upsert(
    { tenant_id: tenant.id, plan_id: planId ?? "standard", status: "trial", trial_ends_at: trialEnd },
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
    },
    { onConflict: "tenant_id" },
  );

  // Apply template (seeding is best-effort — don't fail tenant creation if it errors)
  if (templateId && templateId !== "blank") {
    await seedTemplate(
      supabase,
      tenant.id,
      templateId,
      (templateMode as "theme" | "full") ?? "full",
    ).catch(err => console.error("[seed-template]", err));
  }

  return NextResponse.json({ tenantId: tenant.id, slug: tenant.slug });
}
