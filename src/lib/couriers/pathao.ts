/**
 * Pathao Courier (Aladdin) merchant API. Plain fetch, no SDK.
 * Tested against the sandbox on 2026-11-07: issue-token (password and
 * refresh_token grants), city-list, zone-list, area-list, stores, orders,
 * orders/{id}/info and merchant/price-plan all answer as typed here.
 * A refresh invalidates the previous access token, so the caller must save
 * the new pair every time (index.ts caches it in vendor_courier_accounts).
 */
import { CourierError } from "./steadfast";

export const PATHAO_LIVE = "https://api-hermes.pathao.com";
export const PATHAO_SANDBOX = "https://courier-api-sandbox.pathao.com";
export const pathaoBase = (mode: string) => (mode === "sandbox" ? PATHAO_SANDBOX : PATHAO_LIVE);

/** Public sandbox login from Pathao's developer docs. */
export const PATHAO_SANDBOX_CREDS = {
  client_id: "7N1aMJQbWm",
  client_secret: "wRcaibZkUdSNz2EI9ZyuXLlNrnAv0TdPUPXMnD39",
  username: "test@pathao.com",
  password: "lovePathao",
};

export interface PathaoCreds {
  client_id: string;
  client_secret: string;
  username: string;
  password: string;
}

export interface PathaoToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface PathaoCity { city_id: number; city_name: string }
export interface PathaoZone { zone_id: number; zone_name: string }
export interface PathaoArea { area_id: number; area_name: string; home_delivery_available?: boolean }
export interface PathaoStore { store_id: number; store_name: string; store_address: string; is_active: number; city_id: number; zone_id: number }

export interface PathaoOrderInput {
  store_id: number;
  merchant_order_id: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_city?: number | null;
  recipient_zone?: number | null;
  recipient_area?: number | null;
  delivery_type: 48 | 12;
  item_type: 1 | 2;
  special_instruction?: string;
  item_quantity: number;
  item_weight: number;
  amount_to_collect: number;
  item_description?: string;
}

export interface PathaoOrderResult {
  consignment_id: string;
  merchant_order_id: string;
  order_status: string;
  delivery_fee: number;
}

async function call<T>(mode: string, path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${pathaoBase(mode)}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
      },
      signal: AbortSignal.timeout(30_000),
    });
  } catch (e) {
    console.error("[pathao] fetch failed", path, e instanceof Error ? e.message : e);
    throw new CourierError("Could not reach Pathao. Try again in a minute.", 502);
  }
  const text = await res.text();
  let body: Record<string, unknown> = {};
  try { body = JSON.parse(text); } catch { /* html */ }
  if (res.status === 401) throw new CourierError("Pathao login expired or was rejected", 401);
  if (!res.ok) {
    const errs = body.errors && typeof body.errors === "object"
      ? Object.values(body.errors as Record<string, unknown>).flat().join(" ")
      : "";
    throw new CourierError(`Pathao: ${errs || (body.message as string) || `error ${res.status}`}`, res.status >= 500 ? 502 : 400);
  }
  return body as T;
}

export async function pathaoIssueToken(mode: string, creds: PathaoCreds): Promise<PathaoToken> {
  if (!creds?.client_id || !creds?.client_secret || !creds?.username || !creds?.password) {
    throw new CourierError("Pathao client id, client secret, username and password are all needed");
  }
  try {
    return await call<PathaoToken>(mode, "/aladdin/api/v1/issue-token", {
      method: "POST",
      body: JSON.stringify({ ...creds, grant_type: "password" }),
    });
  } catch (e) {
    if (e instanceof CourierError && e.status !== 502) throw new CourierError("Pathao rejected these login details", 401);
    throw e;
  }
}

export async function pathaoRefreshToken(mode: string, creds: Pick<PathaoCreds, "client_id" | "client_secret">, refreshToken: string): Promise<PathaoToken> {
  return call<PathaoToken>(mode, "/aladdin/api/v1/issue-token", {
    method: "POST",
    body: JSON.stringify({ client_id: creds.client_id, client_secret: creds.client_secret, grant_type: "refresh_token", refresh_token: refreshToken }),
  });
}

type List<T> = { data?: { data?: T[] } };

