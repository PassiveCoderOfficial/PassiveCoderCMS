// Shared browser push (VAPID) core. Feature modules own their subscription
// tables; this only delivers and reports which endpoints the browser has
// dropped so the caller can prune them from the right table.

import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/server";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";

let configured = false;
function configure(): boolean {
  if (configured) return true;
  if (!PUBLIC_KEY || !PRIVATE_KEY) return false;
  webpush.setVapidDetails("mailto:contact@passivecoder.com", PUBLIC_KEY, PRIVATE_KEY);
  configured = true;
  return true;
}

export interface PushSub {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  /** Notifications with the same tag replace each other instead of stacking. */
  tag?: string;
  icon?: string;
  [extra: string]: unknown;
}

/** Send to every subscription. Returns the count sent and the endpoints that
 *  answered 404/410 (browser unsubscribed) for the caller to delete. */
export async function deliverWebPush(
  subs: PushSub[], payload: PushPayload,
): Promise<{ sent: number; dead: string[] }> {
  if (!configure() || !subs.length) return { sent: 0, dead: [] };
  const dead: string[] = [];
  let sent = 0;
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
        { TTL: 3600, urgency: "high" },
      );
      sent++;
    } catch (err) {
      const code = (err as { statusCode?: number })?.statusCode;
      if (code === 410 || code === 404) dead.push(s.endpoint);
    }
  }));
  return { sent, dead };
}

/** Notify a signed-in user on every device they've opted in from. */
export async function pushToUser(
  tenantId: string, userId: string, payload: PushPayload,
): Promise<{ sent: number }> {
  const admin = await createAdminClient();
  const { data } = await admin
    .from("web_push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId);
  const { sent, dead } = await deliverWebPush((data ?? []) as PushSub[], payload);
  if (dead.length) {
    await admin.from("web_push_subscriptions").delete().in("endpoint", dead);
  }
  return { sent };
}
