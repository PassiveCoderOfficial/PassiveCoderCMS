import "server-only";
import type { createAdminClient } from "@/lib/supabase/server";
import { CourierError, steadfastBalance, steadfastCreateOrder, steadfastStatus, type SteadfastCreds } from "./steadfast";
import {
  pathaoCities, pathaoCreateOrder, pathaoIssueToken, pathaoOrderStatus, pathaoRefreshToken, pathaoStores,
  type PathaoCreds,
} from "./pathao";
import {
  PROVIDER_LABEL, courierPhone, courierStatusLabel, mapCourierStatus, moneyHolder, nextStatus, publicTrackingUrl,
  type CourierProvider,
} from "./status";
import { SUB_FIELDS, transitionSubOrder, type SubForTransition } from "./fulfil";
import { publicUrl } from "@/lib/tenant/site-urls";
import { openJson, sealJson } from "@/lib/crypto/secret-box";

export { CourierError } from "./steadfast";
export * from "./status";

type Admin = Awaited<ReturnType<typeof createAdminClient>>;

export interface CourierAccount {
  id: string;
  tenant_id: string;
  vendor_id: string | null;
  provider: CourierProvider;
  mode: "live" | "sandbox";
  credentials: Record<string, string>;
  store_id: string | null;
  store_name: string | null;
  default_delivery_type: number;
  default_item_weight: number;
  webhook_token: string;
  integration_secret: string | null;
  allow_sellers: boolean;
  active: boolean;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  last_tested_at: string | null;
  last_test_ok: boolean | null;
  last_error: string | null;
}

/**
 * A vendor_courier_accounts row as code uses it: credentials are stored
 * sealed (AES-GCM, COURIER_SECRET_KEY) and opened here. Older plain rows
 * read as they are.
 */
export function accountFromRow(row: unknown): CourierAccount {
  const a = { ...(row as CourierAccount) };
  try {
    a.credentials = openJson<Record<string, string>>(a.credentials);
  } catch (e) {
    console.error("[couriers] could not read saved credentials", a.id, e instanceof Error ? e.message : e);
    a.credentials = {};
  }
  return a;
}

/** Secret fields per provider. Never sent to a browser unmasked. */
export const SECRET_FIELDS: Record<CourierProvider, string[]> = {
  steadfast: ["api_key", "secret_key"],
  pathao: ["client_id", "client_secret", "username", "password"],
};
const SHOWN_PLAIN = new Set(["username"]);

/** How long a "booking in progress" claim on a parcel holds. */
export const BOOKING_CLAIM_MS = 2 * 60_000;

export function mask(v: string | null | undefined): string {
  if (!v) return "";
  if (v.length <= 6) return "••••";
  return `${v.slice(0, 3)}••••${v.slice(-3)}`;
}

/** Account as the panel sees it: secrets masked, tokens left out. */
export function publicAccount(a: CourierAccount) {
  const creds: Record<string, string> = {};
  for (const f of SECRET_FIELDS[a.provider]) creds[f] = SHOWN_PLAIN.has(f) ? a.credentials?.[f] ?? "" : mask(a.credentials?.[f]);
  return {
    id: a.id, provider: a.provider, mode: a.mode, vendor_id: a.vendor_id, credentials: creds,
    store_id: a.store_id, store_name: a.store_name, default_delivery_type: a.default_delivery_type,
    default_item_weight: Number(a.default_item_weight), webhook_token: a.webhook_token,
    integration_secret: a.integration_secret, allow_sellers: a.allow_sellers, active: a.active,
    last_tested_at: a.last_tested_at, last_test_ok: a.last_test_ok, last_error: a.last_error,
  };
}

/** The seller's own accounts and the store's platform accounts. */
export async function listAccounts(admin: Admin, tenantId: string, vendorId: string | null) {
  const { data } = await admin.from("vendor_courier_accounts").select("*").eq("tenant_id", tenantId)
    .or(vendorId ? `vendor_id.eq.${vendorId},vendor_id.is.null` : "vendor_id.is.null");
  const rows = (data ?? []).map(accountFromRow);
  return {
    own: rows.filter((r) => vendorId && r.vendor_id === vendorId),
    platform: rows.filter((r) => r.vendor_id === null),
  };
}

