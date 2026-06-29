import DodoPayments from "dodopayments";

export function getDodoClient(sandbox?: boolean): DodoPayments {
  const envMode = (process.env.DODO_ENVIRONMENT ?? "live_mode") as "live_mode" | "sandbox_mode";
  const environment = sandbox === true ? "sandbox_mode" : sandbox === false ? "live_mode" : envMode;
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
