import type { SupabaseClient } from "@supabase/supabase-js";
import { runBackup } from "@/lib/backup/runner";

/**
 * Delete a site and its data, in dependency order. Shared by Super Admin >
 * Delete site and the trial job (unpaid trials 7 days after they ended).
 * `backup: true` keeps a backup first and aborts the delete if it fails.
 */
const TABLES = [
  "support_tickets", "service_items", "service_groups",
  "feature_items", "feature_groups", "portfolio_items",
  "testimonials", "slider_slides", "sliders",
  "pricing_plans", "pricing_tables",
  "bookings", "contacts",
  "order_items", "orders", "products", "product_categories",
  "delivery_options", "transactions", "accounts",
  "backup_runs", "media", "site_settings", "pages",
  "subscriptions", "tenant_members",
];

export async function deleteSite(admin: SupabaseClient, tenantId: string, opts: { backup?: boolean } = {}): Promise<{ backupPath: string | null }> {
  let backupPath: string | null = null;
  if (opts.backup) backupPath = (await runBackup(tenantId)).path;
  for (const table of TABLES) {
    await admin.from(table as never).delete().eq("tenant_id", tenantId);
  }
  await admin.from("tenants").delete().eq("id", tenantId);
  return { backupPath };
}
