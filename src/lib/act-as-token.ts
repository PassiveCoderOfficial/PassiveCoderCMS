import { createHmac, timingSafeEqual } from "node:crypto";
import { appSecret } from "@/lib/app-secret";

/**
 * The signed "Enter as" cookie (src/lib/staff-act-as.ts). No imports beyond
 * node:crypto so the Supabase fetch wrapper (lib/supabase/public-cache.ts)
 * can read it without a cycle. The cookie only names who a super admin is
 * acting as; every use re-checks the session and the database.
 */

export const ACT_AS_COOKIE = "pc_act_as";
export const ACT_AS_HEADER = "x-pc-acting-as";
export const ACT_AS_TTL_S = 60 * 60;

const sign = (value: string) =>
  createHmac("sha256", `${appSecret()}|act-as`).update(value).digest("hex").slice(0, 40);

export function mintActAs(saUserId: string, targetUserId: string, now = Date.now()): { value: string; expiresAt: number } {
  const exp = Math.floor(now / 1000) + ACT_AS_TTL_S;
  const body = `${saUserId}.${targetUserId}.${exp}`;
  return { value: `${body}.${sign(body)}`, expiresAt: exp * 1000 };
}

/** The cookie's content if the signature holds and it has not expired, else null. */
export function parseActAs(value: string | null | undefined, now = Date.now()): { saUserId: string; targetUserId: string; expiresAt: number } | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 4) return null;
  const [sa, target, exp, mac] = parts;
  const uuid = /^[0-9a-f-]{36}$/i;
  if (!uuid.test(sa) || !uuid.test(target) || !/^\d+$/.test(exp)) return null;
  const want = Buffer.from(sign(`${sa}.${target}.${exp}`));
  const got = Buffer.from(mac);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  const expiresAt = Number(exp) * 1000;
  if (expiresAt <= now) return null;
  return { saUserId: sa, targetUserId: target, expiresAt };
}

/** Is this request part of the Staff Portal? Pages by their path, API calls by the page that made them (same host). */
export function onStaffPortal(h: Headers): boolean {
  const isPortal = (p: string) => p === "/staff" || p.startsWith("/staff/");
  if (isPortal(h.get("x-pathname") ?? "")) return true;
  const ref = h.get("referer");
  if (!ref) return false;
  try {
    const u = new URL(ref);
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host && u.host !== host) return false;
    return isPortal(u.pathname);
  } catch {
    return false;
  }
}

/** Read one cookie from a raw Cookie header. */
export function cookieFrom(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(/;\s*/)) {
    if (part.startsWith(`${name}=`)) {
      try { return decodeURIComponent(part.slice(name.length + 1)); } catch { return null; }
    }
  }
  return null;
}
