import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { emailKey, pickBlock, phoneKey, senderKeys, type BlockRow, type Sender } from "./rules";

/**
 * The check every public form and the site chat run before doing anything.
 * Nothing here may break a real visitor's submit: on any error it lets them
 * through. A stopped entry goes to the site's Spam folder so it can be undone.
 */
type Admin = Awaited<ReturnType<typeof createAdminClient>>;

const SPAM_KEEP_DAYS = 30;

/** The active block for this sender on this site (or across all sites), counting the hit. */
export async function findBlock(admin: Admin, tenantId: string | null, sender: Sender): Promise<BlockRow | null> {
  const keys = senderKeys(sender);
  if (!keys.length) return null;
  const q = admin.from("contact_blocks").select("id, tenant_id, kind, value, effect, expires_at, hits").in("value", keys.map((k) => k.value));
  const { data } = await (tenantId ? q.or(`tenant_id.eq.${tenantId},tenant_id.is.null`) : q.is("tenant_id", null));
  const block = pickBlock((data ?? []) as BlockRow[], keys);
  if (block) await admin.from("contact_blocks").update({ hits: block.hits + 1, last_hit_at: new Date().toISOString() }).eq("id", block.id);
  return block;
}

export async function recordSpam(admin: Admin, e: {
  tenantId: string;
  source: string;
  reason: string;
  sender: Sender;
  data?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}): Promise<void> {
  await admin.from("spam_entries").insert({
    tenant_id: e.tenantId, source: e.source, reason: e.reason,
    sender_email: e.sender.email?.trim().slice(0, 200) || null, sender_phone: e.sender.phone?.trim().slice(0, 60) || null,
    ip: e.sender.ip && e.sender.ip !== "unknown" ? e.sender.ip : null,
    data: e.data ?? {}, meta: { ...(e.meta ?? {}), ...(e.sender.session ? { session: e.sender.session } : {}) },
  });
  // Old spam clears itself, so a bot flood can't grow the table for ever.
  if (Math.random() < 0.02) {
    await admin.from("spam_entries").delete().eq("tenant_id", e.tenantId)
      .lt("created_at", new Date(Date.now() - SPAM_KEEP_DAYS * 86_400_000).toISOString());
  }
}

/** True when the sender is banned: the entry is logged and the caller should pretend it worked. */
export async function isBlockedSender(tenantId: string | null, sender: Sender, source: string, data?: Record<string, unknown>): Promise<boolean> {
  try {
    const admin = await createAdminClient();
    const block = await findBlock(admin, tenantId, sender);
    if (!block) return false;
    if (tenantId) await recordSpam(admin, { tenantId, source, reason: "banned", sender, data });
    return true;
  } catch (e) {
    console.error("[isBlockedSender]", source, e instanceof Error ? e.message : e);
    return false;
  }
}

/** Submissions from this sender on this site in the last 24h. */
export async function recentFromSender(admin: Admin, tenantId: string, sender: Sender): Promise<number> {
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const count = async (column: "sender_email" | "sender_phone", value: string | null) => {
    if (!value) return 0;
    const { count: n } = await admin.from("contact_form_submissions").select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId).eq(column, value).gte("created_at", since);
    return n ?? 0;
  };
  const [byEmail, byPhone] = await Promise.all([count("sender_email", emailKey(sender.email)), count("sender_phone", phoneKey(sender.phone))]);
  return Math.max(byEmail, byPhone);
}
