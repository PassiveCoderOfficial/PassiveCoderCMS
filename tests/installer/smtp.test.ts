/**
 * Outgoing email over SMTP for self-hosted installs (src/lib/email/smtp.ts):
 * the message text, and a whole conversation with a pretend mail server.
 * Run: npm run test:installer
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import { buildMessage, dotStuff, encodeAddress, encodeWord, smtpConfigFromEnv } from "../../src/lib/email/smtp-message";
import { sendSmtp, SmtpError } from "../../src/lib/email/smtp";

test("smtpConfigFromEnv: port decides TLS, nothing without a host", () => {
  assert.equal(smtpConfigFromEnv({}), null);
  assert.deepEqual(smtpConfigFromEnv({ SMTP_HOST: "smtp.x.com" }), { host: "smtp.x.com", port: 587, secure: false, user: undefined, pass: undefined });
  assert.equal(smtpConfigFromEnv({ SMTP_HOST: "smtp.x.com", SMTP_PORT: "465" })?.secure, true);
  assert.equal(smtpConfigFromEnv({ SMTP_HOST: "smtp.x.com", SMTP_PORT: "2525", SMTP_SECURE: "true" })?.secure, true);
});

test("headers: non-English names and subjects are encoded, line breaks removed", () => {
  assert.equal(encodeWord("Hello"), "Hello");
  assert.equal(encodeWord("স্বাগতম"), `=?UTF-8?B?${Buffer.from("স্বাগতম").toString("base64")}?=`);
  assert.equal(encodeWord("a\r\nBcc: x@y.z"), "a Bcc: x@y.z");
  assert.equal(encodeAddress("Shop <a@b.co>"), '"Shop" <a@b.co>');
  assert.equal(encodeAddress("a@b.co"), "a@b.co");
  assert.match(encodeAddress("দোকান <a@b.co>"), /^=\?UTF-8\?B\?.+\?= <a@b\.co>$/);
});

test("buildMessage: text, html alternative, attachments", () => {
  const fixed = { date: new Date("2026-11-17T00:00:00Z"), messageId: "<id@b.co>", boundary: "BND" };
  const plain = buildMessage({ from: "Shop <a@b.co>", to: ["c@d.co"], subject: "Hi", text: "Body" }, fixed);
  assert.match(plain, /^From: "Shop" <a@b\.co>\r\nTo: c@d\.co\r\nSubject: Hi\r\nDate: Tue, 17 Nov 2026 00:00:00 \+0000\r\nMessage-ID: <id@b\.co>\r\nMIME-Version: 1\.0\r\n/);
  assert.ok(plain.includes(`Content-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${Buffer.from("Body").toString("base64")}\r\n`));

  const html = buildMessage({ from: "a@b.co", to: ["c@d.co"], subject: "Hi", html: "<p>Hello <b>there</b></p>", replyTo: "r@d.co", headers: { "List-Unsubscribe": "<https://x>" } }, fixed);
  assert.match(html, /Reply-To: r@d\.co\r\n/);
  assert.match(html, /List-Unsubscribe: <https:\/\/x>\r\n/);
  assert.match(html, /Content-Type: multipart\/alternative; boundary="BNDa"/);
  assert.ok(html.includes(Buffer.from("Hello there").toString("base64")), "text part made from the html");
  assert.ok(html.trimEnd().endsWith("--BNDa--"));

  const withFile = buildMessage({ from: "a@b.co", to: ["c@d.co"], subject: "Hi", text: "x", attachments: [{ filename: "invoice.pdf", content: Buffer.from("PDF").toString("base64") }] }, fixed);
  assert.match(withFile, /Content-Type: multipart\/mixed; boundary="BNDm"/);
  assert.match(withFile, /filename="invoice\.pdf"/);
  assert.ok(withFile.trimEnd().endsWith("--BNDm--"));
  // base64 lines stay under the 78-character limit.
  assert.ok(buildMessage({ from: "a@b.co", to: ["c@d.co"], subject: "s", text: "x".repeat(2000) }, fixed).split("\r\n").every((l) => l.length <= 78));
});

test("dotStuff doubles leading dots and makes CRLF", () => {
  assert.equal(dotStuff("a\n.b\r\n..c"), "a\r\n..b\r\n...c");
});

/** A pretend SMTP server: plain text, AUTH PLAIN, records what it got. */
function fakeServer({ password = "right", rejectFrom = false } = {}) {
  const got: { lines: string[]; data: string } = { lines: [], data: "" };
  const server = net.createServer((socket) => {
    let inData = false;
    let buffer = "";
    socket.write("220 fake ESMTP\r\n");
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      let i: number;
      while ((i = buffer.indexOf("\r\n")) !== -1) {
        const line = buffer.slice(0, i);
        buffer = buffer.slice(i + 2);
        if (inData) {
          if (line === ".") { inData = false; socket.write("250 queued\r\n"); } else got.data += `${line}\n`;
          continue;
        }
        got.lines.push(line);
        if (/^EHLO/.test(line)) socket.write("250-fake\r\n250-AUTH PLAIN LOGIN\r\n250 SIZE 1000000\r\n");
        else if (/^AUTH PLAIN /.test(line)) {
          const [, , pass] = Buffer.from(line.slice(11), "base64").toString().split("\0");
          socket.write(pass === password ? "235 ok\r\n" : "535 5.7.8 bad credentials\r\n");
        } else if (/^MAIL FROM/.test(line)) socket.write(rejectFrom ? "553 not your address\r\n" : "250 ok\r\n");
        else if (/^RCPT TO/.test(line)) socket.write("250 ok\r\n");
        else if (line === "DATA") { inData = true; socket.write("354 go\r\n"); }
        else if (line === "QUIT") { socket.write("221 bye\r\n"); socket.end(); }
        else socket.write("500 what\r\n");
      }
    });
  });
  return new Promise<{ port: number; got: typeof got; close: () => void }>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ port: (server.address() as net.AddressInfo).port, got, close: () => server.close() }));
  });
}

