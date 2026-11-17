import net from "node:net";
import tls from "node:tls";
import os from "node:os";
import { addressOf, buildMessage, dotStuff, type SmtpConfig, type SmtpMessage } from "./smtp-message";

/*
 * Outgoing email over SMTP, for self-hosted installs that use their own mail
 * server (their host's mailbox, Gmail with an app password, Zoho, Brevo...)
 * instead of Resend. Used by lib/email.ts only when RESEND_API_KEY is not set,
 * on a standalone install. The hosted platform always sends through Resend.
 *
 * No package: a small client for what the app needs (one message, TLS or
 * STARTTLS, AUTH PLAIN or LOGIN). The message itself is built by the pure
 * buildMessage() in ./smtp-message.ts (tests/installer).
 *
 * Server code only (node:net); no "server-only" import so the tests can
 * run it against a pretend mail server.
 *
 * Settings: SMTP_HOST, SMTP_PORT (587 = STARTTLS, 465 = TLS; default 587),
 * SMTP_USER, SMTP_PASS, and EMAIL_FROM as the sender.
 */

export { smtpConfigFromEnv, addressOf, buildMessage, dotStuff } from "./smtp-message";
export type { SmtpConfig, SmtpMessage } from "./smtp-message";

export class SmtpError extends Error {
  constructor(public code: "smtp_connect" | "smtp_tls" | "smtp_auth" | "smtp_from_rejected" | "smtp_to_rejected" | "smtp_failed", message: string) {
    super(message);
    this.name = "SmtpError";
  }
}

type Reply = { code: number; lines: string[] };

/** Reads SMTP replies (one or more "NNN-text" lines, ending with "NNN text"). */
function replyReader(socket: net.Socket | tls.TLSSocket) {
  let buffer = "";
  let current: string[] = [];
  const ready: Reply[] = [];
  const waiting: ((r: Reply | Error) => void)[] = [];
  let failed: Error | null = null;
  const push = (r: Reply | Error) => {
    const w = waiting.shift();
    if (w) w(r);
    else if (!(r instanceof Error)) ready.push(r);
  };
  const onData = (chunk: Buffer) => {
    buffer += chunk.toString("utf8");
    let i: number;
    while ((i = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, i).replace(/\r$/, "");
      buffer = buffer.slice(i + 1);
      current.push(line);
      if (/^\d{3}(?: |$)/.test(line)) {
        push({ code: Number(line.slice(0, 3)), lines: current });
        current = [];
      }
    }
  };
  const onFail = (e: Error) => {
    failed = e;
    while (waiting.length) waiting.shift()!(e);
  };
  socket.on("data", onData);
  socket.on("error", onFail);
  socket.on("close", () => onFail(new Error("connection closed")));
  return {
    next(): Promise<Reply> {
      if (ready.length) return Promise.resolve(ready.shift()!);
      if (failed) return Promise.reject(failed);
      return new Promise((resolve, reject) => waiting.push((r) => (r instanceof Error ? reject(r) : resolve(r))));
    },
    detach() {
      socket.off("data", onData);
      socket.removeAllListeners("error");
      socket.removeAllListeners("close");
    },
  };
}

/** Send one message. Throws SmtpError with a code the installer can explain. */
export async function sendSmtp(cfg: SmtpConfig, msg: SmtpMessage, { timeoutMs = 20_000 }: { timeoutMs?: number } = {}): Promise<void> {
  const connect = () =>
    new Promise<net.Socket | tls.TLSSocket>((resolve, reject) => {
      const s = cfg.secure
        ? tls.connect({ host: cfg.host, port: cfg.port, servername: cfg.host })
        : net.connect({ host: cfg.host, port: cfg.port });
      s.setTimeout(timeoutMs, () => s.destroy(new Error("timed out")));
      s.once(cfg.secure ? "secureConnect" : "connect", () => resolve(s));
      s.once("error", (e) => reject(new SmtpError(/certificate|ssl|tls/i.test(e.message) ? "smtp_tls" : "smtp_connect", e.message)));
    });

  let socket = await connect();
  let reader = replyReader(socket);
  const send = (line: string) => socket.write(`${line}\r\n`);
  const expect = async (codes: number[], fail: SmtpError["code"], what: string) => {
    let r: Reply;
    try {
      r = await reader.next();
    } catch (e) {
      throw new SmtpError("smtp_connect", `${what}: ${e instanceof Error ? e.message : e}`);
    }
    if (!codes.includes(r.code)) throw new SmtpError(fail, `${what}: ${r.lines.join(" ").slice(0, 300)}`);
    return r;
  };
  const helo = os.hostname().replace(/[^A-Za-z0-9.-]/g, "") || "localhost";

  try {
    await expect([220], "smtp_connect", "greeting");
    send(`EHLO ${helo}`);
    let ehlo = await expect([250], "smtp_failed", "EHLO");

    if (!cfg.secure && ehlo.lines.some((l) => /STARTTLS/i.test(l))) {
      send("STARTTLS");
      await expect([220], "smtp_tls", "STARTTLS");
      reader.detach();
      socket = await new Promise<tls.TLSSocket>((resolve, reject) => {
        const t = tls.connect({ socket, servername: cfg.host }, () => resolve(t));
        t.once("error", (e) => reject(new SmtpError("smtp_tls", e.message)));
      });
      socket.setTimeout(timeoutMs, () => socket.destroy(new Error("timed out")));
      reader = replyReader(socket);
      send(`EHLO ${helo}`);
      ehlo = await expect([250], "smtp_failed", "EHLO");
    }

    if (cfg.user) {
      const authLine = ehlo.lines.find((l) => /AUTH/i.test(l)) ?? "";
      if (!/PLAIN/i.test(authLine) && /LOGIN/i.test(authLine)) {
        send("AUTH LOGIN");
        await expect([334], "smtp_auth", "AUTH");
        send(Buffer.from(cfg.user).toString("base64"));
        await expect([334], "smtp_auth", "AUTH");
        send(Buffer.from(cfg.pass ?? "").toString("base64"));
      } else {
        send(`AUTH PLAIN ${Buffer.from(`\0${cfg.user}\0${cfg.pass ?? ""}`).toString("base64")}`);
      }
      await expect([235], "smtp_auth", "AUTH");
    }

    send(`MAIL FROM:<${addressOf(msg.from)}>`);
    await expect([250], "smtp_from_rejected", "MAIL FROM");
    for (const to of msg.to) {
      send(`RCPT TO:<${addressOf(to)}>`);
      await expect([250, 251], "smtp_to_rejected", "RCPT TO");
    }
    send("DATA");
    await expect([354], "smtp_failed", "DATA");
    socket.write(`${dotStuff(buildMessage(msg))}\r\n.\r\n`);
    await expect([250], "smtp_failed", "message");
    send("QUIT");
    // The message is accepted; wait briefly for the goodbye, then close.
    await Promise.race([reader.next().catch(() => null), new Promise((r) => setTimeout(r, 2000).unref())]);
  } finally {
    socket.end();
    socket.destroy();
  }
}
