/** Open edition: no food hub, so no hub attribution. */
export const FOOD_VIA_COOKIE = "pc_food_via";

export function isHubLanding(_search: URLSearchParams): boolean {
  return false;
}

export const hubCookie = {
  name: FOOD_VIA_COOKIE,
  value: "hub",
  maxAge: 30 * 86400,
  path: "/",
  sameSite: "lax" as const,
  httpOnly: true,
  secure: true,
};

export function orderAttribution(_cookieValue: string | undefined | null, _programme: { commission_pct: number } | null): { source: string | null; hub_commission_pct: number | null } {
  return { source: null, hub_commission_pct: null };
}
