import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import NavigationClient from "./navigation-client";
import type { NavMenuRow } from "./navigation-client";

export default async function NavigationPage() {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">No site selected.</p>
      </div>
    );
  }

  const admin = await createAdminClient();
  const { data: menus } = await admin
    .from("nav_menus")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("location", { ascending: true });

  return <NavigationClient initialMenus={(menus ?? []) as NavMenuRow[]} />;
}
