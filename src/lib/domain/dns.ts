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

export function getNameserverInstructions(): DnsInstructions {
  return {
    type: "nameserver",
    nameservers: [
      "ns1.logicbox.net",
      "ns2.logicbox.net",
      "ns3.logicbox.net",
      "ns4.logicbox.net",
      "ns5.logicbox.net",
    ],
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
