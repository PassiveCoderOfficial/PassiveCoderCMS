import { NextResponse } from "next/server";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { APP_URL, ROOT_DOMAIN } from "@/lib/flags";
import { applyTemplateBySlug } from "@/modules/templates/apply-by-slug";
import { ensureBookingNav } from "@/lib/booking/nav";
import { clearStandaloneTenantCache } from "@/lib/tenant/standalone";
import { CURRENCIES } from "@/lib/currency/currencies";
import { checkLicenceText, clearLicenceCache } from "@/lib/licence/verify";
import { normalizeDomain } from "@/lib/licence/format";
import { installerAccess } from "@/lib/installer/server";
import { hasWritableDisk, licenceFilePath, saveLocalSettings } from "@/lib/installer/local-settings";
import { isSender, isUuid, isValidTimeZone, senderAddress } from "@/lib/installer/validate";

/*
 * Last step of the web installer on a standalone (self-hosted) install:
 * creates the admin account and the install's single site, then saves the
 * optional extras the owner chose (starter content, outgoing email, AI key,
 * module licence). Works only while no site exists; after that it refuses,
 * and the proxy sends /setup to /login.
 *
 * Until then anyone who can reach the install could run it, so:
 * - when SETUP_TOKEN is set, the same value must be given (the "x-setup-token"
 *   header, or `token` in the body);
 * - the site row is created BEFORE any account is touched (slug is unique, so
 *   only one caller ever gets past that point);
 * - an account that already exists is never reused: its password is not ours
 *   to change. Setup always makes a new admin account.
 *
 * Slug "site" is internal only: a standalone site is always served on the
 * install's own domain (lib/tenant/site-urls.ts).
 *
 * Optional extras never stop the install: each one reports "saved", "manual"
 * (this host has no disk, so the owner adds the setting in the host's panel)
 * or "skipped", and the finish screen says what to do.
 */

export const maxDuration = 120;

const Body = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8).max(200),
  siteName: z.string().trim().min(1).max(80),
  language: z.enum(["en", "bn", "ar"]).default("en"),
  timezone: z.string().trim().max(64).optional(),
  currency: z.string().trim().toUpperCase().max(8).optional(),
  /** "starter" (default), "empty", or the slug of a published template. */
  template: z.string().trim().max(120).optional(),
  token: z.string().max(500).optional(),
  emailSettings: z.object({
    apiKey: z.string().trim().max(300).optional(),
    smtp: z.object({
      host: z.string().trim().max(200).regex(/^[A-Za-z0-9.-]*$/),
      port: z.coerce.number().int().min(1).max(65535).optional(),
      user: z.string().trim().max(200).optional(),
      pass: z.string().max(300).optional(),
    }).optional(),
    from: z.string().trim().max(200),
  }).optional(),
  aiKey: z.string().trim().max(300).optional(),
  licence: z.string().max(20_000).optional(),
});