/** The account a seller books through: their own active one, else the
 *  store's platform account when it allows sellers. */
export async function usableAccount(admin: Admin, tenantId: string, vendorId: string, provider: CourierProvider): Promise<CourierAccount | null> {
  const { own, platform } = await listAccounts(admin, tenantId, vendorId);
  return own.find((a) => a.provider === provider && a.active)
    ?? platform.find((a) => a.provider === provider && a.active && a.allow_sellers)
    ?? null;
}

/** Merge a form's credentials into the stored ones: a blank or still-masked
 *  value keeps the saved secret. */
export function mergeCredentials(provider: CourierProvider, saved: Record<string, string> | null, incoming: Record<string, unknown> | null | undefined) {
  const out: Record<string, string> = { ...(saved ?? {}) };
  for (const f of SECRET_FIELDS[provider]) {
    const v = typeof incoming?.[f] === "string" ? (incoming[f] as string).trim() : "";
    if (v && !v.includes("••")) out[f] = v;
  }
  return out;
}

// ---------------------------------------------------------------- Pathao token

/** A valid Pathao access token, from the cache, a refresh, or a fresh login. Saved back to the row. */
export async function pathaoToken(admin: Admin, a: CourierAccount, force = false): Promise<string> {
  const creds = a.credentials as unknown as PathaoCreds;
  const fresh = a.token_expires_at && new Date(a.token_expires_at).getTime() > Date.now() + 3600_000;
  if (!force && a.access_token && fresh) return a.access_token;
  let tok;
  try {
    if (a.refresh_token && !force) tok = await pathaoRefreshToken(a.mode, creds, a.refresh_token);
  } catch { /* fall through to a full login */ }
  if (!tok) tok = await pathaoIssueToken(a.mode, creds);
  const expires = new Date(Date.now() + Math.max(60, Number(tok.expires_in ?? 3600) - 300) * 1000).toISOString();
  await admin.from("vendor_courier_accounts").update({
    access_token: tok.access_token, refresh_token: tok.refresh_token, token_expires_at: expires, updated_at: new Date().toISOString(),
  }).eq("id", a.id);
  a.access_token = tok.access_token;
  a.refresh_token = tok.refresh_token;
  a.token_expires_at = expires;
  return tok.access_token;
}

/** Run a Pathao call; on a 401 log in again once and retry. */
export async function withPathao<T>(admin: Admin, a: CourierAccount, fn: (token: string) => Promise<T>): Promise<T> {
  try {
    return await fn(await pathaoToken(admin, a));
  } catch (e) {
    if (e instanceof CourierError && e.status === 401) return fn(await pathaoToken(admin, a, true));
    throw e;
  }
}

/** "Test connection": checks the login and returns something to show. */
export async function testAccount(admin: Admin, a: CourierAccount): Promise<{ ok: boolean; message: string; stores?: { store_id: number; store_name: string }[] }> {
  let result: { ok: boolean; message: string; stores?: { store_id: number; store_name: string }[] };
  try {
    if (a.provider === "steadfast") {
      const bal = await steadfastBalance(a.credentials as unknown as SteadfastCreds);
      result = { ok: true, message: `Connected. Steadfast balance: ${bal.toLocaleString()} Tk` };
    } else {
      const stores = await withPathao(admin, a, (t) => pathaoStores(a.mode, t));
      result = {
        ok: true,
        message: `Connected${a.mode === "sandbox" ? " (sandbox)" : ""}. ${stores.length} store${stores.length === 1 ? "" : "s"} found.`,
        stores: stores.map((s) => ({ store_id: s.store_id, store_name: s.store_name })),
      };
    }
  } catch (e) {
    result = { ok: false, message: e instanceof Error ? e.message : "Connection failed" };
  }
  await admin.from("vendor_courier_accounts").update({
    last_tested_at: new Date().toISOString(), last_test_ok: result.ok, last_error: result.ok ? null : result.message,
  }).eq("id", a.id);
  return result;
}

