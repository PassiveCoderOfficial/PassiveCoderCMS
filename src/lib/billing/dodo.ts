import DodoPayments from "dodopayments";

type DodoEnv = "live_mode" | "test_mode";

export function getDodoClient(sandbox?: boolean): DodoPayments {
  // SDK v2.40.x environment is "live_mode" | "test_mode". Accept legacy
  // DODO_ENVIRONMENT="sandbox_mode" and translate it to "test_mode".
  const raw = process.env.DODO_ENVIRONMENT ?? "live_mode";
  const envMode: DodoEnv = raw === "test_mode" || raw === "sandbox_mode" ? "test_mode" : "live_mode";
  const environment: DodoEnv = sandbox === true ? "test_mode" : sandbox === false ? "live_mode" : envMode;
  return new DodoPayments({
    bearerToken: process.env.DODO_API_KEY!,
    environment,
  });
}

// Default export — env-driven (used for webhooks and places where DB mode isn't available)
export const dodo = getDodoClient();

const PRODUCT_MAP: Record<string, string | undefined> = {
  basic_yearly:   process.env.DODO_PRODUCT_BASIC_YEARLY,
  pro_yearly:     process.env.DODO_PRODUCT_PRO_YEARLY,
  basic_monthly:  process.env.DODO_PRODUCT_BASIC_MONTHLY,
  pro_monthly:    process.env.DODO_PRODUCT_PRO_MONTHLY,
};

export function getDodoProductId(planId: string, cycle: "monthly" | "yearly"): string | null {
  return PRODUCT_MAP[`${planId}_${cycle}`] ?? null;
}
