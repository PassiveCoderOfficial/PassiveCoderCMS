import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { appSecret } from "@/lib/app-secret";

const secret = () => process.env.UNSUBSCRIBE_SECRET || appSecret();

export function signUnsubscribe(contactId: string) {
  return createHmac("sha256", secret()).update(`unsub:${contactId}`).digest("base64url").slice(0, 32);
}

/** Signed one-click unsubscribe link for a contact; works without logging in. */
export function unsubscribeUrl(contactId: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://passivecoder.com";
  return `${base.replace(/\/$/, "")}/api/marketing/unsubscribe?c=${contactId}&s=${signUnsubscribe(contactId)}`;
}

export function verifyUnsubscribe(contactId: string, sig: string) {
  const want = Buffer.from(signUnsubscribe(contactId));
  const got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got);
}