export async function pathaoCityList(admin: Admin, a: CourierAccount) {
  return withPathao(admin, a, (t) => pathaoCities(a.mode, t));
}

// ---------------------------------------------------------------- booking

export interface BookOptions {
  city_id?: number | null;
  zone_id?: number | null;
  area_id?: number | null;
  weight_kg?: number | null;
  note?: string | null;
  delivery_type?: 48 | 12;
}

interface OrderEnvelope {
  order_number: string;
  payment_method: string | null;
  payment_status: string | null;
  shipping_address: Record<string, string | null> | null;
}

/**
 * Book a parcel with the courier, then mark it shipped. COD is the parcel's
 * cod_amount, or 0 when the order is prepaid.
 */
export async function bookParcel(
  admin: Admin,
  subId: string,
  vendorId: string,
  provider: CourierProvider,
  opts: BookOptions,
  origin: string,
): Promise<{ consignment_id: string; tracking_code: string | null; tracking_url: string | null; delivery_fee?: number }> {
  const { data: subRow } = await admin.from("sub_orders")
    .select(`${SUB_FIELDS}, consignment_id, total, orders(order_number, payment_method, payment_status, shipping_address)`)
    .eq("id", subId).eq("vendor_id", vendorId).maybeSingle();
  if (!subRow) throw new CourierError("Order not found", 404);
  const sub = subRow as unknown as SubForTransition & { consignment_id: string | null; total: number; orders: OrderEnvelope | null };
  if (!["accepted", "packed"].includes(sub.status)) throw new CourierError(`Only accepted or packed orders can be booked (this one is ${sub.status})`);
  if (sub.consignment_id) throw new CourierError("This parcel is already booked with a courier", 409);
  if (sub.awaiting_payment) throw new CourierError("This order is waiting for the customer's online payment");
  const order = sub.orders;
  const addr = order?.shipping_address ?? {};
  const phone = courierPhone(addr.phone);
  if (phone.length !== 11) throw new CourierError("The customer's phone number is not a valid 11-digit BD mobile number");

  const account = await usableAccount(admin, sub.tenant_id, vendorId, provider);
  if (!account) throw new CourierError(`Connect your ${PROVIDER_LABEL[provider]} account first (Courier page)`);

  const prepaid = order?.payment_status === "paid";
  const cod = prepaid ? 0 : Number(sub.cod_amount ?? 0);
  const items = (sub.items ?? []) as { name?: string; quantity?: number }[];
  const qty = items.reduce((s, i) => s + Number(i.quantity ?? 1), 0) || 1;
  const description = items.map((i) => `${i.name ?? "Item"} x${i.quantity ?? 1}`).join(", ");
  const address = [addr.address, addr.thana ?? addr.area, addr.district ?? addr.city].filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i).join(", ");
  const note = [opts.note, addr.note].filter(Boolean).join(". ");

  // Claim the parcel before calling the courier, so two clicks (or two
  // tabs) can't book it twice. A claim older than 2 minutes is a crashed
  // attempt and may be taken over. Released if the courier call fails.
  const claimAt = new Date().toISOString();
  const staleClaim = new Date(Date.now() - BOOKING_CLAIM_MS).toISOString();
  const { data: claimed } = await admin.from("sub_orders")
    .update({ courier_booking_started_at: claimAt })
    .eq("id", sub.id).eq("vendor_id", vendorId)
    .is("consignment_id", null).is("courier_booked_at", null)
    .or(`courier_booking_started_at.is.null,courier_booking_started_at.lt.${staleClaim}`)
    .select("id").maybeSingle();
  if (!claimed) throw new CourierError("This parcel is already booked, or a booking is in progress. Refresh in a minute.", 409);
  const releaseClaim = () => admin.from("sub_orders").update({ courier_booking_started_at: null })
    .eq("id", sub.id).eq("courier_booking_started_at", claimAt).is("consignment_id", null);

  let consignment: string;
  let trackingCode: string | null = null;
  let courierStatus: string;
  let fee: number | undefined;
  try {
  if (provider === "steadfast") {
    const c = await steadfastCreateOrder(account.credentials as unknown as SteadfastCreds, {
      invoice: sub.sub_order_number, recipient_name: addr.name || "Customer", recipient_phone: phone,
      recipient_address: address || "Address not given", cod_amount: cod, note, item_description: description,
    });
    consignment = String(c.consignment_id);
    trackingCode = c.tracking_code ?? null;
    courierStatus = c.status ?? "in_review";
  } else {
    if (!account.store_id) throw new CourierError("Pick your Pathao pickup store on the Courier page first");
    const r = await withPathao(admin, account, (t) => pathaoCreateOrder(account.mode, t, {
      store_id: Number(account.store_id), merchant_order_id: sub.sub_order_number,
      recipient_name: addr.name || "Customer", recipient_phone: phone, recipient_address: address || "Address not given",
      recipient_city: opts.city_id ?? null, recipient_zone: opts.zone_id ?? null, recipient_area: opts.area_id ?? null,
      delivery_type: opts.delivery_type ?? (account.default_delivery_type === 12 ? 12 : 48), item_type: 2,
      special_instruction: note, item_quantity: qty,
      item_weight: Number(opts.weight_kg ?? account.default_item_weight ?? 0.5), amount_to_collect: cod, item_description: description,
    }));
    consignment = r.consignment_id;
    courierStatus = (r.order_status ?? "pending").toLowerCase();
    fee = r.delivery_fee;
  }
  } catch (e) {
    await releaseClaim();
    throw e;
  }

  const trackingUrl = publicTrackingUrl(provider, { trackingCode, consignmentId: consignment, phone });
  const now = new Date().toISOString();
  const booked = {
    courier: PROVIDER_LABEL[provider], tracking_number: trackingCode ?? consignment, consignment_id: consignment,
    courier_status: courierStatus, courier_tracking_url: trackingUrl, courier_booked_at: now, courier_synced_at: now,
    courier_account_id: account.id, courier_booking_started_at: null,
    money_holder: moneyHolder({ prepaid, viaPlatformAccount: account.vendor_id === null }),
  };
  // Save the consignment first, on its own, so the parcel is marked booked
  // even if the status move below loses a race (it can never be booked twice).
  await admin.from("sub_orders").update(booked).eq("id", sub.id);
  const err = await transitionSubOrder(admin, sub, "shipped", { origin, force: true, extra: booked });
  await admin.from("courier_events").insert({
    tenant_id: sub.tenant_id, sub_order_id: sub.id, provider, consignment_id: consignment, status: courierStatus,
    mapped_status: "shipped", message: `Booked with ${PROVIDER_LABEL[provider]}${fee ? ` (delivery fee ${fee} Tk)` : ""}`,
    source: "booking", event_key: `${provider}:${consignment}:booked`, raw: { cod, delivery_fee: fee ?? null },
  });
  if (err) throw new CourierError(`Booked (${consignment}) but the order did not update: ${err}`, 500);
  return { consignment_id: consignment, tracking_code: trackingCode, tracking_url: trackingUrl, delivery_fee: fee };
}

