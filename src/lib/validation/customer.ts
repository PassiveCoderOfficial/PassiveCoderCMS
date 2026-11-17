/**
 * Storefront form checks, shared by the browser (instant messages under each
 * field) and the server actions (the same rules, so a bypassed form gets the
 * same answer). Each returns a message to show, or null when the value is fine.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Digits of a mobile number, normalised to the local 01XXXXXXXXX form for
 *  Bangladesh (+880 / 880 / 01…) and kept as-is (with +) elsewhere. */
export function normalizePhone(raw: string): string {
  const t = raw.trim().replace(/[\s\-().]/g, "");
  const digits = t.replace(/^\+/, "");
  if (/^8801\d{9}$/.test(digits)) return digits.slice(2);
  if (/^01\d{9}$/.test(digits)) return digits;
  return t.startsWith("+") ? `+${digits}` : digits;
}

export const isEmail = (v: string) => EMAIL.test(v.trim());
/** Looks like a phone number rather than an email (used by "email or mobile"). */
export const looksLikePhone = (v: string) => /^[+\d][\d\s\-().]{6,}$/.test(v.trim());

export function checkName(v: string): string | null {
  const t = v.trim();
  if (!t) return "Please enter your name";
  if (t.length < 2) return "Name looks too short";
  if (t.length > 80) return "Name is too long (80 characters max)";
  if (/[<>{}]|https?:/i.test(t)) return "Name can only have letters, spaces and . -";
  return null;
}

export function checkEmail(v: string, required = true): string | null {
  const t = v.trim();
  if (!t) return required ? "Please enter your email address" : null;
  if (!EMAIL.test(t)) return "That email doesn't look right. Example: name@gmail.com";
  return null;
}

export function checkPhone(v: string, required = true): string | null {
  const t = v.trim();
  if (!t) return required ? "Please enter your mobile number" : null;
  const n = normalizePhone(t);
  if (/^01/.test(n)) return /^01[3-9]\d{8}$/.test(n) ? null : "Enter an 11-digit mobile number, like 01712345678";
  if (/^\+?\d{8,15}$/.test(n)) return null;
  return "Enter a valid mobile number, like 01712345678";
}

export function checkEmailOrPhone(v: string): string | null {
  const t = v.trim();
  if (!t) return "Enter your email or mobile number";
  return looksLikePhone(t) ? checkPhone(t) : checkEmail(t);
}

export function checkPassword(v: string): string | null {
  if (!v) return "Please enter a password";
  if (v.length < 8) return "Use at least 8 characters";
  if (v.length > 72) return "Password is too long (72 characters max)";
  if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return "Mix letters and numbers to make it stronger";
  return null;
}

export function checkAddress(v: string): string | null {
  const t = v.trim();
  if (!t) return "Please enter your delivery address";
  if (t.length < 8) return "Add house, road and area so the courier can find you";
  if (t.length > 300) return "Address is too long (300 characters max)";
  return null;
}

/** 0-4 strength score for the meter under a new password. */
export function passwordScore(v: string): number {
  let s = 0;
  if (v.length >= 8) s++;
  if (v.length >= 12) s++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
  if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) s++;
  return s;
}

/** Supabase auth errors in plain words. */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "That email/mobile and password don't match. Try again or reset your password.";
  if (m.includes("already registered") || m.includes("already been registered") || m.includes("already exists")) return "An account with this email already exists. Sign in instead.";
  if (m.includes("email not confirmed")) return "Please confirm your email first. Check your inbox for the link.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many tries. Please wait a minute and try again.";
  if (m.includes("weak") || m.includes("password should")) return "Choose a stronger password: at least 8 characters with letters and numbers.";
  if (m.includes("same") && m.includes("password")) return "Your new password must be different from the old one.";
  return "Something went wrong. Please try again.";
}
