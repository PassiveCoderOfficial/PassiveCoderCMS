import "server-only";
import { Resolver } from "node:dns/promises";

/**
 * Business email for a site's own domain: which DNS records each mailbox
 * provider needs, a live check of what the domain actually has, and (for
 * domains on our nameservers) writing the records automatically.
 *
 * We never host mail ourselves. Mailboxes live with Google, Microsoft, Zoho
 * or Titan; free forwarding goes through Forward Email (configured purely by
 * DNS, no account needed). Site emails (bookings, invoices, campaigns) are
 * sent from the domain via Resend, see lib/email/sender.ts.
 */
export type Provider = "google" | "microsoft" | "zoho" | "titan" | "forwarding" | "other";
export type DnsRecord = { type: "MX" | "TXT" | "CNAME"; name: string; value: string; priority?: number; purpose: string };
export type Forward = { alias: string; to: string };

export const PROVIDERS: Record<Provider, { label: string; help: string; dkimHelp?: string }> = {
  google: { label: "Google Workspace (Gmail)", help: "Sign up at workspace.google.com with this domain, then add the records below.",
    dkimHelp: "In Google Admin go to Apps > Gmail > Authenticate email, generate a DKIM key and paste the TXT value here." },
  microsoft: { label: "Microsoft 365 (Outlook)", help: "Add this domain in the Microsoft 365 admin center, then add the records below.",
    dkimHelp: "In Microsoft Defender > Email authentication > DKIM, copy the two selector CNAME values." },
  zoho: { label: "Zoho Mail", help: "Add this domain in Zoho Mail admin, then add the records below.",
    dkimHelp: "In Zoho Mail admin > Domains > Email configuration > DKIM, copy the TXT value." },
  titan: { label: "Titan Email", help: "Add this domain in your Titan account, then add the records below." },
  forwarding: { label: "Free forwarding to your inbox", help: "Mail to info@, sales@ and so on is forwarded to an inbox you already use (Gmail, Outlook). Free, no mailbox to manage." },
  other: { label: "Another provider", help: "Use the records your email provider gives you; you can still check them here." },
};

/** SPF include for each provider; merged into one SPF record (a domain may only have one). */
const SPF: Partial<Record<Provider, string>> = {
  google: "include:_spf.google.com",
  microsoft: "include:spf.protection.outlook.com",
  zoho: "include:zoho.com",
  titan: "include:spf.titan.email",
  forwarding: "include:spf.forwardemail.net",
};

export function cleanForwards(raw: unknown): Forward[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.map((f) => ({
    alias: String((f as Forward)?.alias ?? "").trim().toLowerCase().replace(/@.*$/, "").replace(/[^a-z0-9._+-]/g, ""),
    to: String((f as Forward)?.to ?? "").trim().toLowerCase(),
  })).filter((f) => f.alias && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.to) && !seen.has(f.alias) && seen.add(f.alias)).slice(0, 20);
}

