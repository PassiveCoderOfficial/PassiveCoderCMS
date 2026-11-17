"use client";

/**
 * Menu history (menus P1): every save of this menu, newest first, with who
 * saved it and when (in the dashboard's time zone), "Restore" per version and
 * a one-step "Undo last save". Restoring is itself a save, so it can be
 * undone too. The newest 50 versions are kept.
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { History, Loader2, RotateCcw, Undo2 } from "lucide-react";
import type { NavItem } from "@/types/cms";
import { useT } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/locales/en";
import { usePanelDates } from "@/components/providers/panel-time-zone";
import type { MenuVersionView } from "@/app/api/navigation/history/route";

const SOURCE_KEY: Record<string, TranslationKey> = {
  dashboard: "navPage.historySrcDashboard",
  mcp: "navPage.historySrcMcp",
  restore: "navPage.historySrcRestore",
  undo: "navPage.historySrcUndo",
  import: "navPage.historySrcImport",
  before: "navPage.historySrcBefore",
  app: "navPage.historySrcApp",
};

export type RestoredMenu = { id: string; name: string; items: NavItem[]; location: string; slug: string; updated_at: string };

export function MenuHistoryPanel({ menuId, rev, dirty, onRestored }: {
  menuId: string;
  /** Bumped after every save, to reload the list. */
  rev: number;
  /** The menu has unsaved edits: restoring drops them, so ask first. */
  dirty: boolean;
  onRestored: (menu: RestoredMenu) => void;
}) {
  const t = useT();
  const dates = usePanelDates();
  const [versions, setVersions] = useState<MenuVersionView[] | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch(`/api/navigation/history?menuId=${encodeURIComponent(menuId)}`)
      .then((r) => r.json())
      .then((d: { enabled?: boolean; versions?: MenuVersionView[] }) => {
        if (!alive) return;
        setEnabled(d.enabled !== false);
        setVersions(d.versions ?? []);
      })
      .catch(() => { if (alive) setVersions([]); });
    return () => { alive = false; };
  }, [menuId, rev, reload]);

  async function restore(body: { versionId?: string; undo?: boolean }, key: string) {
    if (dirty && !window.confirm(t("navPage.historyDropEdits"))) return;
    setBusy(key);
    try {
      const res = await fetch("/api/navigation/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuId, ...body }),
      });
      const data = await res.json() as { error?: string; menu?: RestoredMenu };
      if (!res.ok || !data.menu) throw new Error(data.error ?? t("navPage.historyRestoreFailed"));
      onRestored(data.menu);
      toast.success(body.undo ? t("navPage.historyUndone") : t("navPage.historyRestored"));
      setReload((n) => n + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("navPage.historyRestoreFailed"));
    } finally {
      setBusy(null);
    }
  }

  // The newest version is what the site shows now (after a save); anything older can be put back.
  const canUndo = enabled && (versions?.length ?? 0) > 1;
  return (
    <section className="space-y-2 rounded-xl border bg-card p-4" aria-label={t("navPage.history")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-sm font-semibold">
          <History className="h-4 w-4 text-muted-foreground" />
          {t("navPage.history")}
          {versions && versions.length > 0 && <span className="text-xs font-normal text-muted-foreground">({versions.length})</span>}
        </button>
        <button type="button" disabled={!canUndo || !!busy} onClick={() => void restore({ undo: true }, "undo")}
          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium hover:border-primary disabled:opacity-40">
          {busy === "undo" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Undo2 className="h-3 w-3" />}
          {t("navPage.undoLastSave")}
        </button>
      </div>
      {!enabled ? (
        <p className="text-[11px] text-muted-foreground">{t("navPage.historyOff")}</p>
      ) : open && (
        versions === null ? (
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />{t("navPage.autoLoading")}</p>
        ) : versions.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">{t("navPage.historyEmpty")}</p>
        ) : (
          <ol className="max-h-80 space-y-1.5 overflow-y-auto">
            {versions.map((v, i) => (
              <li key={v.id} className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">{dates.dateTime(v.created_at)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {[v.saved_by_name, t(SOURCE_KEY[v.source] ?? "navPage.historySrcDashboard"), t("navPage.itemsCount", { count: v.item_count, plural: v.item_count === 1 ? "" : "s" })].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {i === 0 ? (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">{t("navPage.historyCurrent")}</span>
                ) : (
                  <button type="button" disabled={!!busy} onClick={() => void restore({ versionId: v.id }, v.id)}
                    className="inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-medium hover:border-primary disabled:opacity-40">
                    {busy === v.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                    {t("navPage.historyRestore")}
                  </button>
                )}
              </li>
            ))}
          </ol>
        )
      )}
      {enabled && <p className="text-[10px] text-muted-foreground">{t("navPage.historyHint")}</p>}
    </section>
  );
}
