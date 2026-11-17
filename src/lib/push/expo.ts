// Expo push for the mobile admin app: send in batches of 100, prune tokens
// the ticket already marks dead, and keep ok tickets so checkPushReceipts()
// can prune tokens whose receipt later says DeviceNotRegistered.

import type { SupabaseClient } from "@supabase/supabase-js";

const SEND_URL = "https://exp.host/--/api/v2/push/send";
const RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";

export interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  channelId: string;
  badge?: number;
}

interface Ticket { status: "ok" | "error"; id?: string; details?: { error?: string } }

function headers() {
  const h: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  if (process.env.EXPO_ACCESS_TOKEN) h.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  return h;
}

export interface ExpoSendResult {
  sent: number;
  /** Tokens Expo says are no longer registered: delete them. */
  dead: string[];
  /** Ok tickets, for a later receipt check. */
  tickets: { ticket_id: string; expo_token: string }[];
}

/** POST messages to Expo in batches of 100. Best-effort; never throws.
 *  Shared by the admin app and the rider app (food delivery). */
export async function postExpo(messages: (ExpoMessage & { sound?: string; priority?: "high" | "normal"; ttl?: number })[]): Promise<ExpoSendResult> {
  let sent = 0;
  const dead: string[] = [];
  const tickets: { ticket_id: string; expo_token: string }[] = [];
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      const res = await fetch(SEND_URL, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(chunk.map((m) => ({ sound: "default", priority: "high", ...m }))),
      });
      if (!res.ok) continue;
      const json = (await res.json().catch(() => null)) as { data?: Ticket[] } | null;
      (json?.data ?? []).forEach((t, j) => {
        const token = chunk[j]?.to;
        if (!token) return;
        if (t.status === "ok") { sent++; if (t.id) tickets.push({ ticket_id: t.id, expo_token: token }); }
        else if (t.details?.error === "DeviceNotRegistered") dead.push(token);
      });
    } catch {
      // Push is best-effort.
    }
  }
  return { sent, dead, tickets };
}

/** Best-effort; never throws. Returns how many Expo accepted. */
export async function sendAdminExpo(admin: SupabaseClient, messages: ExpoMessage[]): Promise<{ sent: number; dead: number }> {
  const { sent, dead, tickets: keep } = await postExpo(messages);
  if (dead.length) await admin.from("admin_app_devices").delete().in("expo_token", dead);
  if (keep.length) await admin.from("admin_push_tickets").upsert(keep, { onConflict: "ticket_id", ignoreDuplicates: true });
  return { sent, dead: dead.length };
}

/** Fetch receipts for tickets older than 15 min (Expo's advice), prune dead
 *  tokens, drop processed tickets. Cheap; called from crons and after sends. */
export async function checkPushReceipts(admin: SupabaseClient, limit = 300): Promise<{ checked: number; pruned: number }> {
  const cutoff = new Date(Date.now() - 15 * 60_000).toISOString();
  const { data: rows } = await admin.from("admin_push_tickets").select("ticket_id, expo_token")
    .lt("created_at", cutoff).order("created_at").limit(limit);
  if (!rows?.length) return { checked: 0, pruned: 0 };
  const dead = new Set<string>();
  const done: string[] = [];
  for (let i = 0; i < rows.length; i += 300) {
    const chunk = rows.slice(i, i + 300);
    try {
      const res = await fetch(RECEIPTS_URL, { method: "POST", headers: headers(), body: JSON.stringify({ ids: chunk.map((r) => r.ticket_id) }) });
      if (!res.ok) continue;
      const json = (await res.json().catch(() => null)) as { data?: Record<string, Ticket> } | null;
      const receipts = json?.data ?? {};
      for (const r of chunk) {
        const rc = receipts[r.ticket_id];
        if (rc?.status === "error" && rc.details?.error === "DeviceNotRegistered") dead.add(r.expo_token);
        done.push(r.ticket_id); // missing receipt after 15 min = expired/delivered, either way done
      }
    } catch { /* retry next run */ }
  }
  if (dead.size) await admin.from("admin_app_devices").delete().in("expo_token", Array.from(dead));
  if (done.length) await admin.from("admin_push_tickets").delete().in("ticket_id", done);
  // Anything older than a day is past Expo's receipt window.
  await admin.from("admin_push_tickets").delete().lt("created_at", new Date(Date.now() - 864e5).toISOString());
  return { checked: done.length, pruned: dead.size };
}
