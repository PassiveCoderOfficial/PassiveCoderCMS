const VERCEL_API = "https://api.vercel.com";
const VERCEL_TOKEN = () => process.env.VERCEL_API_TOKEN ?? "";
const VERCEL_PROJECT_ID = () => process.env.VERCEL_PROJECT_ID ?? "";
const VERCEL_TEAM_ID = () => process.env.VERCEL_TEAM_ID ?? "";

function teamParam() {
  const t = VERCEL_TEAM_ID();
  return t ? `&teamId=${t}` : "";
}

async function vercelFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${VERCEL_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN()}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Vercel API ${res.status}: ${text}`);
  return JSON.parse(text) as T;
}

export async function addDomainToVercel(domain: string): Promise<void> {
  await vercelFetch(`/v9/projects/${VERCEL_PROJECT_ID()}/domains?${teamParam()}`, {
    method: "POST",
    body: JSON.stringify({ name: domain }),
  });
}

export async function removeDomainFromVercel(domain: string): Promise<void> {
  await vercelFetch(`/v9/projects/${VERCEL_PROJECT_ID()}/domains/${domain}?${teamParam()}`, {
    method: "DELETE",
  });
}

export interface DomainConfig {
  name: string;
  apexName: string;
  verified: boolean;
  verification?: Array<{ type: string; domain: string; value: string; reason: string }>;
}

export async function getDomainConfig(domain: string): Promise<DomainConfig> {
  return vercelFetch<DomainConfig>(`/v9/projects/${VERCEL_PROJECT_ID()}/domains/${domain}?${teamParam()}`);
}

export async function verifyDomainOnVercel(domain: string): Promise<boolean> {
  try {
    const config = await getDomainConfig(domain);
    return config.verified;
  } catch {
    return false;
  }
}
