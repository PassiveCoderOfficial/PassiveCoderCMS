// Donor-module auth: phone + password accounts stored on the donors table
// itself, session in a signed HTTP-only cookie. Deliberately independent of
// Supabase auth — donor contributors never touch the SaaS dashboard.

import { createHash, createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";

export const DONOR_COOKIE = "donor_session";
const SESSION_DAYS = 30;

function secret(): string {
  // Dedicated secret preferred; service-role key digest as deterministic fallback
  return process.env.DONOR_SESSION_SECRET
    ?? createHash("sha256").update(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev").digest("hex");
}

// ── Passwords (scrypt) ────────────────────────────────────────────────────────
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

// ── Sessions (HMAC-signed token) ─────────────────────────────────────────────
export function signSession(donorId: string, tenantId: string): string {
  const payload = Buffer.from(JSON.stringify({
    d: donorId, t: tenantId, e: Date.now() + SESSION_DAYS * 86400_000,
  })).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined): { donorId: string; tenantId: string } | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(sig); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data.e !== "number" || data.e < Date.now()) return null;
    return { donorId: data.d, tenantId: data.t };
  } catch {
    return null;
  }
}

/** Current logged-in donor for this tenant, or null. */
export async function getDonorSession(tenantId: string) {
  const cookieStore = await cookies();
  const parsed = verifySessionToken(cookieStore.get(DONOR_COOKIE)?.value);
  if (!parsed || parsed.tenantId !== tenantId) return null;
  const supabase = await createAdminClient();
  const { data } = await supabase.from("donors")
    .select("id, name, phone, blood_group, is_active")
    .eq("id", parsed.donorId).eq("tenant_id", tenantId).maybeSingle();
  return data?.is_active ? data : null;
}

// ── Phone normalization (BD) ─────────────────────────────────────────────────
/** "01678669699" / "+8801678669699" / "8801678669699" → "+8801678669699"; null if invalid. */
export function normalizeBdPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  let local: string;
  if (digits.length === 11 && digits.startsWith("01")) local = digits;
  else if (digits.length === 13 && digits.startsWith("8801")) local = "0" + digits.slice(3);
  else if (digits.length === 14 && digits.startsWith("88001")) local = digits.slice(3);
  else return null;
  if (!/^01[3-9]\d{8}$/.test(local)) return null;
  return "+88" + local;
}

/** "+8801678669699" → "01678669699" for display. */
export function displayBdPhone(normalized: string | null | undefined): string {
  if (!normalized) return "";
  return normalized.startsWith("+88") ? normalized.slice(3) : normalized;
}

// ── OTP ──────────────────────────────────────────────────────────────────────
export function hashOtp(code: string): string {
  return createHash("sha256").update(code + secret()).digest("hex");
}

export function generateOtp(): string {
  return String(randomInt(100000, 1000000)); // 6 digits
}

const OTP_TTL_MIN = 5;

export async function createAndSendOtp(
  tenantId: string, phone: string,
  purpose: "signup" | "reset" | "claim",
  payload: Record<string, unknown> = {},
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createAdminClient();

  // Throttle: max 3 OTPs per phone/purpose per 15 minutes
  const { count } = await supabase.from("donor_otps")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId).eq("phone", phone).eq("purpose", purpose)
    .gte("created_at", new Date(Date.now() - 15 * 60_000).toISOString());
  if ((count ?? 0) >= 3) return { ok: false, error: "Too many codes requested — try again later" };

  const code = generateOtp();
  await supabase.from("donor_otps").insert({
    tenant_id: tenantId, phone, purpose,
    code_hash: hashOtp(code), payload,
    expires_at: new Date(Date.now() + OTP_TTL_MIN * 60_000).toISOString(),
  });

  const sms = await sendOtpSms(phone, code, purpose);
  if (!sms.ok) return { ok: false, error: sms.error === "sms_not_configured"
    ? "SMS service is not configured yet — contact the site admin"
    : "Could not send SMS — check the number and try again" };
  return { ok: true };
}

async function sendOtpSms(phone: string, code: string, purpose: string) {
  const { sendSms } = await import("@/lib/sms");
  const label = purpose === "signup" ? "sign up" : purpose === "reset" ? "reset your password" : "claim your donor profile";
  return sendSms(phone, `Your code to ${label} is ${code}. Valid for ${OTP_TTL_MIN} minutes.`);
}

/** Verify + consume an OTP. Returns its payload on success. */
export async function consumeOtp(
  tenantId: string, phone: string, purpose: string, code: string,
): Promise<{ ok: boolean; payload?: Record<string, unknown>; error?: string }> {
  const supabase = await createAdminClient();
  const { data: otp } = await supabase.from("donor_otps")
    .select("*")
    .eq("tenant_id", tenantId).eq("phone", phone).eq("purpose", purpose)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1).maybeSingle();

  if (!otp) return { ok: false, error: "Code expired — request a new one" };
  if (otp.attempts >= 5) return { ok: false, error: "Too many attempts — request a new code" };

  if (otp.code_hash !== hashOtp(code)) {
    await supabase.from("donor_otps").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
    return { ok: false, error: "Wrong code" };
  }

  await supabase.from("donor_otps").update({ used_at: new Date().toISOString() }).eq("id", otp.id);
  return { ok: true, payload: otp.payload ?? {} };
}