type Saved = "saved" | "manual" | "skipped" | "invalid";

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const bodyToken = raw && typeof raw === "object" && typeof (raw as { token?: unknown }).token === "string" ? (raw as { token: string }).token : null;
  const access = await installerAccess(req, "write", { scope: "install", max: 15, bodyToken });
  if (!access.ok) return access.response;

  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill in every field. The password needs at least 8 characters.", code: "bad_request" }, { status: 400 });
  }
  const { email, password, siteName, language } = parsed.data;
  const timezone = parsed.data.timezone && isValidTimeZone(parsed.data.timezone) ? parsed.data.timezone : "UTC";
  const currency = CURRENCIES.find((c) => c.code === parsed.data.currency) ?? CURRENCIES.find((c) => c.code === "USD")!;

  // A licence is signed for one site id and one domain. Checked before the
  // site is made, so the site can be given the id the licence was issued for.
  let licence: { text: string; tenantId: string } | null = null;
  let licenceResult: Saved = "skipped";
  if (parsed.data.licence?.trim()) {
    const res = checkLicenceText(parsed.data.licence);
    const want = res.ok ? normalizeDomain(res.licence.domain) : "";
    if (res.ok && isUuid(res.licence.tenant_id) && [ROOT_DOMAIN, APP_URL].some((d) => normalizeDomain(d) === want)) {
      licence = { text: parsed.data.licence, tenantId: res.licence.tenant_id.toLowerCase() };
    } else licenceResult = "invalid";
  }

  const admin = await createAdminClient();
  const { count, error: countErr } = await admin.from("tenants").select("id", { count: "exact", head: true });
  if (countErr) return NextResponse.json({ error: "Could not reach the database.", code: "state_unknown" }, { status: 503 });
  if ((count ?? 0) > 0) return NextResponse.json({ error: "This site is already set up. Please sign in.", code: "installed" }, { status: 409 });

  // The site first, with no owner yet. slug is unique, so a second setup
  // racing this one fails here, before it has touched any account.
  const { data: tenant, error: tenantErr } = await admin
    .from("tenants")
    .insert({ ...(licence ? { id: licence.tenantId } : {}), slug: "site", name: siteName, status: "active", plan: "selfhost", onboarding_completed: true })
    .select("id")
    .single();
  if (tenantErr || !tenant) return NextResponse.json({ error: "This site is already set up. Please sign in.", code: "installed" }, { status: 409 });

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
      code: taken ? "email_taken" : "account_failed",
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
      currency: currency.code,
      currency_symbol: currency.symbol,
      currency_position: "before",
    },
    { onConflict: "tenant_id" },
  );

  // Starter pages, header and footer (best effort: the site works without
  // them). "empty" leaves the site without pages; an unknown template name
  // falls back to the starter site inside applyTemplateBySlug.
  const template = parsed.data.template || "starter";
  if (template !== "empty") {
    await applyTemplateBySlug(admin, tenant.id, template === "starter" ? "blank" : template, "full", { siteName })
      .catch((err) => console.error(`[setup] starter template tenant=${tenant.id}`, err));
  }
  await admin.rpc("ensure_booking_defaults", { p_tenant: tenant.id });
  await ensureBookingNav(admin, tenant.id).catch((err) => console.error(`[setup] booking nav tenant=${tenant.id}`, err));

  // ── Optional extras ────────────────────────────────────────────────────
  const disk = hasWritableDisk();

  let emailResult: Saved = "skipped";
  const es = parsed.data.emailSettings;
  const smtp = es?.smtp?.host ? es.smtp : null;
  if (es && isSender(es.from) && (smtp || es.apiKey || process.env.RESEND_API_KEY || process.env.SMTP_HOST)) {
    const values = {
      ...(smtp
        ? { SMTP_HOST: smtp.host, SMTP_PORT: String(smtp.port ?? 587), ...(smtp.user ? { SMTP_USER: smtp.user } : {}), ...(smtp.pass ? { SMTP_PASS: smtp.pass } : {}) }
        : es.apiKey ? { RESEND_API_KEY: es.apiKey } : {}),
      EMAIL_FROM: es.from,
      EMAIL_FROM_ADDRESS: senderAddress(es.from),
    };
    emailResult = disk && saveLocalSettings(values) ? "saved" : "manual";
  }

  let aiResult: Saved = "skipped";
  if (parsed.data.aiKey) aiResult = disk && saveLocalSettings({ PASSIVECODER_AI_KEY: parsed.data.aiKey }) ? "saved" : "manual";

  if (licence) {
    licenceResult = "manual";
    if (disk) {
      try {
        const file = licenceFilePath();
        mkdirSync(path.dirname(file), { recursive: true });
        writeFileSync(file, licence.text, { mode: 0o600 });
        clearLicenceCache();
        licenceResult = "saved";
      } catch (err) {
        console.error("[setup] could not save the licence file", err);
      }
    }
  }

  clearStandaloneTenantCache();
  return NextResponse.json({ ok: true, extras: { email: emailResult, ai: aiResult, licence: licenceResult } });
}
