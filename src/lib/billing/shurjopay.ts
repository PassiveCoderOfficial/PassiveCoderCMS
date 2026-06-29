// Minimal shurjoPay (v2.1) client.
// Credentials resolved at call-time from DB (platform_settings) with env-var fallback.

const PUBLIC_SANDBOX = {
  base: "https://sandbox.shurjopayment.com",
  username: "sp_sandbox",
  password: "pyyk97hu&6u6",
  prefix: "sp",
};

export interface SpConfig {
  base: string;
  username: string;
  password: string;
  prefix: string;
  sandbox: boolean;
}

/** Build SpConfig from platform_settings DB row, falling back to env vars. */
export function resolveSpConfig(ps: Record<string, unknown> | null): SpConfig {
  const sandbox = (ps?.shurjopay_mode ?? "sandbox") === "sandbox";
  if (sandbox) {
    return {
      base: "https://sandbox.shurjopayment.com",
      username: (ps?.shurjopay_sandbox_username as string | null) || PUBLIC_SANDBOX.username,
      password: (ps?.shurjopay_sandbox_password as string | null) || PUBLIC_SANDBOX.password,
      prefix: (ps?.shurjopay_sandbox_prefix as string | null) || PUBLIC_SANDBOX.prefix,
      sandbox: true,
    };
  }
  return {
    base: (ps?.shurjopay_live_base_url as string | null) || process.env.SHURJOPAY_BASE_URL || "https://engine.shurjopayment.com",
    username: (ps?.shurjopay_live_username as string | null) || process.env.SHURJOPAY_USERNAME || "",
    password: (ps?.shurjopay_live_password as string | null) || process.env.SHURJOPAY_PASSWORD || "",
    prefix: (ps?.shurjopay_live_prefix as string | null) || process.env.SHURJOPAY_PREFIX || "sp",
    sandbox: false,
  };
}

interface SpToken {
  token: string;
  store_id: number;
  execute_url: string;
  token_type: string;
}

async function getToken(cfg: SpConfig): Promise<SpToken> {
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
  config: SpConfig;
}

export async function makePayment(input: MakePaymentInput): Promise<{ checkoutUrl: string; spOrderId: string }> {
  const t = await getToken(input.config);
  const res = await fetch(`${input.config.base}/api/secret-pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t.token}` },
    body: JSON.stringify({
      token: t.token,
      store_id: t.store_id,
      prefix: input.config.prefix,
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

export async function verifyPayment(spOrderId: string, config: SpConfig): Promise<{ ok: boolean; raw: unknown }> {
  const t = await getToken(config);
  const res = await fetch(`${config.base}/api/verification`, {
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
