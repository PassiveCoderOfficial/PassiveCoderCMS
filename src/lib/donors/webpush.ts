// Browser push for donors. The native app uses Expo tokens (lib/donors/push.ts);
// this is the web equivalent so donors get urgent requests even with the site
// closed. Delivery lives in lib/push/web-push.ts; this only owns the donor
// subscription table and prunes dead endpoints from it.

import { createAdminClient } from "@/lib/supabase/server";
import { deliverWebPush, type PushSub } from "@/lib/push/web-push";

export type WebPushSub = PushSub;

export interface WebPushPayload {
  [extra: string]: unknown;
  title: string;
  body: string;
  url?: string;
  requestId?: string;
}

export async function sendWebPush(
  tenantId: string, subs: WebPushSub[], payload: WebPushPayload,
): Promise<{ sent: number }> {
  const { sent, dead } = await deliverWebPush(subs, payload);
  if (dead.length) {
    const supabase = await createAdminClient();
    await supabase.from("donor_web_push")
      .delete().eq("tenant_id", tenantId).in("endpoint", dead);
  }
  return { sent };
}
