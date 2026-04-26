import { createAdminClient } from "@/lib/supabase/server";
import HomepageEditorClient from "./homepage-editor-client";

export const metadata = { title: "Homepage Editor — Super Admin" };

export default async function HomepageEditorPage() {
  const supabase = await createAdminClient();
  const { data } = await supabase.from("homepage_settings").select("*").single();
  return <HomepageEditorClient settings={data} />;
}
