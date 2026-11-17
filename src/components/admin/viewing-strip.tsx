"use client";

import { ArrowLeft, ShieldCheck, Zap } from "lucide-react";
import { useT } from "@/lib/i18n/language-provider";

/**
 * Slim strip for our team inside a client's dashboard: which site this is, and
 * one click back. Wears the Console's indigo in both modes, so it reads as "you
 * came from over there" against the dashboard's warm palette.
 */
export function ViewingStrip({ siteName, home }: { siteName: string; home: "super-admin" | "staff" }) {
  const t = useT();
  const sa = home === "super-admin";
  const Icon = sa ? ShieldCheck : Zap;
  return (
    <div className="flex h-8 shrink-0 items-center gap-2 bg-console-bar px-3 text-xs leading-4 text-console-bar-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0 text-console-bar-muted" />
      <span className="min-w-0 truncate font-medium">{t("viewing.site", { site: siteName })}</span>
      <a
        href={sa ? "/api/super-admin/impersonate/exit" : "/api/staff/sites/exit-view"}
        className="ml-auto flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-md bg-white/15 px-2 font-medium transition-colors hover:bg-white/25"
      >
        <ArrowLeft className="h-3 w-3" />
        {t(sa ? "viewing.backToSuperAdmin" : "viewing.backToStaffPortal")}
      </a>
    </div>
  );
}
