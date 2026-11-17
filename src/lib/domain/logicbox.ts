const LB_BASE = "https://httpapi.com/api";
const LB_AUTH = () => ({
  "auth-userid": process.env.LOGICBOX_USER_ID ?? "",
  "api-key": process.env.LOGICBOX_API_KEY ?? "",
});

// Optional fixed-IP proxy. ResellerClub requires the CALLER's IP to be whitelisted,
// but Vercel functions have no fixed egress IP. When LOGICBOX_PROXY_URL is set, route
// all API calls through the proxy (a cPanel PHP script on a whitelisted host). The
// proxy takes ?path=/api/... and forwards to httpapi.com.
const LB_PROXY_URL = () => process.env.LOGICBOX_PROXY_URL ?? "";
const LB_PROXY_SECRET = () => process.env.LOGICBOX_PROXY_SECRET ?? "";

export interface DomainAvailability {
  domain: string;
  available: boolean;
  price?: number;
  currency?: string;
}

export interface ContactId {
  contactId: number;
}

function qs(params: Record<string, string | string[]>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) {
      for (const item of v) parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(item)}`);
    } else {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    }
  }
  return parts.join("&");
}

// ResellerClub/LogicBox requires a response-format suffix on every endpoint.
function withJson(path: string): string {
  return /\.(json|xml)$/.test(path) ? path : `${path}.json`;
}

async function lbGet<T>(rawPath: string, params: Record<string, string | string[]> = {}): Promise<T> {
  const path = withJson(rawPath);
  const proxy = LB_PROXY_URL();
  const query = qs({ ...LB_AUTH(), ...params });
  let url: string;
  const headers: Record<string, string> = {};
  if (proxy) {
    // path here is like "/domains/available.json"; the real API path is "/api" + path
    url = `${proxy}?path=${encodeURIComponent("/api" + path)}&${query}`;
    headers["X-Proxy-Secret"] = LB_PROXY_SECRET();
  } else {
    url = `${LB_BASE}${path}?${query}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`LogicBox API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function lbPost<T>(rawPath: string, body: Record<string, string | string[]>): Promise<T> {
  const path = withJson(rawPath);
  const proxy = LB_PROXY_URL();
  const payload = qs({ ...LB_AUTH(), ...body });
  let url: string;
  const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };
  if (proxy) {
    url = `${proxy}?path=${encodeURIComponent("/api" + path)}`;
    headers["X-Proxy-Secret"] = LB_PROXY_SECRET();
  } else {
    url = `${LB_BASE}${path}`;
  }
  const res = await fetch(url, { method: "POST", headers, body: payload });
  if (!res.ok) throw new Error(`LogicBox API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function searchDomains(names: string[], tlds: string[]): Promise<DomainAvailability[]> {
  // LogicBox bulk availability check
  const data = await lbGet<Record<string, { status: string; price?: number }>>("/domains/available", {
    "domain-name": names,
    tlds,
    suggest: "false",
  });

  return Object.entries(data).map(([domain, info]) => ({
    domain,
    available: info.status === "available",
    price: info.price,
    currency: "USD",
  }));
}

export async function createContact(details: {
  name: string;
  email: string;
  company: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  phone: string;
}): Promise<number> {
  const data = await lbPost<{ contactid: number }>("/contacts/add", {
    name: details.name,
    company: details.company,
    email: details.email,
    "address-line-1": details.address,
    city: details.city,
    state: details.state,
    country: details.country,
    zipcode: details.zip,
    "phone-cc": details.phone.replace(/^\+(\d+).*/, "$1") || "1",
    phone: details.phone.replace(/^\+\d+(.*)/, "$1").replace(/\D/g, "") || "0000000000",
    type: "Contact",
  });
  return data.contactid;
}

export async function registerDomain(
  domain: string,
  contactId: number,
  years = 1,
  autoRenew = true,
): Promise<{ orderId: number }> {
  const [name, ...tldParts] = domain.split(".");
  const tld = tldParts.join(".");
  // Point newly-registered domains at Vercel's nameservers so Vercel hosts the DNS
  // zone (creates records + SSL automatically when the domain is added to the project).
  const vercelNs = (process.env.NEXT_PUBLIC_VERCEL_NAMESERVERS ?? "ns1.vercel-dns.com,ns2.vercel-dns.com")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const ns = vercelNs.length >= 2
    ? vercelNs
    : ["ns1.vercel-dns.com", "ns2.vercel-dns.com"];
  const data = await lbPost<{ entityid: number }>("/domains/register", {
    "domain-name": name,
    tlds: [tld],
    years: String(years),
    ns,
    "reg-contact-id": String(contactId),
    "admin-contact-id": String(contactId),
    "tech-contact-id": String(contactId),
    "billing-contact-id": String(contactId),
    "invoice-option": "NoInvoice",
    "purchase-privacy": "true",
    "auto-renew": autoRenew ? "true" : "false",
  });
  return { orderId: data.entityid };
}

/**
 * Activate the (free) DNS service for an order before adding records.
 * ResellerClub requires this once per domain order; records cannot be added until
 * the DNS zone exists. Idempotent-ish: if already active, the API returns an error
 * we can safely ignore.
 */
// Activate the (free) DNS hosting service for a domain. Works for externally-
// registered domains by domain-name (no order-id needed). Must run before adding
// records. Idempotent: "already active" errors are non-fatal.
export async function activateDnsService(domain: string): Promise<void> {
  try {
    await lbGet("/dns/manage/activate-dns-service", { "domain-name": domain });
  } catch (e) {
    console.warn("activateDnsService:", e instanceof Error ? e.message : e);
  }
}

export async function addDnsRecord(
  domain: string,
  type: "A" | "CNAME",
  host: string,
  value: string,
  ttl = 300,
): Promise<void> {
  // ResellerClub DNS add endpoints are GET, not POST.
  const endpoint = type === "A" ? "/dns/manage/add-ipv4-record" : "/dns/manage/add-cname-record";
  await lbGet(endpoint, {
    "domain-name": domain,
    host,
    value,
    ttl: String(ttl),
  });
}

export async function setNameservers(domain: string, ns: string[]): Promise<void> {
  await lbPost("/domains/modify-ns", {
    "order-id": domain,
    ns,
  });
}

export async function getDomainDetails(orderId: number): Promise<{ nameservers: string[]; status: string }> {
  const data = await lbGet<{ nameservers: string[]; currentstatus: string }>("/domains/details-by-id", {
    "order-id": String(orderId),
    options: "NsDetails",
  });
  return { nameservers: data.nameservers, status: data.currentstatus };
}
