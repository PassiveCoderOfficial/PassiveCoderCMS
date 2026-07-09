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
}

const DEFAULT_FROM = "Passive Coder <contact@noreply.passivecoder.com>";

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — skipping send to", input.to);
    return { ok: false, error: "email_not_configured" };
  }
  if (!input.to || (Array.isArray(input.to) && input.to.length === 0)) {
    return { ok: false, error: "no_recipient" };
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
