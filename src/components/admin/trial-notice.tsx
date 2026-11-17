"use client";

import { Info } from "lucide-react";
import { useT } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/locales/en";
import { useTrialSite } from "./trial-site-context";
import { cn } from "@/lib/utils";

/** A short note shown only in the dashboard of a site that is still on the free trial. */
export function TrialNotice({ message, className }: { message: TranslationKey; className?: string }) {
  const t = useT();
  if (!useTrialSite()) return null;
  return (
    <div role="note" className={cn("flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 p-2.5 text-xs text-amber-900 dark:bg-amber-950/20 dark:text-amber-200", className)}>
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{t(message)}</span>
    </div>
  );
}
