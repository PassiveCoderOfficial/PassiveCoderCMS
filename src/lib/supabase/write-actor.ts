import { createHmac, timingSafeEqual } from "node:crypto";
import { appSecret } from "@/lib/app-secret";

/**
 * Who is behind a service-role database write, for the action list (migration 209).
 *
 * Most API routes write with the service-role client, so the database can't tell
 * who asked. The proxy checks the session and passes the user on in a request
 * header, signed so a visitor can't send it themselves. public-cache.ts verifies
 * it on writes and forwards the plain id to Supabase, where a trigger reads it.
 * The trigger only believes it on a service-role request.
 *
 * Attribution only: nothing grants access from this.
 */
export const ACTOR_HEADER = "x-pc-actor";
export const ACTOR_VIA_HEADER = "x-pc-actor-via";
/** Set on every database write this app makes (migration 227 skips them). */
export const ORIGIN_HEADER = "x-pc-origin";

export type ActorVia = "web" | "app";
export type WriteActor = { userId: string; via: ActorVia };

const sign = (value: string) =>
  createHmac("sha256", `${appSecret()}|write-actor`).update(value).digest("hex").slice(0, 32);

export function signActor(actor: WriteActor): string {
  const value = `${actor.userId}.${actor.via}`;
  return `${value}.${sign(value)}`;
}

export function verifyActor(header: string | null | undefined): WriteActor | null {
  if (!header) return null;
  const [userId, via, mac] = header.split(".");
  if (!userId || !mac || (via !== "web" && via !== "app")) return null;
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return null;
  const want = Buffer.from(sign(`${userId}.${via}`));
  const got = Buffer.from(mac);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  return { userId, via };
}

/**
 * Routes a visitor uses: forms, checkout, bookings, site chat. A team member who is
 * signed in and fills in a form on a site is acting as a visitor there, so no actor is
 * stamped and the row is counted as public (migration 211). Only the public method:
 * PATCH on /api/ecommerce/orders/[id] or POST on /api/ecommerce/reservations are staff.
 * Marketplace checkout places the order with PUT, and guest reservations also use PUT.
 */
const PUBLIC_POST = /^\/api\/(contact\/(submit|upload)|public\/.+|storefront\/.+|store-reviews|marketing-lead|marketing\/(subscribe|unsubscribe)|real-estate\/public\/.+|marketplace\/public\/.+|bookings\/(public|manage)|ecommerce\/(orders|price-request|payment-proof)|testimonials\/submit|vendor\/signup|donors\/(auth\/.+|requests)|site-chat(\/(photo|visit))?|experts\/(lead|reviews))\/?$/;

const PUBLIC_PUT = /^\/api\/(storefront\/checkout|ecommerce\/reservations)\/?$/;

export function isPublicWrite(method: string, pathname: string): boolean {
  const m = method.toUpperCase();
  if (m === "PUT") return PUBLIC_PUT.test(pathname);
  return m === "POST" && PUBLIC_POST.test(pathname);
}

export type AuthWrite = { action: string; target: string | null; args: Record<string, unknown> };

/**
 * A Supabase Auth admin call, in action-list terms. These change auth.users, which
 * the triggers don't watch. Reads field names only: a password never leaves here,
 * only the fact that one was set.
 */
export function describeAuthWrite(url: string, method: string, body: unknown): AuthWrite | null {
  let path: string;
  try { path = new URL(url).pathname; } catch { return null; }
  let data: Record<string, unknown> = {};
  if (typeof body === "string") {
    try { const parsed = JSON.parse(body); if (parsed && typeof parsed === "object") data = parsed; } catch { /* no fields to read */ }
  }
  const email = typeof data.email === "string" ? data.email : undefined;
  const m = method.toUpperCase();

  if (path.endsWith("/auth/v1/invite") && m === "POST") return { action: "user.invite", target: null, args: { email } };
  if (path.endsWith("/auth/v1/admin/generate_link") && m === "POST") {
    return data.type === "recovery" ? { action: "user.reset_link", target: null, args: { email } } : null;
  }
  if (path.endsWith("/auth/v1/admin/users") && m === "POST") {
    return { action: "user.create", target: null, args: { email, credentialsSet: "password" in data } };
  }
  const one = /\/auth\/v1\/admin\/users\/([0-9a-f-]{36})$/i.exec(path);
  if (!one) return null;
  if (m === "DELETE") return { action: "user.delete", target: one[1], args: {} };
  if (m !== "PUT") return null;
  if ("password" in data) return { action: "user.password", target: one[1], args: {} };
  if ("ban_duration" in data) return { action: "user.ban", target: one[1], args: { banned: data.ban_duration !== "none" } };
  if ("email" in data) return { action: "user.email", target: one[1], args: { email } };
  if ("email_confirm" in data) return { action: "user.verify", target: one[1], args: {} };
  return null;
}