export async function pathaoCities(mode: string, token: string): Promise<PathaoCity[]> {
  const b = await call<List<PathaoCity>>(mode, "/aladdin/api/v1/city-list", { token });
  return (b.data?.data ?? []).map((c) => ({ ...c, city_name: c.city_name.trim() }));
}

export async function pathaoZones(mode: string, token: string, cityId: number): Promise<PathaoZone[]> {
  const b = await call<List<PathaoZone>>(mode, `/aladdin/api/v1/cities/${cityId}/zone-list`, { token });
  return (b.data?.data ?? []).map((z) => ({ ...z, zone_name: z.zone_name.trim() }));
}

export async function pathaoAreas(mode: string, token: string, zoneId: number): Promise<PathaoArea[]> {
  const b = await call<List<PathaoArea>>(mode, `/aladdin/api/v1/zones/${zoneId}/area-list`, { token });
  return (b.data?.data ?? []).map((a) => ({ ...a, area_name: a.area_name.trim() }));
}

export async function pathaoStores(mode: string, token: string): Promise<PathaoStore[]> {
  const b = await call<List<PathaoStore>>(mode, "/aladdin/api/v1/stores", { token });
  return b.data?.data ?? [];
}

export async function pathaoCreateOrder(mode: string, token: string, o: PathaoOrderInput): Promise<PathaoOrderResult> {
  const body: Record<string, unknown> = {
    ...o,
    recipient_address: o.recipient_address.padEnd(10, " ").slice(0, 220),
    recipient_name: o.recipient_name.slice(0, 100),
    item_weight: Math.min(10, Math.max(0.5, Number(o.item_weight) || 0.5)),
    amount_to_collect: Math.max(0, Math.round(o.amount_to_collect)),
    item_quantity: Math.max(1, Math.round(o.item_quantity)),
    special_instruction: o.special_instruction?.slice(0, 250) || "",
    item_description: o.item_description?.slice(0, 250) || "",
  };
  for (const k of ["recipient_city", "recipient_zone", "recipient_area"]) if (!body[k]) delete body[k];
  const b = await call<{ data?: PathaoOrderResult; message?: string }>(mode, "/aladdin/api/v1/orders", {
    method: "POST", token, body: JSON.stringify(body),
  });
  if (!b.data?.consignment_id) throw new CourierError(`Pathao: ${b.message ?? "no consignment returned"}`);
  return b.data;
}

/** order_status_slug (e.g. pending, picked, in_transit, delivered, return). */
export async function pathaoOrderStatus(mode: string, token: string, consignmentId: string): Promise<{ status: string | null; label: string | null }> {
  const b = await call<{ data?: { order_status?: string; order_status_slug?: string } }>(mode, `/aladdin/api/v1/orders/${encodeURIComponent(consignmentId)}/info`, { token });
  return { status: b.data?.order_status_slug ?? b.data?.order_status ?? null, label: b.data?.order_status ?? null };
}

const nkey = (s: string) => s.toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z]/g, "");

/** Pathao's city for one of our (BD_LOCATIONS) districts. Pathao spells
 *  several the old way (Chittagong, Bogra, Barisal, B. Baria). */
export function matchPathaoCity(cities: PathaoCity[], district: string | null | undefined): PathaoCity | null {
  if (!district) return null;
  const alias: Record<string, string> = {
    chattogram: "chittagong", bogura: "bogra", barishal: "barisal", brahmanbaria: "bbaria", gopalganj: "gopalgonj",
    jhalokati: "jhalokathi", jhenaidah: "jhenidah", khagrachhari: "khagrachari", munshiganj: "munsiganj",
    narsingdi: "narshingdi", netrokona: "netrakona",
  };
  const k = nkey(district);
  const want = [k, alias[k]].filter(Boolean);
  return cities.find((c) => want.includes(nkey(c.city_name))) ?? null;
}

/** Best Pathao zone for a thana name (exact, then starts-with, then contains). */
export function matchPathaoZone(zones: PathaoZone[], thana: string | null | undefined): PathaoZone | null {
  if (!thana) return null;
  const k = nkey(thana);
  if (!k) return null;
  return zones.find((z) => nkey(z.zone_name) === k)
    ?? zones.find((z) => nkey(z.zone_name).startsWith(k))
    ?? zones.find((z) => nkey(z.zone_name).includes(k) || (nkey(z.zone_name).length > 3 && k.includes(nkey(z.zone_name))))
    ?? null;
}
