"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { BuiltInTheme } from "@/modules/themes/built-in-themes";
import { useT } from "@/lib/i18n/language-provider";

export function InstallThemeButton({ theme }: { theme: BuiltInTheme }) {
  const t = useT();
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
    if (error) { toast.error(t("themes.failedToInstall")); setLoading(false); return; }
    toast.success(t("themes.installedName", { name: theme.name }));
    setLoading(false);
    router.refresh();
  };

  return (
    <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={handleInstall} disabled={loading}>
      {loading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
      {t("themes.install")}
    </Button>
  );
}
