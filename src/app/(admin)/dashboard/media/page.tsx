import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { MediaManager } from "./media-manager";

export default async function MediaPage() {
  const tenantId = await getCurrentTenantId();
  // Anon client → RLS scopes media to the current tenant's membership.
  const supabase = await createClient();
  const { data: media } = await supabase
    .from("media")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  return <MediaManager initialMedia={media ?? []} />;
}
