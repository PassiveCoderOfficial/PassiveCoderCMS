import { createClient } from "@/lib/supabase/server";
import { CurrencyConfig, DEFAULT_CURRENCY, formatMoney } from "./currencies";

export type { CurrencyConfig };
export { formatMoney };

/** Fetch the site-wide base currency (server-side). Read by ecommerce + accounting. */
export async function getSiteCurrency(tenantId?: string | null): Promise<CurrencyConfig> {
  const supabase = await createClient();
  let q = supabase.from("site_settings").select("currency, currency_symbol, currency_position");
  if (tenantId) q = q.eq("tenant_id", tenantId);
  const { data } = await q.maybeSingle();
  if (!data) return DEFAULT_CURRENCY;
  return {
    currency: data.currency ?? DEFAULT_CURRENCY.currency,
    currency_symbol: data.currency_symbol ?? DEFAULT_CURRENCY.currency_symbol,
    currency_position: (data.currency_position as "before" | "after") ?? DEFAULT_CURRENCY.currency_position,
  };
}