// ---------------------------------------------------------------- status

/**
 * Record a courier status for a parcel and move our status forward.
 * Idempotent: the same event_key is recorded once, and a status we already
 * have changes nothing.
 */
export async function applyCourierStatus(
  admin: Admin,
  subId: string,
  e: { provider: CourierProvider; status: string | null; message?: string | null; eventKey?: string | null; source: "webhook" | "poll" | "manual"; raw?: unknown },
  origin: string,
): Promise<{ changed: boolean; status: string }> {
  const { data } = await admin.from("sub_orders").select(`${SUB_FIELDS}, consignment_id, courier_status`).eq("id", subId).maybeSingle();
  if (!data) return { changed: false, status: "missing" };
  const sub = data as unknown as SubForTransition & { consignment_id: string | null; courier_status: string | null };
  const now = new Date().toISOString();
  const mapped = mapCourierStatus(e.provider, e.status);

  // Polls repeat the same status; only a new status becomes an event.
  const isNew = !!e.status && e.status !== sub.courier_status;
  if (e.source === "webhook" || isNew) {
    const { error } = await admin.from("courier_events").insert({
      tenant_id: sub.tenant_id, sub_order_id: sub.id, provider: e.provider, consignment_id: sub.consignment_id,
      status: e.status, mapped_status: mapped, message: e.message || courierStatusLabel(e.status), source: e.source,
      event_key: e.eventKey ?? null, raw: (e.raw ?? {}) as object,
    });
    // Unique event_key: this webhook was already handled.
    if (error && error.code === "23505") return { changed: false, status: sub.status };
  }

  const to = nextStatus(sub.status, mapped);
  const extra: Record<string, unknown> = { courier_synced_at: now };
  if (e.status) extra.courier_status = e.status;
  const err = await transitionSubOrder(admin, sub, to, { origin, extra, force: true });
  if (err) console.error("[couriers] status apply", sub.id, err);
  return { changed: !!to && !err, status: to ?? sub.status };
}

