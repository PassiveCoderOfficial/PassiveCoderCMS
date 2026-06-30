"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientTenantId } from "@/lib/tenant/client";
import { CurrencyConfig, DEFAULT_CURRENCY, formatMoney } from "@/lib/currency/currencies";

// Module-level cache so all components share one fetch per page load.
let _cache: CurrencyConfig | null = null;
let _promise: Promise<CurrencyConfig> | null = null;

async function fetchSiteCurrency(): Promise<CurrencyConfig> {
  if (_cache) return _cache;
  if (_promise) return _promise;
  _promise = (async () => {
    const supabase = createClient();
    const tenantId = await getClientTenantId();
    let q = supabase.from("site_settings").select("currency, currency_symbol, currency_position");
    if (tenantId) q = q.eq("tenant_id", tenantId);
    const { data } = await q.maybeSingle();
    const result: CurrencyConfig = {
      currency: data?.currency ?? DEFAULT_CURRENCY.currency,
      currency_symbol: data?.currency_symbol ?? DEFAULT_CURRENCY.currency_symbol,
      currency_position: (data?.currency_position as "before" | "after") ?? DEFAULT_CURRENCY.currency_position,
    };
    _cache = result;
    return result;
  })();
  return _promise;
}

/** Site-wide base currency (read by ecommerce + accounting). */
export function useSiteCurrency() {
  const [settings, setSettings] = useState<CurrencyConfig>(_cache ?? DEFAULT_CURRENCY);

  useEffect(() => {
    if (_cache) { setSettings(_cache); return; }
    fetchSiteCurrency().then(setSettings);
  }, []);

  return {
    ...settings,
    format: (amount: number) => formatMoney(amount, settings),
  };
}
