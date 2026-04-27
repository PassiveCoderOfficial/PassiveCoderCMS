import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { runBackup } from "@/lib/backup/runner";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminClient = await createAdminClient();
  const { data: sa } = await adminClient.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!sa) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { tenantId, backup } = await req.json();
  if (!tenantId) return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });

  // Verify tenant exists
  const { data: tenant } = await adminClient.from("tenants").select("id,name,slug").eq("id", tenantId).single();
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  let backupPath: string | null = null;

  if (backup) {
    try {
      const result = await runBackup(tenantId);
      backupPath = result.path;
    } catch (e) {
      return NextResponse.json({ error: `Backup failed: ${e instanceof Error ? e.message : "unknown"}` }, { status: 500 });
    }
  }

  // Delete tenant data in dependency order
  const tables = [
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

  for (const table of tables) {
    await adminClient.from(table as never).delete().eq("tenant_id", tenantId);
  }

  // Delete the tenant itself
  await adminClient.from("tenants").delete().eq("id", tenantId);

  return NextResponse.json({ ok: true, backupPath });
}