/** Ask the courier for the parcel's current status and apply it. */
export async function refreshParcel(admin: Admin, subId: string, origin: string): Promise<{ status: string; courier_status: string | null }> {
  const { data } = await admin.from("sub_orders").select("id, status, consignment_id, courier_account_id, courier_status").eq("id", subId).maybeSingle();
  if (!data?.consignment_id || !data.courier_account_id) throw new CourierError("This parcel was not booked through a connected courier");
  const { data: acc } = await admin.from("vendor_courier_accounts").select("*").eq("id", data.courier_account_id).maybeSingle();
  if (!acc) throw new CourierError("The courier account used for this parcel was removed");
  const a = accountFromRow(acc);
  let status: string | null;
  let label: string | null = null;
  if (a.provider === "steadfast") status = await steadfastStatus(a.credentials as unknown as SteadfastCreds, data.consignment_id);
  else ({ status, label } = await withPathao(admin, a, (t) => pathaoOrderStatus(a.mode, t, data.consignment_id!)));
  const r = await applyCourierStatus(admin, subId, { provider: a.provider, status, message: label, source: "poll" }, origin);
  return { status: r.status, courier_status: status };
}

/** Refresh every open booked parcel of a tenant (or all tenants) that has not
 *  been checked for `staleMinutes`. Used by the daily cron. */
export async function syncOpenParcels(admin: Admin, opts: { tenantId?: string; staleMinutes?: number; limit?: number; origin?: (tenantId: string) => Promise<string> } = {}) {
  const since = new Date(Date.now() - (opts.staleMinutes ?? 360) * 60_000).toISOString();
  let q = admin.from("sub_orders").select("id, tenant_id").eq("status", "shipped").not("consignment_id", "is", null)
    .not("courier_account_id", "is", null).or(`courier_synced_at.is.null,courier_synced_at.lt.${since}`)
    .order("courier_synced_at", { ascending: true, nullsFirst: true }).limit(opts.limit ?? 200);
  if (opts.tenantId) q = q.eq("tenant_id", opts.tenantId);
  const { data } = await q;
  const summary = { checked: 0, changed: 0, errors: 0 };
  const origins = new Map<string, string>();
  for (const row of data ?? []) {
    summary.checked++;
    try {
      if (!origins.has(row.tenant_id)) origins.set(row.tenant_id, opts.origin ? await opts.origin(row.tenant_id) : "");
      const before = "shipped";
      const r = await refreshParcel(admin, row.id, origins.get(row.tenant_id)!);
      if (r.status !== before) summary.changed++;
    } catch {
      summary.errors++;
      await admin.from("sub_orders").update({ courier_synced_at: new Date().toISOString() }).eq("id", row.id);
    }
  }
  return summary;
}

// ---------------------------------------------------------------- saving

export interface AccountInput {
  provider?: string;
  mode?: string;
  credentials?: Record<string, unknown>;
  store_id?: string | number | null;
  store_name?: string | null;
  default_delivery_type?: number | string | null;
  default_item_weight?: number | string | null;
  integration_secret?: string | null;
  allow_sellers?: boolean;
  active?: boolean;
}

