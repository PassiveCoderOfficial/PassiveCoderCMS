import DodoPayments from "dodopayments";

type DodoEnv = "live_mode" | "test_mode";

export interface DodoConfig {
  apiKey: string;
  webhookSecret?: string;
  sandbox: boolean;
  productBasicYearly?: string | null;
  productProYearly?: string | null;
  productBasicMonthly?: string | null;
  productProMonthly?: string | null;
}

export function getDodoClient(config?: { apiKey?: string; sandbox?: boolean }): DodoPayments {
  // SDK v2.40.x uses "live_mode" | "test_mode". Accept legacy "sandbox_mode" from env.
  const raw = process.env.DODO_ENVIRONMENT ?? "live_mode";
  const envMode: DodoEnv = raw === "test_mode" || raw === "sandbox_mode" ? "test_mode" : "live_mode";
  const environment: DodoEnv = config?.sandbox === true ? "test_mode" : config?.sandbox === false ? "live_mode" : envMode;
  const bearerToken = config?.apiKey || process.env.DODO_API_KEY!;
  return new DodoPayments({ bearerToken, environment });
}

// Default export — env-driven (used for webhooks where DB isn't available)
export const dodo = getDodoClient();

/** Build a DodoConfig from platform_settings DB row, falling back to env vars. */
export function resolveDodoConfig(ps: Record<string, unknown> | null): DodoConfig {
  const sandbox = (ps?.dodo_mode ?? "live") === "sandbox";
  const apiKey = sandbox
    ? (ps?.dodo_sandbox_api_key as string | null) || process.env.DODO_API_KEY!
    : (ps?.dodo_live_api_key as string | null) || process.env.DODO_API_KEY!;
  const webhookSecret = sandbox
    ? (ps?.dodo_sandbox_webhook_secret as string | null) ?? process.env.DODO_WEBHOOK_SECRET
    : (ps?.dodo_live_webhook_secret as string | null) ?? process.env.DODO_WEBHOOK_SECRET;
  return {
    apiKey,
    webhookSecret: webhookSecret ?? undefined,
    sandbox,
    productBasicYearly: sandbox
      ? (ps?.dodo_sandbox_product_basic_yearly as string | null) ?? process.env.DODO_PRODUCT_BASIC_YEARLY
      : (ps?.dodo_live_product_basic_yearly as string | null) ?? process.env.DODO_PRODUCT_BASIC_YEARLY,
    productProYearly: sandbox
      ? (ps?.dodo_sandbox_product_pro_yearly as string | null) ?? process.env.DODO_PRODUCT_PRO_YEARLY
      : (ps?.dodo_live_product_pro_yearly as string | null) ?? process.env.DODO_PRODUCT_PRO_YEARLY,
    productBasicMonthly: sandbox
      ? (ps?.dodo_sandbox_product_basic_monthly as string | null) ?? process.env.DODO_PRODUCT_BASIC_MONTHLY
      : (ps?.dodo_live_product_basic_monthly as string | null) ?? process.env.DODO_PRODUCT_BASIC_MONTHLY,
    productProMonthly: sandbox
      ? (ps?.dodo_sandbox_product_pro_monthly as string | null) ?? process.env.DODO_PRODUCT_PRO_MONTHLY
      : (ps?.dodo_live_product_pro_monthly as string | null) ?? process.env.DODO_PRODUCT_PRO_MONTHLY,
  };
}

export function getDodoProductId(
  config: Pick<DodoConfig, "productBasicYearly" | "productProYearly" | "productBasicMonthly" | "productProMonthly">,
  planId: string,
  cycle: "monthly" | "yearly",
): string | null {
  const map: Record<string, string | null | undefined> = {
    basic_yearly:   config.productBasicYearly,
    pro_yearly:     config.productProYearly,
    basic_monthly:  config.productBasicMonthly,
    pro_monthly:    config.productProMonthly,
  };
  return map[`${planId}_${cycle}`] ?? null;
}
