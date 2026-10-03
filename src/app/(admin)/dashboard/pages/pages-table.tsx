"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n/language-provider";
import { PageRow, type PageRowData } from "./page-row";
import { PagesTableHead } from "./pages-header";
import { bulkDeletePermanently, bulkMoveToTrash, bulkRestore, bulkUpdateStatus } from "./content-status";

/** Search + sort controls; state lives in the URL so the server list filters. */
export function PagesToolbar() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  const push = (next: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) { if (v) sp.set(k, v); else sp.delete(k); }
    router.push(`${pathname}${sp.toString() ? `?${sp}` : ""}`);
  };

  // Debounced search
  useEffect(() => {
    const cur = params.get("q") ?? "";
    if (q === cur) return;
    const id = setTimeout(() => push({ q: q.trim() || null }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("pages.searchPlaceholder")} className="pl-9" />
      </div>
      <select
        value={params.get("sort") ?? "updated"}
        onChange={(e) => push({ sort: e.target.value === "updated" ? null : e.target.value })}
        className="h-9 rounded-md border bg-background px-3 text-sm"
      >
        <option value="updated">{t("pages.sortUpdated")}</option>
        <option value="title">{t("pages.sortTitle")}</option>
      </select>
    </div>
  );
}

/**
 * Pages table with row selection and bulk actions (publish / unpublish /
 * trash, or restore / delete forever in Trash).
 */
export function PagesTable({ pages, inTrash, siteBase }: { pages: PageRowData[]; inTrash: boolean; siteBase: string }) {
  const t = useT();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => { setSelected(new Set()); }, [pages]);

  const allChecked = pages.length > 0 && selected.size === pages.length;
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  async function run(kind: "publish" | "draft" | "trash" | "restore" | "delete") {
    const ids = [...selected];
    if (!ids.length) return;
    if (kind === "trash" && !confirm(t("pages.confirmBulkTrash", { count: ids.length }))) return;
    if (kind === "delete" && !confirm(t("pages.confirmBulkDelete", { count: ids.length }))) return;
    setBusy(true);
    const { error } =
      kind === "publish" ? await bulkUpdateStatus(ids, "published")
      : kind === "draft" ? await bulkUpdateStatus(ids, "draft")
      : kind === "trash" ? await bulkMoveToTrash(ids)
      : kind === "restore" ? await bulkRestore(ids)
      : await bulkDeletePermanently(ids);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("pages.bulkDone", { count: ids.length }));
    setSelected(new Set());
    router.refresh();
  }

  return (
    <>
      {selected.size > 0 && (
        <div className="sticky top-0 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm">
          <span className="text-sm font-medium mr-2">{t("pages.selectedCount", { count: selected.size })}</span>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {inTrash ? (
            <>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => run("restore")}>{t("pages.bulkRestore")}</Button>
              <Button size="sm" variant="destructive" disabled={busy} onClick={() => run("delete")}>{t("pages.bulkDelete")}</Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => run("publish")}>{t("pages.bulkPublish")}</Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => run("draft")}>{t("pages.bulkDraft")}</Button>
              <Button size="sm" variant="outline" className="text-destructive" disabled={busy} onClick={() => run("trash")}>{t("pages.bulkTrash")}</Button>
            </>
          )}
        </div>
      )}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full min-w-[300px]">
            <thead>
              <PagesTableHead
                selectAll={<input type="checkbox" aria-label="Select all" checked={allChecked} onChange={() => setSelected(allChecked ? new Set() : new Set(pages.map((p) => p.id)))} />}
              />
            </thead>
            <tbody className="divide-y">
              {pages.map((page) => (
                <PageRow
                  key={page.id}
                  page={page}
                  inTrash={inTrash}
                  siteBase={siteBase}
                  selected={selected.has(page.id)}
                  onSelect={() => toggle(page.id)}
                />
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}
