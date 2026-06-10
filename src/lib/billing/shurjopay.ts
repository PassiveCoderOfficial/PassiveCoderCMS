// Minimal shurjoPay (v2.1) client. Defaults to the public sandbox so the flow
// works end-to-end before live merchant credentials are added. Override via env:
//   SHURJOPAY_BASE_URL, SHURJOPAY_USERNAME, SHURJOPAY_PASSWORD, SHURJOPAY_PREFIX
const BASE = process.env.SHURJOPAY_BASE_URL ?? "https://sandbox.shurjopayment.com";
const USERNAME = process.env.SHURJOPAY_USERNAME ?? "sp_sandbox";
const PASSWORD = process.env.SHURJOPAY_PASSWORD ?? "pyyk97hu&6u6";
const PREFIX = process.env.SHURJOPAY_PREFIX ?? "sp";

export const isShurjoPaySandbox = !process.env.SHURJOPAY_USERNAME;

interface SpToken {
  token: string;
  store_id: number;
  execute_url: string;
  token_type: string;
}

async function getToken(): Promise<SpToken> {
  const res = await fetch(`${BASE}/api/get_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!data?.token) throw new Error("shurjoPay auth failed");
  return data as SpToken;
}

export interface MakePaymentInput {
  amount: number; // major units (BDT)
  orderId: string;
  currency?: string;
  returnUrl: string;
  cancelUrl: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
}

/** Initiate a payment; returns the hosted checkout URL to redirect the user to. */
export async function makePayment(input: MakePaymentInput): Promise<{ checkoutUrl: string; spOrderId: string }> {
  const t = await getToken();
  const res = await fetch(`${BASE}/api/secret-pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t.token}` },
    body: JSON.stringify({
      token: t.token,
      store_id: t.store_id,
      prefix: PREFIX,
      amount: input.amount,
      order_id: input.orderId,
      currency: input.currency ?? "BDT",
      return_url: input.returnUrl,
      cancel_url: input.cancelUrl,
      customer_name: input.customerName,
      customer_phone: input.customerPhone ?? "N/A",
      customer_email: input.customerEmail ?? "",
      customer_address: "N/A",
      customer_city: "N/A",
      client_ip: "127.0.0.1",
    }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!data?.checkout_url) throw new Error(data?.message ?? "shurjoPay init failed");
  return { checkoutUrl: data.checkout_url, spOrderId: data.sp_order_id ?? input.orderId };
}

/** Verify a payment by shurjoPay order id. Returns true when sp_code === "1000". */
export async function verifyPayment(spOrderId: string): Promise<{ ok: boolean; raw: unknown }> {
  const t = await getToken();
  const res = await fetch(`${BASE}/api/verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t.token}` },
    body: JSON.stringify({ order_id: spOrderId }),
    cache: "no-store",
  });
  const data = await res.json();
  const row = Array.isArray(data) ? data[0] : data;
  const ok = String(row?.sp_code) === "1000" || row?.bank_status === "Success";
  return { ok, raw: row };
}
