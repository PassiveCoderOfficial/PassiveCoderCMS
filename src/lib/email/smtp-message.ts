/*
 * The pure half of the SMTP client (lib/email/smtp.ts): settings and the
 * message text. No network, so the tests can use it (tests/installer).
 */
import { randomBytes } from "node:crypto";

export type SmtpConfig = { host: string; port: number; secure: boolean; user?: string; pass?: string };

export function smtpConfigFromEnv(env: Record<string, string | undefined> = process.env): SmtpConfig | null {
  const host = env.SMTP_HOST?.trim();
  if (!host) return null;
  const port = Number(env.SMTP_PORT?.trim() || 587) || 587;
  const secure = env.SMTP_SECURE ? env.SMTP_SECURE === "true" : port === 465;
  return { host, port, secure, user: env.SMTP_USER?.trim() || undefined, pass: env.SMTP_PASS || undefined };
}

export type SmtpMessage = {
  from: string;
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  attachments?: { filename: string; content: string }[];
};

/** "Shop <a@b.c>" or "a@b.c" -> "a@b.c". */
export function addressOf(value: string): string {
  const m = /<([^<>]+)>\s*$/.exec(value.trim());
  return (m ? m[1] : value).trim();
}

const NON_ASCII = /[^\x20-\x7e]/;
/** A header value: plain when ASCII, RFC 2047 base64 words otherwise. */
export function encodeWord(text: string): string {
  const clean = text.replace(/[\r\n]+/g, " ");
  if (!NON_ASCII.test(clean)) return clean;
  return `=?UTF-8?B?${Buffer.from(clean, "utf8").toString("base64")}?=`;
}

/** "Name <a@b.c>" with the name encoded when needed. */
export function encodeAddress(value: string): string {
  const v = value.trim().replace(/[\r\n]+/g, " ");
  const m = /^(.*?)\s*<([^<>]+)>$/.exec(v);
  if (!m || !m[1]) return v;
  const name = m[1].replace(/^"|"$/g, "");
  return NON_ASCII.test(name) ? `${encodeWord(name)} <${m[2]}>` : `"${name.replace(/["\\]/g, "")}" <${m[2]}>`;
}

const b64Lines = (data: string | Buffer) => (typeof data === "string" ? Buffer.from(data, "utf8") : data).toString("base64").replace(/.{1,76}/g, "$&\r\n");

/** The whole message (headers + body), CRLF line ends, before dot-stuffing. */
export function buildMessage(msg: SmtpMessage, opts: { date?: Date; messageId?: string; boundary?: string } = {}): string {
  const boundary = opts.boundary ?? `pc_${randomBytes(12).toString("hex")}`;
  const domain = addressOf(msg.from).split("@")[1] || "localhost";
  const head: string[] = [
    `From: ${encodeAddress(msg.from)}`,
    `To: ${msg.to.map(encodeAddress).join(", ")}`,
    `Subject: ${encodeWord(msg.subject)}`,
    `Date: ${(opts.date ?? new Date()).toUTCString().replace("GMT", "+0000")}`,
    `Message-ID: ${opts.messageId ?? `<${randomBytes(16).toString("hex")}@${domain}>`}`,
    "MIME-Version: 1.0",
  ];
  if (msg.replyTo) head.push(`Reply-To: ${encodeAddress(msg.replyTo)}`);
  for (const [k, v] of Object.entries(msg.headers ?? {})) {
    if (/^[A-Za-z0-9-]+$/.test(k)) head.push(`${k}: ${String(v).replace(/[\r\n]+/g, " ")}`);
  }

  const part = (type: string, body: string) => `Content-Type: ${type}; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${b64Lines(body)}`;
  const text = msg.text ?? (msg.html ? msg.html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/[ \t]+/g, " ").trim() : "");
  let body: string;
  if (msg.html) {
    const alt = `${boundary}a`;
    body = `Content-Type: multipart/alternative; boundary="${alt}"\r\n\r\n--${alt}\r\n${part("text/plain", text)}--${alt}\r\n${part("text/html", msg.html)}--${alt}--\r\n`;
  } else {
    body = part("text/plain", text);
  }
  if (msg.attachments?.length) {
    const mix = `${boundary}m`;
    let out = `Content-Type: multipart/mixed; boundary="${mix}"\r\n\r\n--${mix}\r\n${body}`;
    for (const a of msg.attachments) {
      const name = encodeWord(a.filename.replace(/["\\]/g, ""));
      out += `--${mix}\r\nContent-Type: application/octet-stream; name="${name}"\r\nContent-Disposition: attachment; filename="${name}"\r\nContent-Transfer-Encoding: base64\r\n\r\n${b64Lines(Buffer.from(a.content, "base64"))}`;
    }
    body = `${out}--${mix}--\r\n`;
  }
  return `${head.join("\r\n")}\r\n${body}`;
}

/** Lines starting with "." get a second one (SMTP's end-of-data marker is a lone "."). */
export function dotStuff(message: string): string {
  return message.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
}
