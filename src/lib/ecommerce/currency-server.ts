import { createClient } from "@/lib/supabase/server";

export interface CurrencyConfig {
  currency: string;
  currency_symbol: string;
  currency_position: "before" | "after";
}

const DEFAULT: CurrencyConfig = { currency: "USD", currency_symbol: "$", currency_position: "before" };

/** Fetch the tenant's ecommerce currency config (server-side). */
export async function getCurrencyConfig(tenantId?: string | null): Promise<CurrencyConfig> {
  const supabase = await createClient();
  let q = supabase.from("ecommerce_settings").select("currency, currency_symbol, currency_position");
  if (tenantId) q = q.eq("tenant_id", tenantId);
  const { data } = await q.maybeSingle();
  if (!data) return DEFAULT;
  return {
    currency: data.currency ?? "USD",
    currency_symbol: data.currency_symbol ?? "$",
    currency_position: (data.currency_position as "before" | "after") ?? "before",
  };
}

/** Format an amount using a currency config. */
export function formatWithConfig(amount: number, cfg: CurrencyConfig): string {
  const { currency, currency_symbol, currency_position } = cfg;
  try {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
    }).format(amount);
    // Replace 3-letter ISO fallback (e.g. "BDT") with stored symbol
    const withSymbol = formatted.replace(new RegExp(currency, "g"), currency_symbol);
    if (currency_position === "after") {
      const num = new Intl.NumberFormat("en-US").format(amount);
      return `${num}${currency_symbol}`;
    }
    return withSymbol;
  } catch {
    const num = new Intl.NumberFormat("en-US").format(amount);
    return currency_position === "after" ? `${num}${currency_symbol}` : `${currency_symbol}${num}`;
  }
}
