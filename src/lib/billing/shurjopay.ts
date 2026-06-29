// Minimal shurjoPay (v2.1) client.
// Credentials resolved at call-time via getSpConfig() so SA can toggle
// sandbox/live from the dashboard without redeploying.

const SANDBOX_CONFIG = {
  base: "https://sandbox.shurjopayment.com",
  username: "sp_sandbox",
  password: "pyyk97hu&6u6",
  prefix: "sp",
};

function getSpConfig(forceSandbox?: boolean) {
  const useSandbox = forceSandbox ?? !process.env.SHURJOPAY_USERNAME;
  if (useSandbox) return SANDBOX_CONFIG;
  return {
    base: process.env.SHURJOPAY_BASE_URL ?? "https://engine.shurjopayment.com",
    username: process.env.SHURJOPAY_USERNAME!,
    password: process.env.SHURJOPAY_PASSWORD!,
    prefix: process.env.SHURJOPAY_PREFIX ?? "sp",
  };
}

interface SpToken {
  token: string;
  store_id: number;
  execute_url: string;
  token_type: string;
}

async function getToken(cfg: ReturnType<typeof getSpConfig>): Promise<SpToken> {
  const res = await fetch(`${cfg.base}/api/get_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: cfg.username, password: cfg.password }),
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
  sandbox?: boolean; // override: true = force sandbox, false = force live
}

export async function makePayment(input: MakePaymentInput): Promise<{ checkoutUrl: string; spOrderId: string }> {
  const cfg = getSpConfig(input.sandbox);
  const t = await getToken(cfg);
  const res = await fetch(`${cfg.base}/api/secret-pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t.token}` },
    body: JSON.stringify({
      token: t.token,
      store_id: t.store_id,
      prefix: cfg.prefix,
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

export async function verifyPayment(spOrderId: string, sandbox?: boolean): Promise<{ ok: boolean; raw: unknown }> {
  const cfg = getSpConfig(sandbox);
  const t = await getToken(cfg);
  const res = await fetch(`${cfg.base}/api/verification`, {
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
