"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle, Sparkles, Layout } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/language-provider";

interface Props {
  templateSlug: string;
  templateName: string;
  isActive: boolean;
  tenantId: string;
  /** Named explicitly in the confirm dialog below — the tenant id here can
   *  come from a stale cross-tab cookie (see getCurrentTenantId()'s staff
   *  fallback), so this is the one chance for whoever clicks Apply to catch
   *  that they're not on the site they think they are before it mutates. */
  siteName: string | null;
}

export function TemplateApplyButton({ templateSlug, templateName, isActive, tenantId, siteName }: Props) {
  const t = useT();
  const [applying, setApplying] = useState(false);
  const [mode, setMode] = useState<"theme" | "full">("theme");
  // Archiving is opt-in and never destructive — archived pages stay
  // recoverable, so a template apply can't silently lose a site's content.
  const [archiveExistingPages, setArchiveExistingPages] = useState(false);
  const router = useRouter();

  async function apply() {
    if (!tenantId) {
      toast.error(t("themes.noSiteFoundError"));
      return;
    }
    const target = siteName ? t("themes.onSite", { name: siteName }) : t("themes.onThisSite");
    const confirmMsg = mode === "full"
      ? t("themes.confirmFullMode", { name: templateName, target, archiveNote: archiveExistingPages ? t("themes.archiveNote") : "" })
      : t("themes.confirmThemeMode", { name: templateName, target });
    if (!confirm(confirmMsg)) return;

    setApplying(true);
    try {
      const res = await fetch("/api/templates/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, templateSlug, mode, archiveExistingPages: mode === "full" && archiveExistingPages }),
      });
      // Parsed defensively: a crashed or timed-out request can come back with
      // no body at all, and calling res.json() on that throws "Unexpected end
      // of JSON input" — which then gets shown to the user instead of the real
      // failure.
      const raw = await res.text();
      let data: { error?: string; pagesCreated?: number; pagesArchived?: number } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(
          res.ok
            ? t("themes.unreadableResponse")
            : t("themes.applyFailedStatus", { status: res.status, detail: raw.slice(0, 200) || t("themes.noReasonGiven") }),
        );
      }
      if (!res.ok) throw new Error(data.error ?? t("themes.applyFailed", { status: res.status }));
      const detail = data.pagesCreated
        ? t("themes.pagesAddedDetail", { count: data.pagesCreated, plural: data.pagesCreated === 1 ? "" : "s", archived: data.pagesArchived ? t("themes.pagesArchivedInline", { count: data.pagesArchived }) : "" })
        : "";
      toast.success(t("themes.appliedSuccess", { name: templateName, detail }));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("themes.failedToApply"));
    } finally {
      setApplying(false);
    }
  }

  if (isActive) {
    return (
      <div className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-green-600">
        <CheckCircle className="h-3.5 w-3.5" /> {t("themes.currentlyActive")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <div className="flex gap-1">
        <button
          onClick={() => setMode("theme")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1.5 rounded border transition-all",
            mode === "theme"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:border-primary/40",
          )}
        >
          <Layout className="w-2.5 h-2.5" /> {t("themes.themeOnly")}
        </button>
        <button
          onClick={() => setMode("full")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1.5 rounded border transition-all",
            mode === "full"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:border-primary/40",
          )}
        >
          <Sparkles className="w-2.5 h-2.5" /> {t("themes.fullDemo")}
        </button>
      </div>
      <p className="text-[9px] text-muted-foreground leading-tight">
        {mode === "theme"
          ? t("themes.themeModeHint")
          : t("themes.fullModeHint")}
      </p>
      {mode === "full" && (
        <label className="flex items-start gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={archiveExistingPages}
            onChange={(e) => setArchiveExistingPages(e.target.checked)}
            className="mt-0.5 h-3 w-3 shrink-0 cursor-pointer"
          />
          <span className="text-[9px] leading-tight text-muted-foreground">
            {t("themes.archivePagesHint")}
          </span>
        </label>
      )}
      {/* Apply button */}
      <button
        onClick={apply}
        disabled={applying}
        className="w-full py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all"
      >
        {applying ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
        {applying ? t("themes.applying") : t("themes.applyTemplate", { name: templateName })}
      </button>
    </div>
  );
}
