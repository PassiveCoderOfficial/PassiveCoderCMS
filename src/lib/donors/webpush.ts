// Browser push (VAPID). The native app uses Expo tokens (lib/donors/push.ts);
// this is the web equivalent so donors get urgent requests even with the site
// closed. Dead subscriptions (410/404) are pruned as we find them.

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

export interface WebPushSub {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface WebPushPayload {
  title: string;
  body: string;
  url?: string;
  requestId?: string;
}

export async function sendWebPush(
  tenantId: string, subs: WebPushSub[], payload: WebPushPayload,
): Promise<{ sent: number }> {
  if (!configure() || !subs.length) return { sent: 0 };

  const supabase = await createAdminClient();
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
      // 410 Gone / 404 Not Found = the browser dropped this subscription.
      if (code === 410 || code === 404) dead.push(s.endpoint);
    }
  }));

  if (dead.length) {
    await supabase.from("donor_web_push")
      .delete().eq("tenant_id", tenantId).in("endpoint", dead);
  }
  return { sent };
}
