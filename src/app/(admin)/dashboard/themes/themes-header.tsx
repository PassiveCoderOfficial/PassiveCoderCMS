"use client";

// page.tsx (Themes/Templates) is a server component (queries Supabase
// directly) — same client/server split as pages/pages-header.tsx.

import { useT } from "@/lib/i18n/language-provider";

export function ThemesHeader({ activeTemplateName }: { activeTemplateName: string | null }) {
  const t = useT();
  return (
    <div>
      <h1 className="text-2xl font-bold">{t("themes.title")}</h1>
      <p className="text-muted-foreground text-sm mt-1">
        {activeTemplateName
          ? t("themes.activeTemplate", { name: activeTemplateName })
          : t("themes.noActiveTemplate")}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {t("themes.switchHint")}
      </p>
    </div>
  );
}

export function ActiveTemplateBadge() {
  const t = useT();
  return <span className="text-green-400 text-sm font-semibold">{t("themes.activeTemplateBadge")}</span>;
}
