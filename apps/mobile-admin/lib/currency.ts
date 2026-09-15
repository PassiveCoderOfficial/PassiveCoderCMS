// Real tenant currency for money display — was missing entirely (every
// screen hardcoded USD via Intl.NumberFormat), a real bug for any BDT/other-
// currency tenant. Mirrors the shape of the web's use-site-currency.ts, kept
// much smaller since this app only needs a formatter, not currency_position/
// symbol overrides (site_settings.currency alone is enough for Intl to do
// the right thing for any real ISO currency code).

import { supabase } from "./supabase";

const cache = new Map<string, string>();

export async function getTenantCurrency(tenantId: string): Promise<string> {
  if (cache.has(tenantId)) return cache.get(tenantId)!;
  const { data } = await supabase.from("site_settings").select("currency").eq("tenant_id", tenantId).maybeSingle();
  const currency = data?.currency || "USD";
  cache.set(tenantId, currency);
  return currency;
}

export function formatMoney(n: number, currency: string): string {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n); }
  catch { return `${currency} ${n.toFixed(2)}`; }
}
