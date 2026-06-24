import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const PARTNER_SECRET = process.env.PARTNER_SECRET;

export async function POST(req: NextRequest) {
  if (!PARTNER_SECRET || req.headers.get("x-partner-secret") !== PARTNER_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { email: string; name?: string; enmUserId: number; tier: "free" | "pro" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { email, name, enmUserId, tier } = body;
  if (!email || !enmUserId) {
    return NextResponse.json({ ok: false, error: "Missing email or enmUserId" }, { status: 400 });
  }

  const admin = await createAdminClient();

  // Find or create Supabase auth user
  const { data: { users } } = await admin.auth.admin.listUsers();
  let authUser = users.find(u => u.email === email);

  if (!authUser) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: name ?? email.split("@")[0], enm_source: true },
      password: crypto.randomUUID(), // random — user logs in via ENM SSO or password reset
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    authUser = created.user;
  }

  const userId = authUser.id;

  // Upsert profile
  await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      full_name: name ?? email.split("@")[0],
      role: "subscriber",
      is_active: true,
    },
    { onConflict: "id" },
  );

  if (tier === "pro") {
    // Create a "standalone" Pro subscription (no tenant yet)
    // We use a special tenant_id = null workaround: create a placeholder tenant row
    // so the FK constraint is satisfied. The user will complete onboarding to rename/set slug.
    // Check if they already have a pending tenant from a previous call
    const { data: existingTenant } = await admin
      .from("tenants")
      .select("id")
      .eq("owner_id", userId)
      .eq("status", "enm_pending")
      .maybeSingle();

    let tenantId: string;
    if (existingTenant) {
      tenantId = existingTenant.id;
    } else {
      const slugBase = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
      const slug = `${slugBase}-${Date.now().toString(36)}`;

      const { data: newTenant, error: tenantErr } = await admin
        .from("tenants")
        .insert({
          slug,
          name: name ?? email.split("@")[0],
          owner_id: userId,
          status: "enm_pending", // special status: Pro paid on ENM, site not set up yet
          enm_user_id: enmUserId,
          enm_tier: "pro",
        })
        .select("id")
        .single();

      if (tenantErr) return NextResponse.json({ ok: false, error: tenantErr.message }, { status: 500 });
      tenantId = newTenant.id;
    }

    // Upsert tenant_members so dashboard is accessible
    await admin.from("tenant_members").upsert(
      { tenant_id: tenantId, user_id: userId, role: "owner", joined_at: new Date().toISOString(), is_primary: true },
      { onConflict: "tenant_id,user_id" },
    );

    // Upsert Pro subscription (active, 1 year)
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    await admin.from("subscriptions").upsert(
      {
        tenant_id: tenantId,
        plan_id: "pro",
        status: "active",
        payment_provider: "enm",
        billing_cycle: "yearly",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        amount_cents: 48000,
        currency: "USD",
      },
      { onConflict: "tenant_id" },
    );
  }

  return NextResponse.json({ ok: true, userId, tier });
}
