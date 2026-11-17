const VERCEL_IP = process.env.VERCEL_IP ?? "76.76.21.21";

// Vercel nameservers (used when the client points their whole domain to us — Vercel
// then hosts the DNS zone and auto-creates records once the domain is added via API).
// Works for any domain at any registrar; no LogicBox / panel order required.
const VERCEL_NAMESERVERS =
  (process.env.NEXT_PUBLIC_VERCEL_NAMESERVERS ?? "ns1.vercel-dns.com,ns2.vercel-dns.com")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export interface DnsInstructions {
  type: "nameserver" | "arecord";
  nameservers?: string[];
  aRecord?: { host: string; value: string };
  cname?: { host: string; value: string };
}

export function getNameserverInstructions(): DnsInstructions {
  return {
    type: "nameserver",
    nameservers: VERCEL_NAMESERVERS,
  };
}

export function getARecordInstructions(_domain: string): DnsInstructions {
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
