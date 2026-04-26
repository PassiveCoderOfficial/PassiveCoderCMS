"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { BuiltInTheme } from "@/modules/themes/built-in-themes";

export function InstallThemeButton({ theme }: { theme: BuiltInTheme }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleInstall = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("themes").insert({
      name: theme.name,
      slug: theme.slug,
      description: theme.description,
      author: theme.author,
      version: theme.version,
      thumbnail: theme.thumbnail,
      settings: theme.settings,
      is_active: false,
    });
    if (error) { toast.error("Failed to install theme"); setLoading(false); return; }
    toast.success(`${theme.name} installed`);
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
