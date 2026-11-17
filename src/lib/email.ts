// Reusable transactional email helper (Resend).
// No-ops (returns { ok: false }) when RESEND_API_KEY is unset so local/dev
// without a key doesn't throw.

interface EmailAttachment {
  filename: string;
  content: string; // base64-encoded
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  attachments?: EmailAttachment[];
  /** Where replies go (Resend reply_to). */
  replyTo?: string;
  /** Extra headers, e.g. List-Unsubscribe for marketing mail. */
  headers?: Record<string, string>;
  /**
   * The site this email is about. On a white-label reseller's site the
   * sender name and "Passive Coder" in the text become the reseller's brand.
   */
  brandTenantId?: string | null;
}

/** EMAIL_FROM ("Name <address>") on self-hosted installs; Passive Coder's sender otherwise. */
const DEFAULT_FROM = process.env.EMAIL_FROM || "Passive Coder <contact@noreply.passivecoder.com>";

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — skipping send to", input.to);
    return { ok: false, error: "email_not_configured" };
  }
  if (!input.to || (Array.isArray(input.to) && input.to.length === 0)) {
    return { ok: false, error: "no_recipient" };
  }

  // White-label (lib/partners/brand.ts): reseller's brand for their clients.
  if (input.brandTenantId && !input.from) {
    try {
      const [{ brandForTenant }, { createAdminClient }] = await Promise.all([import("@/lib/partners/brand"), import("@/lib/supabase/server")]);
      const brand = await brandForTenant(await createAdminClient(), input.brandTenantId);
      if (brand) {
        const safe = brand.name.replace(/[<>"\r\n]/g, "").slice(0, 60);
        input = {
          ...input,
          from: `${safe} <contact@noreply.passivecoder.com>`,
          subject: input.subject.replace(/Passive Coder/g, safe),
          ...(input.html ? { html: input.html.replace(/Passive Coder/g, safe) } : {}),
          ...(input.text ? { text: input.text.replace(/Passive Coder/g, safe) } : {}),
        };
      }
    } catch { /* fall back to Passive Coder branding */ }
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: input.from ?? DEFAULT_FROM,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        ...(input.html ? { html: input.html } : {}),
        ...(input.text ? { text: input.text } : {}),
        ...(input.attachments ? { attachments: input.attachments } : {}),
        ...(input.headers ? { headers: input.headers } : {}),
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, error: `resend_${res.status}: ${detail.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send_failed" };
  }
}
