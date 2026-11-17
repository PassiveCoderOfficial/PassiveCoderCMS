import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { APP_URL, isStandalone } from "@/lib/flags";
import { applyTemplateBySlug } from "@/modules/templates/apply-by-slug";
import { ensureBookingNav } from "@/lib/booking/nav";
import { clearStandaloneTenantCache } from "@/lib/tenant/standalone";

/*
 * First-run setup of a standalone (self-hosted) install: creates the admin
 * account and the install's single site. Works only while no site exists;
 * after that it refuses, and the proxy sends /setup to /login.
 *
 * Until then anyone who can reach the install could run it, so:
 * - when SETUP_TOKEN is set, the same value must be typed on the setup page;
 * - the site row is created BEFORE any account is touched (slug is unique, so
 *   only one caller ever gets past that point);
 * - an account that already exists is never reused: its password is not ours
 *   to change. Setup always makes a new admin account.
 *
 * Slug "site" is internal only: a standalone site is always served on the
 * install's own domain (lib/tenant/site-urls.ts).
 */

const Body = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8).max(200),
  siteName: z.string().trim().min(1).max(80),
  language: z.enum(["en", "bn", "ar"]).default("en"),
  timezone: z.string().trim().max(64).optional(),
  token: z.string().max(500).optional(),
});

/** Constant-time compare (hashing first makes the lengths equal). */
function sameSecret(a: string, b: string): boolean {
  const h = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(h(a), h(b));
}

export async function POST(req: Request) {
  if (!isStandalone) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill in every field. The password needs at least 8 characters." }, { status: 400 });
  }
  const { email, password, siteName, language } = parsed.data;

  const setupToken = process.env.SETUP_TOKEN?.trim();
  if (setupToken && !sameSecret(parsed.data.token?.trim() ?? "", setupToken)) {
    return NextResponse.json({ error: "The setup code is not right. It is the SETUP_TOKEN value in this install's environment settings." }, { status: 403 });
  }
  const timezone = parsed.data.timezone && isValidTimeZone(parsed.data.timezone) ? parsed.data.timezone : "UTC";

  const admin = await createAdminClient();
  const { count, error: countErr } = await admin.from("tenants").select("id", { count: "exact", head: true });
  if (countErr) return NextResponse.json({ error: "Could not reach the database." }, { status: 503 });
  if ((count ?? 0) > 0) return NextResponse.json({ error: "This site is already set up. Please sign in." }, { status: 409 });

  // The site first, with no owner yet. slug is unique, so a second setup
  // racing this one fails here, before it has touched any account.
  const { data: tenant, error: tenantErr } = await admin
    .from("tenants")
    .insert({ slug: "site", name: siteName, status: "active", plan: "selfhost", onboarding_completed: true })
    .select("id")
    .single();
  if (tenantErr || !tenant) return NextResponse.json({ error: "This site is already set up. Please sign in." }, { status: 409 });

  // The admin account: always a new one. If it can't be made (the email is
  // already registered, say) the site row is taken back so setup can run again.
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  const userId = created.data.user?.id ?? null;
  const owned = userId
    ? await admin.from("tenants").update({ owner_id: userId }).eq("id", tenant.id)
    : null;
  if (!userId || owned?.error) {
    if (userId) await admin.auth.admin.deleteUser(userId).catch(() => {});
    await admin.from("tenants").delete().eq("id", tenant.id);
    clearStandaloneTenantCache();
    const taken = /already|registered|exists/i.test(created.error?.message ?? "");
    return NextResponse.json({
      error: taken
        ? "An account with this email already exists. Use a different email, or remove that account in Supabase (Authentication > Users) and try again."
        : created.error?.message ?? "Could not create the account.",
    }, { status: 400 });
  }

  await admin.from("tenant_members").upsert(
    { tenant_id: tenant.id, user_id: userId, role: "owner", joined_at: new Date().toISOString() },
    { onConflict: "tenant_id,user_id" },
  );
  await admin.from("site_settings").upsert(
    {
      tenant_id: tenant.id,
      site_name: siteName,
      site_description: "",
      site_url: APP_URL,
      timezone,
      language,
      maintenance_mode: false,
      site_theme: "system",
      currency: "USD",
      currency_symbol: "$",
      currency_position: "before",
    },
    { onConflict: "tenant_id" },
  );

  // Starter pages, header and footer (best effort: the site works without them).
  await applyTemplateBySlug(admin, tenant.id, "blank", "full", { siteName })
    .catch((err) => console.error(`[setup] starter template tenant=${tenant.id}`, err));
  await admin.rpc("ensure_booking_defaults", { p_tenant: tenant.id });
  await ensureBookingNav(admin, tenant.id).catch((err) => console.error(`[setup] booking nav tenant=${tenant.id}`, err));

  clearStandaloneTenantCache();
  return NextResponse.json({ ok: true });
}

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
