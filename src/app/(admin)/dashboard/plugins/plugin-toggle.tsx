"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function PluginToggle({ pluginId, isActive, pluginName }: { pluginId: string; isActive: boolean; pluginName: string }) {
  const [active, setActive] = useState(isActive);
  const router = useRouter();

  const handleToggle = async (checked: boolean) => {
    setActive(checked);
    const supabase = createClient();
    const { error } = await supabase.from("plugins").update({ is_active: checked }).eq("id", pluginId);
    if (error) { setActive(!checked); toast.error("Failed to update"); return; }
    toast.success(checked ? `${pluginName} activated` : `${pluginName} deactivated`);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm("Remove this plugin?")) return;
    const supabase = createClient();
    await supabase.from("plugins").delete().eq("id", pluginId);
    toast.success("Plugin removed");
    router.refresh();
  };

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <Switch checked={active} onCheckedChange={handleToggle} />
        <span className="text-xs text-muted-foreground">{active ? "Active" : "Inactive"}</span>
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDelete}>
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
      </Button>
    </div>
  );
}
