import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { MediaManager } from "./media-manager";
import { CHAT_PHOTO_FOLDER } from "@/lib/site-chat/intake-rules";

export default async function MediaPage() {
  const tenantId = await getCurrentTenantId();
  // Anon client → RLS scopes media to the current tenant's membership.
  const supabase = await createClient();
  const { data: media } = await supabase
    .from("media")
    .select("*")
    .eq("tenant_id", tenantId)
    // Visitors' job photos belong to their chat, not the site's library.
    .or(`folder.is.null,folder.neq.${CHAT_PHOTO_FOLDER}`)
    .order("created_at", { ascending: false });

  return <MediaManager initialMedia={media ?? []} />;
}
