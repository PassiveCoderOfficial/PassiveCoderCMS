// Money + FX helpers for subscription billing.
// Base currency is USD (stored as integer cents). BDT payments are converted
// to USD at the platform usd_to_bdt_rate and applied against the USD balance.

export type PayCurrency = "USD" | "BDT";

/** Format an amount in minor units for its currency. USD = cents, BDT = whole taka. */
export function formatMoneyMinor(amountMinor: number, currency: PayCurrency): string {
  if (currency === "BDT") return `৳${Math.round(amountMinor).toLocaleString("en-BD")}`;
  return `$${(amountMinor / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Convenience: format USD cents. */
export function formatUsd(cents: number): string {
  return formatMoneyMinor(cents, "USD");
}

/** Whole BDT taka → USD cents, using usd_to_bdt_rate (1 USD = rate BDT). */
export function bdtToUsdCents(bdtWhole: number, rate: number): number {
  if (!rate || rate <= 0) rate = 125;
  return Math.round((bdtWhole / rate) * 100);
}

/** USD cents → whole BDT taka. */
export function usdCentsToBdt(cents: number, rate: number): number {
  if (!rate || rate <= 0) rate = 125;
  return Math.round((cents / 100) * rate);
}

/**
 * Convert a payment entered in `currency` to (a) the USD cents applied to the
 * balance and (b) the original minor-unit amount stored on the receipt.
 * `origAmount` is in major units of the paid currency (dollars or taka).
 */
export function resolvePayment(
  origAmount: number,
  currency: PayCurrency,
  rate: number,
): { amountCents: number; origAmountMinor: number; fxRate: number | null } {
  if (currency === "BDT") {
    const origAmountMinor = Math.round(origAmount); // taka has no subunit in practice
    return { amountCents: bdtToUsdCents(origAmountMinor, rate), origAmountMinor, fxRate: rate };
  }
  const cents = Math.round(origAmount * 100);
  return { amountCents: cents, origAmountMinor: cents, fxRate: null };
}

/** Contractual USD total for a subscription, after discount. */
export function subscriptionBilledCents(sub: {
  amount_cents?: number | null;
  custom_amount_cents?: number | null;
  discount_pct?: number | null;
}): number {
  const base = sub.custom_amount_cents ?? sub.amount_cents ?? 0;
  const disc = sub.discount_pct ? Number(sub.discount_pct) : 0;
  return Math.round(base * (1 - disc / 100));
}

/** Receipt line: "৳20,000 (≈ $160.00)" for BDT, "$160.00" for USD. */
export function receiptAmountLabel(p: {
  amount_cents: number;
  currency: PayCurrency;
  orig_amount_minor: number;
}): string {
  if (p.currency === "BDT") {
    return `${formatMoneyMinor(p.orig_amount_minor, "BDT")} (≈ ${formatUsd(p.amount_cents)})`;
  }
  return formatUsd(p.amount_cents);
}
