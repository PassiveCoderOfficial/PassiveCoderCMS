/**
 * Steadfast Courier (packzy) merchant API. Plain fetch, no SDK.
 * Auth: Api-Key + Secret-Key headers. Steadfast has no sandbox.
 */
export const STEADFAST_BASE = "https://portal.packzy.com/api/v1";

export interface SteadfastCreds {
  api_key: string;
  secret_key: string;
}

export interface SteadfastOrderInput {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
  item_description?: string;
}

export interface SteadfastConsignment {
  consignment_id: number | string;
  invoice: string;
  tracking_code: string;
  status: string;
}

export class CourierError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

async function call<T>(creds: SteadfastCreds, path: string, init: RequestInit = {}): Promise<T> {
  if (!creds?.api_key || !creds?.secret_key) throw new CourierError("Steadfast API key and secret key are not set");
  let res: Response;
  try {
    res = await fetch(`${STEADFAST_BASE}${path}`, {
      ...init,
      headers: {
        "Api-Key": creds.api_key,
        "Secret-Key": creds.secret_key,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new CourierError("Could not reach Steadfast. Try again in a minute.", 502);
  }
  const text = await res.text();
  let body: Record<string, unknown> = {};
  try { body = JSON.parse(text); } catch { /* html error page */ }
  if (res.status === 401 || res.status === 403) throw new CourierError("Steadfast rejected the API key or secret key", 401);
  if (!res.ok || (typeof body.status === "number" && body.status >= 400)) {
    const errs = body.errors && typeof body.errors === "object"
      ? Object.values(body.errors as Record<string, unknown>).flat().join(" ")
      : "";
    throw new CourierError(`Steadfast: ${errs || (body.message as string) || `error ${res.status}`}`, res.status >= 500 ? 502 : 400);
  }
  return body as T;
}

export async function steadfastBalance(creds: SteadfastCreds): Promise<number> {
  const b = await call<{ current_balance?: number }>(creds, "/get_balance");
  return Number(b.current_balance ?? 0);
}

export async function steadfastCreateOrder(creds: SteadfastCreds, o: SteadfastOrderInput): Promise<SteadfastConsignment> {
  const b = await call<{ consignment?: SteadfastConsignment; message?: string }>(creds, "/create_order", {
    method: "POST",
    body: JSON.stringify({
      invoice: o.invoice.slice(0, 60),
      recipient_name: o.recipient_name.slice(0, 100),
      recipient_phone: o.recipient_phone,
      recipient_address: o.recipient_address.slice(0, 250),
      cod_amount: Math.max(0, Number(o.cod_amount.toFixed(2))),
      note: o.note?.slice(0, 250) || undefined,
      item_description: o.item_description?.slice(0, 250) || undefined,
    }),
  });
  if (!b.consignment?.consignment_id) throw new CourierError(`Steadfast: ${b.message ?? "no consignment returned"}`);
  return b.consignment;
}

/** delivery_status for a consignment id. */
export async function steadfastStatus(creds: SteadfastCreds, consignmentId: string): Promise<string | null> {
  const b = await call<{ delivery_status?: string }>(creds, `/status_by_cid/${encodeURIComponent(consignmentId)}`);
  return b.delivery_status ?? null;
}
