import { createAdminClient, createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { pushToUser } from "@/lib/push/web-push";

export type ChatRole = "buyer" | "vendor";

export interface Conversation {
  id: string;
  tenant_id: string;
  vendor_id: string;
  buyer_id: string;
  product_id: string | null;
  last_message: string | null;
  last_message_at: string;
  buyer_unread: number;
  vendor_unread: number;
  buyer_emailed_at: string | null;
  vendor_emailed_at: string | null;
}

/** Email at most once per side per this window while messages go unread. */
const EMAIL_QUIET_MS = 15 * 60 * 1000;

export async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** The approved ecommerce seller account this user runs on this store, if any. */
export async function vendorIdForUser(tenantId: string, userId: string): Promise<string | null> {
  const admin = await createAdminClient();
  const { data } = await admin
    .from("vendors")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("status", "approved")
    .contains("capabilities", ["ecommerce"])
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

/** Load a conversation and work out which side the user is on. Null means
 *  the user is not a party and must get a 404, not a 403 — don't confirm
 *  that the conversation exists. */
export async function loadAsParty(
  tenantId: string, conversationId: string, userId: string,
): Promise<{ conv: Conversation; role: ChatRole } | null> {
  const admin = await createAdminClient();
  const { data } = await admin
    .from("chat_conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!data) return null;
  const conv = data as Conversation;
  if (conv.buyer_id === userId) return { conv, role: "buyer" };
  const vid = await vendorIdForUser(tenantId, userId);
  if (vid && vid === conv.vendor_id) return { conv, role: "vendor" };
  return null;
}

/** Buyer display name: profile name, else the part of the email before @. */
export async function buyerName(tenantId: string, buyerId: string): Promise<string> {
  const admin = await createAdminClient();
  const { data: prof } = await admin
    .from("customer_profiles")
    .select("full_name")
    .eq("tenant_id", tenantId)
    .eq("customer_id", buyerId)
    .maybeSingle();
  if (prof?.full_name) return prof.full_name;
  const { data } = await admin.auth.admin.getUserById(buyerId);
  const email = data.user?.email ?? "";
  return email && !email.endsWith("@nomail.local") ? email.split("@")[0] : "Customer";
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/**
 * Tell the other party about a new message: browser push always (it's
 * cheap and replaces itself per conversation), email only if they haven't
 * been emailed about this conversation in the last quiet window.
 * Never throws — a failed notification must not fail the send.
 */
export async function notifyRecipient(opts: {
  conv: Conversation;
  senderRole: ChatRole;
  senderName: string;
  preview: string;
  origin: string;
  siteName: string;
}) {
  const { conv, senderRole, senderName, preview, origin, siteName } = opts;
  try {
    const admin = await createAdminClient();
    const toVendor = senderRole === "buyer";
    const path = toVendor ? `/vendor/messages?c=${conv.id}` : `/account/messages?c=${conv.id}`;
    const url = `${origin}${path}`;

    let recipientUserId: string | null = conv.buyer_id;
    let recipientEmail: string | null = null;
    if (toVendor) {
      const { data: v } = await admin.from("vendors").select("user_id, email").eq("id", conv.vendor_id).maybeSingle();
      recipientUserId = v?.user_id ?? null;
      recipientEmail = v?.email ?? null;
      if (!recipientEmail && recipientUserId) {
        const { data } = await admin.auth.admin.getUserById(recipientUserId);
        recipientEmail = data.user?.email ?? null;
      }
    } else {
      const { data } = await admin.auth.admin.getUserById(conv.buyer_id);
      recipientEmail = data.user?.email ?? null;
    }
    if (recipientEmail?.endsWith("@nomail.local")) recipientEmail = null;

    if (recipientUserId) {
      await pushToUser(conv.tenant_id, recipientUserId, {
        title: `${senderName} on ${siteName}`,
        body: preview.slice(0, 140),
        url: path,
        tag: `chat-${conv.id}`,
      });
    }

    const lastEmailed = toVendor ? conv.vendor_emailed_at : conv.buyer_emailed_at;
    const quiet = !lastEmailed || Date.now() - new Date(lastEmailed).getTime() > EMAIL_QUIET_MS;
    if (recipientEmail && quiet) {
      await sendEmail({
        to: recipientEmail,
        from: `${siteName.replace(/[<>"]/g, "")} <contact@noreply.passivecoder.com>`,
        subject: `New message from ${senderName} on ${siteName}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#1A1330">
  <p style="margin:0 0 8px;font-size:14px;color:#667085">${escapeHtml(siteName)}</p>
  <h2 style="margin:0 0 16px;font-size:20px">${escapeHtml(senderName)} sent you a message</h2>
  <div style="background:#F5F5F7;border-radius:12px;padding:16px;font-size:15px;line-height:1.5">${escapeHtml(preview.slice(0, 500))}</div>
  <a href="${url}" style="display:inline-block;margin-top:20px;background:#FF5A1F;color:#fff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:999px">Reply now</a>
  <p style="margin-top:24px;font-size:12px;color:#98A2B3">You get at most one email per conversation every 15 minutes.</p>
</div>`,
        text: `${senderName} sent you a message on ${siteName}:\n\n${preview}\n\nReply: ${url}`,
      });
      await admin
        .from("chat_conversations")
        .update(toVendor ? { vendor_emailed_at: new Date().toISOString() } : { buyer_emailed_at: new Date().toISOString() })
        .eq("id", conv.id);
    }
  } catch (e) {
    console.error("[chat] notify failed", e);
  }
}
