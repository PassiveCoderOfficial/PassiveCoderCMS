import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { PropertiesManager } from "@/components/admin/real-estate/managers";
import { SampleDataButton } from "@/components/admin/real-estate/sample-data-button";

export const metadata = { title: "Properties — Dashboard" };

export default async function PropertiesPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();
  const [{ data: rows }, { data: communities }, { data: developers }, { data: settings }] = await Promise.all([
    supabase.from("re_properties").select("*, community:re_communities(name, slug), developer:re_developers(name, slug, logo_url)").eq("tenant_id", tid).order("sort_order").order("created_at", { ascending: false }),
    supabase.from("re_communities").select("id, name").eq("tenant_id", tid).order("sort_order"),
    supabase.from("re_developers").select("id, name").eq("tenant_id", tid).order("sort_order"),
    supabase.from("re_settings").select("default_currency, default_area_unit").eq("tenant_id", tid).maybeSingle(),
  ]);

  return (
    <div className="space-y-4">
      {!rows?.length && <SampleDataButton />}
      <PropertiesManager
        initial={rows ?? []}
        communities={communities ?? []}
        developers={developers ?? []}
        defaults={{ currency: settings?.default_currency ?? "SAR", unit: settings?.default_area_unit ?? "sqm" }}
      />
    </div>
  );
}
