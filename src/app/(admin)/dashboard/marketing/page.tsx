import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import MarketingClient from "./marketing-client";

export const metadata = { title: "Marketing — Dashboard" };

export default async function MarketingPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();

  const [{ data: campaigns }, { count: audienceCount }, { data: stages }] = await Promise.all([
    supabase.from("campaigns").select("*")
      .eq("tenant_id", tid).order("created_at", { ascending: false }).limit(100),
    supabase.from("contacts").select("id", { count: "exact", head: true })
      .eq("tenant_id", tid).eq("consent_email", true).not("email", "is", null),
    supabase.from("crm_stages").select("id, name").eq("tenant_id", tid).order("position"),
  ]);

  return (
    <MarketingClient
      initialCampaigns={campaigns ?? []}
      audienceCount={audienceCount ?? 0}
      stages={stages ?? []}
    />
  );
}
