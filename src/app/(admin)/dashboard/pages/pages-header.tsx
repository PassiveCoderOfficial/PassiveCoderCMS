"use client";

// The list page itself (page.tsx) is a server component — it queries
// Supabase directly for the page rows. useT() needs the client-side
// LanguageProvider (localStorage-persisted, no server-readable signal), so
// the translatable header/empty-state text is split out into this small
// client wrapper instead of converting the whole data-fetching page to a
// client component. Same split used wherever a server-fetched list needs
// translated chrome.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { useT } from "@/lib/i18n/language-provider";

export function PagesHeader({ count }: { count: number }) {
  const t = useT();
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h1 className="text-2xl font-bold">{t("pages.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("pages.count", { count })}</p>
      </div>
      <Button asChild>
        <Link href="/dashboard/pages/new"><Plus className="h-4 w-4 mr-2" /> {t("pages.newPage")}</Link>
      </Button>
    </div>
  );
}

export function PagesEmptyState({ inTrash }: { inTrash: boolean }) {
  const t = useT();
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="font-semibold text-lg mb-2">{inTrash ? t("pages.trashEmpty") : t("pages.noPagesYet")}</h3>
      {!inTrash && (
        <>
          <p className="text-muted-foreground text-sm mb-4">{t("pages.createFirstPage")}</p>
          <Button asChild><Link href="/dashboard/pages/new"><Plus className="h-4 w-4 mr-2" /> {t("pages.createPage")}</Link></Button>
        </>
      )}
    </div>
  );
}

export function PagesTableHead() {
  const t = useT();
  return (
    <tr className="border-b text-xs text-muted-foreground">
      <th className="px-4 py-3 text-left font-medium">{t("pages.colTitle")}</th>
      <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">{t("pages.colSlug")}</th>
      <th className="px-4 py-3 text-left font-medium hidden md:table-cell">{t("pages.colStatus")}</th>
      <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">{t("pages.colUpdated")}</th>
      <th className="px-4 py-3 text-right font-medium">{t("pages.colActions")}</th>
    </tr>
  );
}
