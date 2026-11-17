import type { Currency } from "./common";

/**
 * GET /api/plans (public). Pricing v2: one-time development price (includes
 * 12 months of platform), then a yearly renewal; Care plans monthly/yearly.
 *
 * Display rule: USD everywhere; BDT (taka) only for Bangladesh (a BD site,
 * Bangla UI or a BD visitor). Never show taka next to dollars.
 */
export interface PlanPriceV2 {
  /** One-time development price. USD in dollars (not cents), BDT in taka. */
  development: Record<Currency, number>;
  /** Yearly platform renewal after the first year. */
  renewal_yearly: Record<Currency, number>;
  /** Extra page beyond pages_built. */
  extra_page: Record<Currency, number>;
}

export interface PlanDto {
  id: string;
  name: string;
  /** @deprecated Legacy monthly/yearly SaaS prices (dollars). Use `pricing`. */
  price_yearly: number;
  /** @deprecated Use `pricing`. */
  price_monthly: number;
  /** @deprecated Use `pricing`. */
  price_yearly_bdt: number | null;
  /** @deprecated Use `pricing`. */
  price_monthly_bdt: number | null;
  storage_gb: number;
  pages_limit: number;
  visitor_limit_monthly: number;
  overage_cents_per_1k: number;
  features: string[];
  /** Raw v2 columns (USD in cents). Prefer `pricing`. */
  dev_price_usd_cents: number | null;
  dev_price_bdt: number | null;
  renewal_yearly_usd_cents: number | null;
  renewal_yearly_bdt: number | null;
  pages_built: number | null;
  extra_page_usd_cents: number | null;
  extra_page_bdt: number | null;
  free_care_plan_id: string | null;
  free_care_months: number;
  free_care_name: string | null;
  /** v2 prices ready to show; null on plans not sold as a package (custom). */
  pricing: PlanPriceV2 | null;
}

export interface CarePlanDto {
  id: string;
  name: string;
  monthly_usd_cents: number;
  yearly_usd_cents: number;
  monthly_bdt: number;
  yearly_bdt: number;
  changes_per_month: number | null;
  pages_per_month: number;
  response_hours: number;
  features: string[];
  sort_order: number;
}

export interface PlansResponse {
  plans: PlanDto[];
  care: CarePlanDto[];
  /** Pricing model of `pricing` fields; "v2" = one-time development + yearly renewal. */
  pricing_model: "v2";
}