test("sendSmtp talks to a mail server: login, sender, recipient, message", async () => {
  const s = await fakeServer();
  try {
    await sendSmtp({ host: "127.0.0.1", port: s.port, secure: false, user: "me@b.co", pass: "right" }, { from: "Shop <me@b.co>", to: ["you@d.co"], subject: "Test", text: "Hello\n.dot line" });
    assert.ok(s.got.lines.some((l) => l.startsWith("AUTH PLAIN ")));
    assert.ok(s.got.lines.includes("MAIL FROM:<me@b.co>"));
    assert.ok(s.got.lines.includes("RCPT TO:<you@d.co>"));
    assert.match(s.got.data, /Subject: Test/);
    assert.ok(s.got.data.includes(Buffer.from("Hello\n.dot line").toString("base64")));
  } finally {
    s.close();
  }
});

test("sendSmtp names the problem: wrong password, refused sender, nobody there", async () => {
  const bad = await fakeServer({ password: "other" });
  try {
    await assert.rejects(sendSmtp({ host: "127.0.0.1", port: bad.port, secure: false, user: "u", pass: "right" }, { from: "a@b.co", to: ["c@d.co"], subject: "s", text: "t" }),
      (e: unknown) => e instanceof SmtpError && e.code === "smtp_auth" && !e.message.includes("right"));
  } finally {
    bad.close();
  }
  const strict = await fakeServer({ rejectFrom: true });
  try {
    await assert.rejects(sendSmtp({ host: "127.0.0.1", port: strict.port, secure: false }, { from: "a@b.co", to: ["c@d.co"], subject: "s", text: "t" }),
      (e: unknown) => e instanceof SmtpError && e.code === "smtp_from_rejected");
  } finally {
    strict.close();
  }
  // A port where nothing listens.
  const gone = await fakeServer();
  gone.close();
  await assert.rejects(sendSmtp({ host: "127.0.0.1", port: gone.port, secure: false }, { from: "a@b.co", to: ["c@d.co"], subject: "s", text: "t" }, { timeoutMs: 3000 }),
    (e: unknown) => e instanceof SmtpError && e.code === "smtp_connect");
});
