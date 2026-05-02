import { getCurrentTenantId } from "@/lib/tenant/current";
import { createAdminClient } from "@/lib/supabase/server";
import SettingsForm from "./settings-form";

export default async function GeneralSettingsPage() {
  const tenantId = await getCurrentTenantId();
  const supabase = await createAdminClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("*")
    .eq("tenant_id", tenantId)
    .single();

  if (!settings) return <div className="p-6 text-sm text-muted-foreground">No settings found</div>;

  return <SettingsForm initialSettings={settings} />;
