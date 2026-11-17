import { lookup } from "node:dns/promises";
import { isIP, type LookupFunction } from "node:net";
import http from "node:http";
import https from "node:https";
import { brotliDecompressSync, gunzipSync, inflateSync } from "node:zlib";

/* ── Safe outbound fetch ───────────────────────────────────────────────
 * For addresses that come from users (import URLs, image links, media rows):
 * every request refuses private, loopback and link-local addresses, follows
 * redirects by hand with the same check on each hop, and caps size and time.
 *
 * The host name is resolved ONCE, checked, and the connection is then made
 * to that exact address (the request's own DNS lookup is replaced). Checking
 * first and letting fetch() resolve again would let a hostile DNS server
 * answer "public" to the check and "127.0.0.1" to the connection (DNS
 * rebinding). TLS still verifies the certificate against the host name. */

export function privateIp(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v.startsWith("::ffff:")) {
      const rest = v.slice(7);
      if (isIP(rest) === 4) return privateIp(rest);
      // IPv4-mapped written in hex (::ffff:7f00:1).
      const m = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(rest);
      if (!m) return true;
      const hi = parseInt(m[1], 16), lo = parseInt(m[2], 16);
      return privateIp(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
    }
    return v === "::1" || v === "::" || /^(fc|fd|fe8|fe9|fea|feb)/.test(v);
  }
  if (isIP(ip) !== 4) return true;
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

type Target = { url: URL; address: string; family: 4 | 6 };

/** Parse, resolve once and refuse anything that is not a public address. */
export async function resolvePublicUrl(raw: string): Promise<Target> {
  const url = new URL(raw);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Only http and https addresses are supported.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addrs = isIP(host) ? [{ address: host, family: isIP(host) }] : await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => privateIp(a.address))) throw new Error("That address can't be reached from here.");
  // IPv4 first when there is one: some hosts (serverless) have no IPv6 route out.
  const pick = addrs.find((a) => a.family === 4) ?? addrs[0];
  return { url, address: pick.address, family: pick.family === 6 ? 6 : 4 };
}

function pinnedGet(t: Target, headers: Record<string, string>, timeoutMs: number, maxBytes: number) {
  return new Promise<{ status: number; headers: Headers; buf: Buffer }>((resolve, reject) => {
    // Always answers with the address that was checked, whatever is asked.
    const pinned = ((_host: string, options: unknown, cb: (...args: unknown[]) => void) => {
      const callback = typeof options === "function" ? (options as typeof cb) : cb;
      if (typeof options === "object" && options && (options as { all?: boolean }).all) callback(null, [{ address: t.address, family: t.family }]);
      else callback(null, t.address, t.family);
    }) as unknown as LookupFunction;

    const req = (t.url.protocol === "https:" ? https : http).request(t.url, {
      method: "GET", lookup: pinned, agent: false,
      headers: { ...headers, "Accept-Encoding": "gzip, deflate, br" },
    }, (res) => {
      const out = new Headers();
      for (const [k, v] of Object.entries(res.headers)) {
        if (v == null) continue;
        for (const one of Array.isArray(v) ? v : [v]) { try { out.append(k, one); } catch { /* odd header: skip */ } }
      }
      const status = res.statusCode ?? 0;
      // A redirect's body is never read.
      if (status >= 300 && status < 400 && out.get("location")) {
        clearTimeout(timer); res.destroy(); resolve({ status, headers: out, buf: Buffer.alloc(0) }); return;
      }
      if (Number(out.get("content-length") ?? 0) > maxBytes) { fail(new Error("File too large")); return; }
      const chunks: Buffer[] = [];
      let size = 0;
      res.on("data", (c: Buffer) => {
        size += c.length;
        if (size > maxBytes) fail(new Error("File too large")); else chunks.push(c);
      });
      res.on("error", fail);
      res.on("end", () => {
        clearTimeout(timer);
        try {
          let buf: Buffer = Buffer.concat(chunks);
          const enc = (out.get("content-encoding") ?? "").trim().toLowerCase();
          if (buf.length && enc && enc !== "identity") {
            const opts = { maxOutputLength: maxBytes };
            if (enc === "gzip" || enc === "x-gzip") buf = gunzipSync(buf, opts);
            else if (enc === "deflate") buf = inflateSync(buf, opts);
            else if (enc === "br") buf = brotliDecompressSync(buf, opts);
            else throw new Error("Unsupported content encoding");
            out.delete("content-encoding");
            out.delete("content-length");
          }
          resolve({ status, headers: out, buf });
        } catch (err) {
          reject(err instanceof RangeError ? new Error("File too large") : err);
        }
      });
    });
    function fail(err: Error) { clearTimeout(timer); req.destroy(); reject(err); }
    const timer = setTimeout(() => fail(new Error("The request timed out")), timeoutMs);
    req.on("error", (err) => { clearTimeout(timer); reject(err); });
    req.end();
  });
}

export async function safeFetch(raw: string, { maxBytes = 15 * 1024 * 1024, timeoutMs = 15000, accept }: { maxBytes?: number; timeoutMs?: number; accept?: string } = {}) {
  let target = await resolvePublicUrl(raw);
  for (let hop = 0; hop < 4; hop++) {
    const r = await pinnedGet(target, { "User-Agent": "PassiveCoderImport/1.0 (+https://passivecoder.com)", ...(accept ? { Accept: accept } : {}) }, timeoutMs, maxBytes);
    const location = r.headers.get("location");
    if (r.status >= 300 && r.status < 400 && location) {
      target = await resolvePublicUrl(new URL(location, target.url).toString());
      continue;
    }
    const noBody = r.status === 204 || r.status === 205 || r.status === 304;
    const res = new Response(noBody ? null : new Uint8Array(r.buf), { status: r.status, headers: r.headers });
    return { res, buf: r.buf, url: target.url.toString() };
  }
  throw new Error("Too many redirects");
}
