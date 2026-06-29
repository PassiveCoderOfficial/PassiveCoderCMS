import DodoPayments from "dodopayments";

export const dodo = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY!,
  environment: "live_mode",
});

const PRODUCT_MAP: Record<string, string | undefined> = {
  basic_yearly:   process.env.DODO_PRODUCT_BASIC_YEARLY,
  pro_yearly:     process.env.DODO_PRODUCT_PRO_YEARLY,
  basic_monthly:  process.env.DODO_PRODUCT_BASIC_MONTHLY,
  pro_monthly:    process.env.DODO_PRODUCT_PRO_MONTHLY,
};

export function getDodoProductId(planId: string, cycle: "monthly" | "yearly"): string | null {
  return PRODUCT_MAP[`${planId}_${cycle}`] ?? null;
}
