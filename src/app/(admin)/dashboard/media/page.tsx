import { createAdminClient } from "@/lib/supabase/server";
import { MediaManager } from "./media-manager";

export default async function MediaPage() {
  const supabase = await createAdminClient();
  const { data: media } = await supabase
    .from("media")
    .select("*")
    .order("created_at", { ascending: false });

  return <MediaManager initialMedia={media ?? []} />;
}
