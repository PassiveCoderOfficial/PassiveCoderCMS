// Server-only — never import in client components
const ENM_BASE_URL = (process.env.ENM_BASE_URL ?? "https://expertnear.me").replace(/\/$/, "");
const PARTNER_SECRET = process.env.PARTNER_SECRET ?? "";

function headers() {
  return {
    "Content-Type": "application/json",
    "x-partner-secret": PARTNER_SECRET,
  };
}

export type ENMTier = "free" | "pro";

/** Create or update ENM account for a PC tenant. Returns ENM userId. */
export async function enmProvision(opts: {
  email: string;
  name?: string;
  pcTenantId: string;
  tier: ENMTier;
}): Promise<number> {
  const res = await fetch(`${ENM_BASE_URL}/api/partner/provision`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(opts),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error ?? "ENM provision failed");
  return data.userId as number;
}

/** Issue a 5-min SSO token for an ENM userId. */
export async function enmSSOToken(userId: number): Promise<string> {
  const res = await fetch(`${ENM_BASE_URL}/api/partner/sso-token`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ userId }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error ?? "ENM sso-token failed");
  return data.token as string;
}

/** Full SSO URL to redirect a user to ENM dashboard (auto-logged-in). */
export function enmSSOUrl(token: string, redirect = "/dashboard"): string {
  return `${ENM_BASE_URL}/auth/sso?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(redirect)}`;
}
