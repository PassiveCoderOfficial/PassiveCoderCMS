import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { SettingsClient } from "./settings-client";

export const metadata = { title: "Agent Settings — Dashboard" };

export default async function ReSettingsPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();
  const { data } = await supabase.from("re_settings").select("*").eq("tenant_id", tid).maybeSingle();
  return <SettingsClient initial={data ?? {}} />;
}
