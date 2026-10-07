import { createAdminClient } from "@/lib/supabase/server";

/** Fields a shopper may see. Everything else in a gateway's settings (API keys) stays server-side. */
const PUBLIC_KEYS: Record<string, string[]> = {
  bank_transfer: ["bank_name", "account_title", "account_number", "iban", "swift", "branch", "instructions"],
  manual: ["instructions", "account_details"],
  cod: ["note"],
};

export const BANK_FIELDS: { key: string; label: string; multiline?: boolean }[] = [
  { key: "bank_name", label: "Bank name" },
  { key: "account_title", label: "Account title" },
  { key: "account_number", label: "Account number" },
  { key: "iban", label: "IBAN" },
  { key: "swift", label: "SWIFT / BIC" },
  { key: "branch", label: "Branch" },
  { key: "instructions", label: "Instructions for the customer", multiline: true },
];

export type StorePaymentMethod = { slug: string; name: string; settings: Record<string, string> };

/**
 * Payment methods one store offers at checkout. Stores that have set up their
 * own methods (tenant_payment_methods) get exactly those, in their order, with
 * their own settings. Stores that never did keep the old behaviour: every
 * platform gateway that is switched on, except bank transfer (it needs the
 * store's own account details). Either way a gateway must accept the store
 * currency, falling back to the full list rather than an empty checkout.
 */
export async function getStorePaymentMethods(tenantId: string | null, currency: string): Promise<StorePaymentMethod[]> {
  const admin = await createAdminClient();
  const [{ data: gateways }, { data: rows }] = await Promise.all([
    admin.from("payment_gateways").select("slug, name, settings, supported_currencies").eq("is_enabled", true),
    tenantId
      ? admin.from("tenant_payment_methods").select("gateway_slug, enabled, settings, sort_order").eq("tenant_id", tenantId).order("sort_order")
      : Promise.resolve({ data: [] as { gateway_slug: string; enabled: boolean; settings: Record<string, string>; sort_order: number }[] }),
  ]);
  const all = gateways ?? [];
  const own = rows ?? [];
  let list: { slug: string; name: string; settings: Record<string, string>; supported_currencies: string[] | null }[];
  if (own.length) {
    list = own.filter((r) => r.enabled).flatMap((r) => {
      const g = all.find((x) => x.slug === r.gateway_slug);
      return g ? [{ ...g, settings: (r.settings ?? {}) as Record<string, string> }] : [];
    });
  } else {
    list = all.filter((g) => g.slug !== "bank_transfer").map((g) => ({ ...g, settings: (g.settings ?? {}) as Record<string, string> }));
  }
  const usable = list.filter((g) => !g.supported_currencies?.length || g.supported_currencies.includes(currency));
  const chosen = usable.length ? usable : list;
  return chosen.map((g) => {
    const keys = PUBLIC_KEYS[g.slug] ?? [];
    const settings: Record<string, string> = {};
    for (const k of keys) if (g.settings?.[k]) settings[k] = String(g.settings[k]);
    return { slug: g.slug, name: g.name, settings };
  });
}
