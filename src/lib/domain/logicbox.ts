const LB_BASE = "https://httpapi.com/api";
const LB_AUTH = () => ({
  "auth-userid": process.env.LOGICBOX_USER_ID ?? "",
  "api-key": process.env.LOGICBOX_API_KEY ?? "",
});

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

async function lbGet<T>(path: string, params: Record<string, string | string[]> = {}): Promise<T> {
  const url = `${LB_BASE}${path}?${qs({ ...LB_AUTH(), ...params })}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`LogicBox API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function lbPost<T>(path: string, body: Record<string, string | string[]>): Promise<T> {
  const url = `${LB_BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: qs({ ...LB_AUTH(), ...body }),
  });
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
  const data = await lbPost<{ entityid: number }>("/domains/register", {
    "domain-name": name,
    tlds: [tld],
    years: String(years),
    ns: ["ns1.logicbox.net", "ns2.logicbox.net", "ns3.logicbox.net", "ns4.logicbox.net", "ns5.logicbox.net"],
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

export async function addDnsRecord(
  domain: string,
  type: "A" | "CNAME",
  host: string,
  value: string,
  ttl = 300,
): Promise<void> {
  const endpoint = type === "A" ? "/dns/manage/add-ipv4-record" : "/dns/manage/add-cname-record";
  await lbPost(endpoint, {
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