/** Every record the chosen setup needs at the domain's apex (and DKIM/DMARC hosts). */
export function requiredRecords(domain: string, provider: Provider | null, forwards: Forward[], dkim: { name: string; value: string }[]): DnsRecord[] {
  const out: DnsRecord[] = [];
  const mx = (value: string, priority: number) => out.push({ type: "MX", name: "@", value, priority, purpose: "Receive email" });
  switch (provider) {
    case "google": mx("smtp.google.com", 1); break;
    case "microsoft": mx(`${domain.replace(/\./g, "-")}.mail.protection.outlook.com`, 0);
      out.push({ type: "CNAME", name: "autodiscover", value: "autodiscover.outlook.com", purpose: "Outlook app setup" }); break;
    case "zoho": mx("mx.zoho.com", 10); mx("mx2.zoho.com", 20); mx("mx3.zoho.com", 50); break;
    case "titan": mx("mx1.titan.email", 10); mx("mx2.titan.email", 20); break;
    case "forwarding":
      mx("mx1.forwardemail.net", 10); mx("mx2.forwardemail.net", 10);
      if (forwards.length) {
        out.push({ type: "TXT", name: "@", value: `forward-email=${forwards.map((f) => `${f.alias}:${f.to}`).join(",")}`, purpose: "Forwarding addresses" });
      }
      break;
    default: break;
  }
  const inc = provider ? SPF[provider] : undefined;
  if (inc) out.push({ type: "TXT", name: "@", value: `v=spf1 ${inc} ~all`, purpose: "SPF: who may send as this domain" });
  for (const d of dkim) {
    if (d.name && d.value) out.push({ type: d.value.includes("v=DKIM1") ? "TXT" : "CNAME", name: d.name, value: d.value, purpose: "DKIM signature" });
  }
  if (provider && provider !== "other") {
    out.push({ type: "TXT", name: "_dmarc", value: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`, purpose: "DMARC: spam protection policy" });
  }
  return out;
}

const resolver = new Resolver();
resolver.setServers(["1.1.1.1", "8.8.8.8"]);
const host = (domain: string, name: string) => (name === "@" ? domain : `${name}.${domain}`);
const norm = (s: string) => s.toLowerCase().replace(/\.$/, "").replace(/\s+/g, " ").trim();

/** Live DNS: which of the required records the domain already publishes. */
export async function checkRecords(domain: string, records: DnsRecord[]) {
  const cache = new Map<string, Promise<string[]>>();
  const lookup = (type: string, name: string) => {
    const k = `${type}:${name}`;
    if (!cache.has(k)) {
      const h = host(domain, name);
      cache.set(k, (type === "MX"
        ? resolver.resolveMx(h).then((r) => r.map((m) => norm(m.exchange)))
        : type === "TXT"
          ? resolver.resolveTxt(h).then((r) => r.map((t) => norm(t.join(""))))
          : resolver.resolveCname(h).then((r) => r.map(norm))
      ).catch(() => []));
    }
    return cache.get(k)!;
  };
  const results = [];
  for (const r of records) {
    const found = await lookup(r.type, r.name);
    let ok: boolean;
    if (r.type === "TXT" && r.value.startsWith("v=spf1")) {
      // Any single SPF record that includes the provider counts.
      const inc = r.value.split(" ")[1];
      ok = found.some((v) => v.startsWith("v=spf1") && v.includes(inc));
    } else if (r.type === "TXT" && r.value.startsWith("v=DMARC1")) {
      ok = found.some((v) => v.startsWith("v=dmarc1"));
    } else {
      ok = found.includes(norm(r.value));
    }
    results.push({ ...r, ok, found });
  }
  // Mail records from a different provider left behind would split delivery.
  const mxNow = await lookup("MX", "@");
  const wantMx = records.filter((r) => r.type === "MX").map((r) => norm(r.value));
  const strayMx = wantMx.length ? mxNow.filter((m) => !wantMx.includes(m)) : [];
  return { records: results, strayMx };
}

/* ── Writing records on Vercel DNS (domains using our nameservers) ───── */
const VERCEL = "https://api.vercel.com";
const team = () => (process.env.VERCEL_TEAM_ID ? `teamId=${process.env.VERCEL_TEAM_ID}` : "");
async function vercel<T>(path: string, init: RequestInit = {}): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${VERCEL}${path}${team() ? sep + team() : ""}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN ?? ""}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`DNS update failed (${res.status}): ${text.slice(0, 200)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

type VRec = { id: string; name: string; type: string; value: string; mxPriority?: number };

/** True when the domain's DNS zone is hosted by us (Vercel nameservers). */
export async function weHostDns(domain: string): Promise<boolean> {
  try { await vercel<{ records: VRec[] }>(`/v4/domains/${domain}/records?limit=1`); return true; } catch { return false; }
}

/**
 * Write the records. Mail (MX) records for other providers and an old SPF
 * record are replaced, since a domain can only route mail one way; every
 * other record (website, verification TXT, etc.) is left untouched.
 */
export async function applyRecords(domain: string, records: DnsRecord[]) {
  const { records: existing } = await vercel<{ records: VRec[] }>(`/v4/domains/${domain}/records?limit=100`);
  const apex = (n: string) => (n === "@" ? "" : n);
  const wantMx = records.filter((r) => r.type === "MX");
  const removals = existing.filter((e) =>
    (wantMx.length && e.type === "MX" && e.name === "" && !wantMx.some((w) => norm(w.value) === norm(e.value)))
    || (e.type === "TXT" && e.name === "" && e.value.startsWith("v=spf1") && records.some((r) => r.value.startsWith("v=spf1") && norm(r.value) !== norm(e.value)))
    || (e.type === "TXT" && e.name === "" && e.value.startsWith("forward-email=") && records.some((r) => r.value.startsWith("forward-email=") && norm(r.value) !== norm(e.value)))
    || (e.type === "TXT" && e.name === "_dmarc" && records.some((r) => r.name === "_dmarc" && norm(r.value) !== norm(e.value))),
  );
  for (const r of removals) await vercel(`/v2/domains/${domain}/records/${r.id}`, { method: "DELETE" });
  let added = 0;
  for (const r of records) {
    const dup = existing.some((e) => !removals.includes(e) && e.type === r.type && e.name === apex(r.name) && norm(e.value) === norm(r.value));
    if (dup) continue;
    await vercel(`/v2/domains/${domain}/records`, {
      method: "POST",
      body: JSON.stringify({ name: apex(r.name), type: r.type, value: r.value, ttl: 3600, ...(r.type === "MX" ? { mxPriority: r.priority ?? 10 } : {}) }),
    });
    added++;
  }
  return { added, removed: removals.length };
}
