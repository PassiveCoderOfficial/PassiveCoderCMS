"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { BuiltInPlugin } from "@/modules/plugins/built-in-plugins";

export function InstallPluginButton({ plugin }: { plugin: BuiltInPlugin }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleInstall = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("plugins").insert({
      name: plugin.name,
      slug: plugin.slug,
      description: plugin.description,
      author: plugin.author,
      version: plugin.version,
      is_active: false,
      settings: {},
    });
    if (error) { toast.error("Failed to install"); setLoading(false); return; }
    toast.success(`${plugin.name} installed`);
    setLoading(false);
    router.refresh();
  };

  return (
    <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={handleInstall} disabled={loading}>
      {loading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
      Install
    </Button>
  );
}
