/**
 * Pricing model v2: one-time development, yearly platform, monthly/yearly
 * Care. One source of truth for every price shown or charged — the public
 * pricing section, the Care page, the BD landing page and /api/billing/checkout
 * all go through quote(). Numbers live in the DB (plans + care_plans,
 * migration 137); this file only does the arithmetic.
 *
 * Rules (docs/business/claude-app-notes.md, "Pricing — DRAFT v2"):
 * - Development includes 12 months of platform + free Care months.
 * - Platform renews yearly only. Care is monthly or yearly; yearly = 8x monthly.
 * - Care includes the platform. A site is online while either is paid.
 * - Bundle = development + 1 year of Care paid together, 10% off the Care part
 *   beyond the free months.
 */

export type Currency = "USD" | "BDT";
export type CareCycle = "monthly" | "yearly";
export type QuoteKind = "development" | "care" | "bundle" | "platform";

export interface DevPackage {
  id: string;
  name: string;
  dev_price_usd_cents: number;
  dev_price_bdt: number;
  renewal_yearly_usd_cents: number;
  renewal_yearly_bdt: number;
  pages_built: number;
  storage_gb: number;
  extra_page_usd_cents: number;
  extra_page_bdt: number;
  free_care_plan_id: string | null;
  free_care_months: number;
  features: string[];
  sort_order: number;
}

export interface CarePlan {
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

export const DEV_COLUMNS =
  "id, name, dev_price_usd_cents, dev_price_bdt, renewal_yearly_usd_cents, renewal_yearly_bdt, pages_built, storage_gb, extra_page_usd_cents, extra_page_bdt, free_care_plan_id, free_care_months, features, sort_order";
export const CARE_COLUMNS =
  "id, name, monthly_usd_cents, yearly_usd_cents, monthly_bdt, yearly_bdt, changes_per_month, pages_per_month, response_hours, features, sort_order";

export const BUNDLE_CARE_DISCOUNT = 0.1;

/** Smallest unit for the currency: USD cents, BDT whole taka. */
export type Amount = { currency: Currency; value: number };

export function devPrice(p: DevPackage, c: Currency): number {
  return c === "USD" ? p.dev_price_usd_cents : p.dev_price_bdt;
}
export function renewalPrice(p: DevPackage, c: Currency): number {
  return c === "USD" ? p.renewal_yearly_usd_cents : p.renewal_yearly_bdt;
}
export function carePrice(cp: CarePlan, cycle: CareCycle, c: Currency): number {
  if (c === "USD") return cycle === "monthly" ? cp.monthly_usd_cents : cp.yearly_usd_cents;
  return cycle === "monthly" ? cp.monthly_bdt : cp.yearly_bdt;
}

export interface QuoteLine { label: string; value: number }
export interface Quote {
  kind: QuoteKind;
  currency: Currency;
  total: number;
  lines: QuoteLine[];
  /** What the payment grants, applied by lib/billing/activate on success. */
  grants: {
    planId?: string;
    developmentPaid?: boolean;
    platformMonths?: number;
    carePlanId?: string;
    careCycle?: CareCycle;
    careMonths?: number;
    careIsFree?: boolean;
  };
}

/**
 * Price one checkout. Throws on an impossible combination so a bad request
 * can never be charged a wrong amount.
 */
export function quote(args: {
  kind: QuoteKind;
  currency: Currency;
  pkg?: DevPackage | null;
  care?: CarePlan | null;
  careCycle?: CareCycle;
}): Quote {
  const { kind, currency: c, pkg, care } = args;
  const careCycle: CareCycle = args.careCycle === "monthly" ? "monthly" : "yearly";

  if (kind === "development") {
    if (!pkg) throw new Error("Package required");
    const v = devPrice(pkg, c);
    return {
      kind, currency: c, total: v,
      lines: [{ label: `${pkg.name} website development (includes 12 months platform)`, value: v }],
      grants: {
        planId: pkg.id, developmentPaid: true, platformMonths: 12,
        ...(pkg.free_care_plan_id && pkg.free_care_months > 0
          ? { carePlanId: pkg.free_care_plan_id, careMonths: pkg.free_care_months, careIsFree: true, careCycle: "monthly" as const }
          : {}),
      },
    };
  }

  if (kind === "platform") {
    if (!pkg) throw new Error("Package required");
    const v = renewalPrice(pkg, c);
    return {
      kind, currency: c, total: v,
      lines: [{ label: `${pkg.name} platform renewal (12 months)`, value: v }],
      grants: { planId: pkg.id, platformMonths: 12 },
    };
  }

  if (kind === "care") {
    if (!care) throw new Error("Care plan required");
    const v = carePrice(care, careCycle, c);
    return {
      kind, currency: c, total: v,
      lines: [{ label: `${care.name} (${careCycle === "monthly" ? "1 month" : "12 months"}, includes platform)`, value: v }],
      grants: { carePlanId: care.id, careCycle, careMonths: careCycle === "monthly" ? 1 : 12 },
    };
  }

  // bundle: development + Care for the rest of year 1, one payment
  if (!pkg || !care) throw new Error("Package and Care plan required");
  const dev = devPrice(pkg, c);
  const freeMonths = pkg.free_care_plan_id === care.id ? pkg.free_care_months : 0;
  const paidMonths = Math.max(0, 12 - freeMonths);
  const monthly = carePrice(care, "monthly", c);
  const careFull = monthly * paidMonths;
  const discount = Math.round(careFull * BUNDLE_CARE_DISCOUNT);
  const lines: QuoteLine[] = [
    { label: `${pkg.name} website development (includes 12 months platform)`, value: dev },
    { label: `${care.name}, ${paidMonths} months${freeMonths ? ` (+${freeMonths} free)` : ""}`, value: careFull },
  ];
  if (discount > 0) lines.push({ label: "Bundle discount (10% off Care)", value: -discount });
  return {
    kind, currency: c, total: dev + careFull - discount, lines,
    grants: { planId: pkg.id, developmentPaid: true, platformMonths: 12, carePlanId: care.id, careCycle: "yearly", careMonths: 12 },
  };
}

/** Display: USD cents -> "$299", BDT taka -> "৳১২,০০০" (Bangla digits) or "৳12,000". */
export function formatAmount(value: number, c: Currency, opts: { banglaDigits?: boolean } = {}): string {
  if (c === "USD") {
    const d = value / 100;
    return `$${d.toLocaleString("en-US", { minimumFractionDigits: d % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
  }
  const s = value.toLocaleString("en-IN");
  return `৳${opts.banglaDigits ? toBanglaDigits(s) : s}`;
}

export function toBanglaDigits(s: string): string {
  return s.replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
}

/** Months -> period end, from a start date (default now). */
export function addMonths(from: Date, months: number): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}
