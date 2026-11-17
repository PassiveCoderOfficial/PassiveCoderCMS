"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/language-provider";

interface Theme {
  id: string;
  name: string;
  is_active: boolean;
}

export function ThemeActions({ theme }: { theme: Theme }) {
  const t = useT();
  const router = useRouter();

  const handleActivate = async () => {
    const supabase = createClient();
    await supabase.from("themes").update({ is_active: false }).neq("id", theme.id);
    const { error } = await supabase.from("themes").update({ is_active: true }).eq("id", theme.id);
    if (error) { toast.error(t("themes.failedToActivate")); return; }
    toast.success(t("themes.activatedName", { name: theme.name }));
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm(t("themes.deleteThemeConfirm"))) return;
    const supabase = createClient();
    await supabase.from("themes").delete().eq("id", theme.id);
    toast.success(t("themes.themeDeleted"));
    router.refresh();
  };

  return (
    <div className="flex gap-2 w-full">
      {!theme.is_active && (
        <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleActivate}>{t("themes.activate")}</Button>
      )}
      {theme.is_active && (
        <span className="flex-1 text-xs text-center text-green-600 font-medium py-1">{t("themes.activeCheck")}</span>
      )}
      {!theme.is_active && (
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleDelete}>{t("themes.remove")}</Button>
      )}
    </div>
  );
}
