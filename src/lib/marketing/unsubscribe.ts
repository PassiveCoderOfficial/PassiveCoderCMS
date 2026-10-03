import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const secret = () => process.env.UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function sign(contactId: string) {
  return createHmac("sha256", secret()).update(`unsub:${contactId}`).digest("base64url").slice(0, 32);
}

/** Signed one-click unsubscribe link for a contact; works without logging in. */
export function unsubscribeUrl(contactId: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://www.passivecoder.com";
  return `${base.replace(/\/$/, "")}/api/marketing/unsubscribe?c=${contactId}&s=${sign(contactId)}`;
}

export function verifyUnsubscribe(contactId: string, sig: string) {
  const want = Buffer.from(sign(contactId));
  const got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got);
}
