import { SupabaseClient } from "@supabase/supabase-js";

const CONTENT_TABLES = [
  "posts",
  "pages",
  "media",
  "products",
  "product_categories",
  "orders",
  "customers",
  "forms",
  "form_submissions",
  "navigation_menus",
  "site_settings",
  "themes",
  "plugins",
  "invoices",
  "tax_rates",
];

export async function exportAllJson(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<Record<string, unknown[]>> {
  const result: Record<string, unknown[]> = {};

  await Promise.all(
    CONTENT_TABLES.map(async (table) => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("tenant_id", tenantId);
      if (!error && data) result[table] = data;
    }),
  );

  return result;
}

export function jsonToBuffer(data: unknown): Buffer {
  return Buffer.from(JSON.stringify(data, null, 2), "utf-8");
}
