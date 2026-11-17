import { z } from "zod";
import { APP_URL, ROOT_DOMAIN } from "@/lib/flags";
import { checkLicenceText } from "@/lib/licence/verify";
import { normalizeDomain } from "@/lib/licence/format";
import { installerAccess } from "@/lib/installer/server";
import { isSender } from "@/lib/installer/validate";
import { sendSmtp, smtpConfigFromEnv, SmtpError, type SmtpConfig } from "@/lib/email/smtp";

/*
 * Web installer: try an optional setting before it is saved.
 *
 *   { kind: "email", apiKey?, smtp?, from, to }  send one test email, through
 *                                       the SMTP server given (or saved), else Resend
 *   { kind: "ai", key }                   ask Passive Coder AI whether the key is good
 *   { kind: "licence", text }             check a module licence file (offline)
 *
 * Nothing is stored here; the final step (POST /api/setup) saves what the
 * owner kept. Same gate as the rest of the installer, with a tight limit:
 * the email test could otherwise be used to send mail.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SmtpBody = z.object({
  host: z.string().trim().max(200).regex(/^[A-Za-z0-9.-]*$/),
  port: z.coerce.number().int().min(1).max(65535).optional(),
  user: z.string().trim().max(200).optional(),
  pass: z.string().max(300).optional(),
});

const Body = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("email"),
    apiKey: z.string().trim().max(300).optional(),
    smtp: SmtpBody.optional(),
    from: z.string().trim().min(3).max(200),
    to: z.string().trim().email().max(200),
  }),
  z.object({ kind: z.literal("ai"), key: z.string().trim().min(8).max(300) }),
  z.object({ kind: z.literal("licence"), text: z.string().min(2).max(20_000) }),
]);

const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  const access = await installerAccess(req, "write", { scope: "test", max: 12 });
  if (!access.ok) return access.response;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, code: "bad_request" }, 400);
  const input = parsed.data;

  if (input.kind === "licence") {
    const res = checkLicenceText(input.text);
    if (!res.ok) return json({ ok: false, code: "licence_invalid", detail: res.reason });
    const want = normalizeDomain(res.licence.domain);
    const domainMatches = [ROOT_DOMAIN, APP_URL].some((d) => normalizeDomain(d) === want);
    return json({
      ok: domainMatches,
      code: domainMatches ? "licence_ok" : "licence_other_domain",
      domain: res.licence.domain,
      modules: res.licence.modules,
      licensee: res.licence.licensee ?? null,
    });
  }

  if (input.kind === "ai") {
    const base = (process.env.PASSIVECODER_AI_URL || "https://passivecoder.com/api/ai/v1").replace(/\/+$/, "");
    try {
      // An empty request: a good key gets "messages is required" (400) and
      // costs nothing; a bad one gets 401.
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${input.key}`, "Content-Type": "application/json" },
        body: "{}",
        signal: AbortSignal.timeout(12_000),
      });
      if (res.status === 401 || res.status === 403) return json({ ok: false, code: "ai_key_invalid" });
      if (res.status === 400 || res.status === 402 || res.ok) return json({ ok: true, code: "ai_key_ok" });
      return json({ ok: false, code: "ai_unreachable" });
    } catch {
      return json({ ok: false, code: "ai_unreachable" });
    }
  }

  // Email over SMTP: the server typed in now, or the one already saved.
  if (!isSender(input.from)) return json({ ok: false, code: "email_from_invalid" });
  const port = input.smtp?.port ?? 587;
  const smtp: SmtpConfig | null = input.smtp?.host
    ? { host: input.smtp.host, port, secure: port === 465, user: input.smtp.user || undefined, pass: input.smtp.pass || undefined }
    : !input.apiKey ? smtpConfigFromEnv() : null;
  if (smtp) {
    try {
      await sendSmtp(smtp, {
        from: input.from,
        to: [input.to],
        subject: "Test email from your Passive Coder CMS site",
        text: "This is a test email from the Passive Coder CMS installer. If you can read it, outgoing email works.",
      }, { timeoutMs: 15_000 });
      return json({ ok: true, code: "email_sent" });
    } catch (e) {
      const code = e instanceof SmtpError ? e.code : "smtp_failed";
      // The server's own words help; the password is never in them, but make sure.
      let detail = e instanceof Error ? e.message : "";
      if (smtp.pass) detail = detail.split(smtp.pass).join("***");
      return json({ ok: false, code, detail: detail.slice(0, 300) });
    }
  }

  // Email through Resend
  const key = input.apiKey || process.env.RESEND_API_KEY?.trim();
  if (!key) return json({ ok: false, code: "email_smtp_missing" });
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: input.from,
        to: [input.to],
        subject: "Test email from your Passive Coder CMS site",
        text: "This is a test email from the Passive Coder CMS installer. If you can read it, outgoing email works.",
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) return json({ ok: true, code: "email_sent" });
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    const code = res.status === 401 ? "email_key_invalid" : res.status === 403 ? "email_domain_not_verified" : "email_failed";
    // Resend's own explanation (about the sender or the key), never the key itself.
    return json({ ok: false, code, detail: String(body?.message ?? "").replace(key, "").slice(0, 300) });
  } catch {
    return json({ ok: false, code: "email_failed" });
  }
}
