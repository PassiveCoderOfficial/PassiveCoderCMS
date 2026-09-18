"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/locales/en";

const TABS: { key: string; labelKey: TranslationKey }[] = [
  { key: "all", labelKey: "pages.tabAll" },
  { key: "published", labelKey: "pages.statusPublished" },
  { key: "draft", labelKey: "pages.statusDraft" },
  { key: "scheduled", labelKey: "pages.statusScheduled" },
  { key: "trash", labelKey: "pages.tabTrash" },
];

// Shared filter-tab strip (build once, reuse everywhere) — used by both
// /dashboard/pages and /dashboard/posts, and any future post-type list.
export function StatusTabs({ basePath, active }: { basePath: string; active: string }) {
  const t = useT();
  return (
    <div className="flex items-center gap-1 mb-4 border-b overflow-x-auto">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.key === "all" ? basePath : `${basePath}?status=${tab.key}`}
          className={cn(
            "px-3 py-2 text-sm border-b-2 -mb-px whitespace-nowrap transition-colors",
            active === tab.key
              ? "border-primary text-foreground font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t(tab.labelKey)}
        </Link>
      ))}
    </div>
  );
}
