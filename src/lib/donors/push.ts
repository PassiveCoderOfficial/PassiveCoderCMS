// Expo push notifications. Expo's service fronts FCM/APNs, so no Firebase
// credentials are needed server-side — just the device's Expo token.

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface PushMessage {
  to: string;                              // Expo push token
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/** Send in chunks of 100 (Expo's documented limit). Best-effort. */
export async function sendExpoPush(messages: PushMessage[]): Promise<{ sent: number }> {
  if (!messages.length) return { sent: 0 };
  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100).map((m) => ({
      to: m.to, title: m.title, body: m.body, data: m.data ?? {},
      sound: "default", priority: "high", channelId: "urgent",
    }));
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(chunk),
      });
      if (res.ok) sent += chunk.length;
    } catch {
      // Push is best-effort — a failed batch must never fail the request.
    }
  }
  return { sent };
}
