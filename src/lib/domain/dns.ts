import { addDnsRecord } from "./logicbox";
import { ROOT_DOMAIN } from "@/lib/flags";

const VERCEL_IP = process.env.VERCEL_IP ?? "76.76.21.21";

export interface DnsInstructions {
  type: "nameserver" | "arecord";
  nameservers?: string[];
  aRecord?: { host: string; value: string };
  cname?: { host: string; value: string };
}

export async function setupAutomaticDns(domain: string): Promise<void> {
  // Called after domain is registered via LogicBox — we own the DNS zone
  await addDnsRecord(domain, "A", "@", VERCEL_IP);
  await addDnsRecord(domain, "A", "www", VERCEL_IP);
}

// Branded (vanity) nameservers. These are child nameservers registered under
// passivecoder.com with glue records pointing to the underlying DNS host IPs.
// Override per-environment via NEXT_PUBLIC_BRAND_NAMESERVERS (comma-separated).
const BRAND_NAMESERVERS =
  (process.env.NEXT_PUBLIC_BRAND_NAMESERVERS ??
    "ns1.passivecoder.com,ns2.passivecoder.com,ns3.passivecoder.com,ns4.passivecoder.com")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export function getNameserverInstructions(): DnsInstructions {
  return {
    type: "nameserver",
    nameservers: BRAND_NAMESERVERS,
  };
}

export function getARecordInstructions(domain: string): DnsInstructions {
  return {
    type: "arecord",
    aRecord: { host: "@", value: VERCEL_IP },
    cname: { host: "www", value: `cname.vercel-dns.com` },
  };
}

export async function checkDnsResolution(domain: string): Promise<boolean> {
  try {
    // Query Google DNS to see if domain resolves to our IP
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
    const data = (await res.json()) as { Answer?: Array<{ data: string }> };
    const answers = data.Answer ?? [];
    return answers.some((a) => a.data === VERCEL_IP);
  } catch {
    return false;
  }
}