/** Create or update the seller's (or, with vendorId null, the store's) account for one provider. */
export async function saveAccount(admin: Admin, tenantId: string, vendorId: string | null, b: AccountInput): Promise<CourierAccount> {
  const provider = b.provider === "pathao" ? "pathao" : b.provider === "steadfast" ? "steadfast" : null;
  if (!provider) throw new CourierError("Choose Steadfast or Pathao");
  let q = admin.from("vendor_courier_accounts").select("*").eq("tenant_id", tenantId).eq("provider", provider);
  q = vendorId ? q.eq("vendor_id", vendorId) : q.is("vendor_id", null);
  const { data: existing } = await q.maybeSingle();
  const prev = existing ? accountFromRow(existing) : null;
  const credentials = mergeCredentials(provider, prev?.credentials ?? null, b.credentials);
  const missing = SECRET_FIELDS[provider].filter((f) => !credentials[f]);
  if (missing.length) throw new CourierError(`Fill in: ${missing.join(", ").replace(/_/g, " ")}`);
  const mode = provider === "pathao" && b.mode === "sandbox" ? "sandbox" : "live";
  const credsChanged = JSON.stringify(credentials) !== JSON.stringify(prev?.credentials ?? {}) || mode !== prev?.mode;
  const row: Record<string, unknown> = {
    tenant_id: tenantId, vendor_id: vendorId, provider, mode, credentials: sealJson(credentials),
    store_id: b.store_id != null && b.store_id !== "" ? String(b.store_id) : credsChanged ? null : prev?.store_id ?? null,
    store_name: b.store_name !== undefined ? b.store_name || null : credsChanged ? null : prev?.store_name ?? null,
    default_delivery_type: Number(b.default_delivery_type) === 12 ? 12 : 48,
    default_item_weight: Math.min(10, Math.max(0.5, Number(b.default_item_weight) || Number(prev?.default_item_weight) || 0.5)),
    integration_secret: b.integration_secret !== undefined ? (b.integration_secret?.trim() || null) : prev?.integration_secret ?? null,
    allow_sellers: vendorId ? true : b.allow_sellers ?? prev?.allow_sellers ?? true,
    active: b.active ?? prev?.active ?? true,
    updated_at: new Date().toISOString(),
  };
  // New login details: the cached Pathao token belongs to the old ones.
  if (credsChanged) Object.assign(row, { access_token: null, refresh_token: null, token_expires_at: null });
  const res = prev
    ? await admin.from("vendor_courier_accounts").update(row).eq("id", prev.id).select("*").single()
    : await admin.from("vendor_courier_accounts").insert(row).select("*").single();
  if (res.error) throw new CourierError(res.error.message, 500);
  return accountFromRow(res.data);
}

export async function deleteAccount(admin: Admin, tenantId: string, vendorId: string | null, provider: string) {
  let q = admin.from("vendor_courier_accounts").delete().eq("tenant_id", tenantId).eq("provider", provider);
  q = vendorId ? q.eq("vendor_id", vendorId) : q.is("vendor_id", null);
  await q;
}

export async function accountFor(admin: Admin, tenantId: string, vendorId: string | null, provider: string): Promise<CourierAccount | null> {
  let q = admin.from("vendor_courier_accounts").select("*").eq("tenant_id", tenantId).eq("provider", provider);
  q = vendorId ? q.eq("vendor_id", vendorId) : q.is("vendor_id", null);
  const { data } = await q.maybeSingle();
  return data ? accountFromRow(data) : null;
}

/** Webhook addresses to paste in the courier panels. */
export function webhookUrls(origin: string) {
  return { steadfast: `${origin}/api/webhooks/steadfast`, pathao: `${origin}/api/webhooks/pathao` };
}

/** The store's public origin (custom domain when live), for links in emails. */
export async function tenantOrigin(admin: Admin, tenantId: string): Promise<string> {
  const { data: t } = await admin.from("tenants").select("slug, custom_domain, domain_status").eq("id", tenantId).maybeSingle();
  if (!t) return "";
  return publicUrl({ slug: t.slug as string, custom_domain: t.domain_status === "active" ? (t.custom_domain as string | null) : null });
}
