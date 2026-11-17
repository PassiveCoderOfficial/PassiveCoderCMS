/**
 * SSLCommerz hosted checkout (bKash, Nagad, Rocket, cards, net banking in BD).
 *
 * Flow: initSession() returns GatewayPageURL; the buyer pays there; SSLCommerz
 * POSTs form data to our success / fail / cancel URLs (browser) and to the IPN
 * URL (server to server). Neither POST is trusted on its own: every success is
 * re-checked with validatePayment() against the validation API, and the
 * amount and currency must match the order.
 *
 * Credentials are per store, in tenant_payment_methods (gateway_slug
 * 'sslcommerz', settings.store_id / store_password / sandbox). Plain fetch,
 * no SDK.
 */
import { createAdminClient } from "@/lib/supabase/server";

export const SSLCZ_SANDBOX = "https://sandbox.sslcommerz.com";
export const SSLCZ_LIVE = "https://securepay.sslcommerz.com";

export interface SslczConfig {
  storeId: string;
  storePassword: string;
  sandbox: boolean;
}

const truthy = (v: unknown) => v === true || v === "true" || v === "1" || v === "yes" || v === "on";

/** This store's SSLCommerz credentials, or null when not set up / switched off. */
export async function getSslczConfig(tenantId: string): Promise<SslczConfig | null> {
  const admin = await createAdminClient();
  const { data } = await admin
    .from("tenant_payment_methods")
    .select("enabled, settings")
    .eq("tenant_id", tenantId)
    .eq("gateway_slug", "sslcommerz")
    .maybeSingle();
  if (!data?.enabled) return null;
  const s = (data.settings ?? {}) as Record<string, unknown>;
  const storeId = String(s.store_id ?? "").trim();
  const storePassword = String(s.store_password ?? "").trim();
  if (!storeId || !storePassword) return null;
  return { storeId, storePassword, sandbox: truthy(s.sandbox) };
}

export const sslczBase = (c: Pick<SslczConfig, "sandbox">) => (c.sandbox ? SSLCZ_SANDBOX : SSLCZ_LIVE);

export interface InitInput {
  tranId: string;
  amount: number;
  currency?: string;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postcode?: string;
    country?: string;
  };
  productName: string;
  productCategory?: string;
  itemCount?: number;
  /** Echoed back on callbacks. */
  valueA?: string;
  valueB?: string;
}

export interface InitResult {
  ok: boolean;
  url?: string;
  sessionKey?: string;
  error?: string;
}

/** Start a hosted payment session. Never throws. */
export async function initSession(cfg: SslczConfig, input: InitInput, fetchImpl: typeof fetch = fetch): Promise<InitResult> {
  const c = input.customer;
  const form = new URLSearchParams({
    store_id: cfg.storeId,
    store_passwd: cfg.storePassword,
    total_amount: input.amount.toFixed(2),
    currency: input.currency ?? "BDT",
    tran_id: input.tranId,
    success_url: input.successUrl,
    fail_url: input.failUrl,
    cancel_url: input.cancelUrl,
    ipn_url: input.ipnUrl,
    cus_name: c.name.slice(0, 50) || "Customer",
    cus_email: c.email || "customer@example.com",
    cus_add1: (c.address || c.city || "Bangladesh").slice(0, 50),
    cus_city: c.city || "Dhaka",
    cus_postcode: c.postcode || "1000",
    cus_country: c.country || "Bangladesh",
    cus_phone: c.phone,
    shipping_method: "Courier",
    ship_name: c.name.slice(0, 50) || "Customer",
    ship_add1: (c.address || c.city || "Bangladesh").slice(0, 50),
    ship_city: c.city || "Dhaka",
    ship_postcode: c.postcode || "1000",
    ship_country: c.country || "Bangladesh",
    num_of_item: String(input.itemCount ?? 1),
    product_name: input.productName.slice(0, 250) || "Order",
    product_category: input.productCategory ?? "General",
    product_profile: "physical-goods",
  });
  if (input.valueA) form.set("value_a", input.valueA);
  if (input.valueB) form.set("value_b", input.valueB);

  try {
    const res = await fetchImpl(`${sslczBase(cfg)}/gwprocess/v4/api.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const j = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (j && String(j.status).toUpperCase() === "SUCCESS" && typeof j.GatewayPageURL === "string" && j.GatewayPageURL) {
      return { ok: true, url: j.GatewayPageURL, sessionKey: String(j.sessionkey ?? "") };
    }
    return { ok: false, error: String(j?.failedreason ?? `Payment gateway error (${res.status})`) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Payment gateway unreachable" };
  }
}

export interface ValidationResult {
  valid: boolean;
  status?: string;
  tranId?: string;
  bankTranId?: string;
  amount?: number;
  currency?: string;
  cardType?: string;
  riskLevel?: string;
  raw?: Record<string, unknown>;
  error?: string;
}

/** Ask SSLCommerz whether val_id is a real, completed payment. */
export async function validatePayment(cfg: SslczConfig, valId: string, fetchImpl: typeof fetch = fetch): Promise<ValidationResult> {
  const q = new URLSearchParams({ val_id: valId, store_id: cfg.storeId, store_passwd: cfg.storePassword, format: "json", v: "1" });
  try {
    const res = await fetchImpl(`${sslczBase(cfg)}/validator/api/validationserverAPI.php?${q.toString()}`, { cache: "no-store" });
    const j = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!j) return { valid: false, error: `Validation failed (${res.status})` };
    const status = String(j.status ?? "").toUpperCase();
    return {
      valid: status === "VALID" || status === "VALIDATED",
      status,
      tranId: j.tran_id ? String(j.tran_id) : undefined,
      bankTranId: j.bank_tran_id ? String(j.bank_tran_id) : undefined,
      amount: j.amount !== undefined ? Number(j.amount) : undefined,
      currency: j.currency ? String(j.currency) : undefined,
      cardType: j.card_type ? String(j.card_type) : undefined,
      riskLevel: j.risk_level !== undefined ? String(j.risk_level) : undefined,
      raw: j,
    };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : "Validation unreachable" };
  }
}

/** Transaction id for one payment attempt on an order. Each retry gets a
 *  fresh id; all of them start with the order number. */
export const tranIdFor = (orderNumber: string) => `${orderNumber}-${Date.now().toString(36).toUpperCase()}`;

/** A validated payment really pays this order: tran id of this order, same
 *  amount and currency. */
export function paymentMatchesOrder(
  v: Pick<ValidationResult, "valid" | "tranId" | "amount" | "currency">,
  order: { orderNumber: string; total: number; currency?: string },
): boolean {
  if (!v.valid) return false;
  if (!v.tranId || !v.tranId.startsWith(`${order.orderNumber}-`)) return false;
  if ((v.currency ?? "").toUpperCase() !== (order.currency ?? "BDT").toUpperCase()) return false;
  return Math.abs(Number(v.amount) - Number(order.total)) < 0.01;
}
