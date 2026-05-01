import { createAdminClient } from "@/lib/supabase/server";
import { Settings } from "lucide-react";
import SASettingsClient from "./settings-client";

export const metadata = { title: "Settings — Super Admin" };

export default async function SettingsPage() {
  const supabase = await createAdminClient();
  const { data: settings } = await supabase.from("platform_settings").select("*").eq("id", 1).single();

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Settings className="w-6 h-6 text-gray-400" /> Platform Settings
      </h1>
      <SASettingsClient settings={settings} />
    </div>
  );
}
