"use client";

/**
 * "Switch to the new header (Studio)" (menus P5): the owner's button, in the
 * Header Builder, the classic header settings and the Navigation screen (and
 * the footer version in the footer builder).
 *
 * Opens a dialog with the before/after (desktop and phone) and the list of
 * differences. "Create the Studio draft" converts the classic header into a
 * Studio DRAFT: nothing changes on the live site until the owner presses
 * Publish in the Studio. The classic header stays stored as it is, so
 * "Switch back" is always one click.
 */
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRightLeft, Loader2, Sparkles, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useT } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/locales/en";
import { cn } from "@/lib/utils";
import type { SwitchPayload } from "@/lib/site/studio-switch-payload";
import dynamic from "next/dynamic";

// The before/after renders every block type: loaded only when the dialog opens.
const SwitchCompare = dynamic(() => import("./switch-compare").then((m) => m.SwitchCompare), { ssr: false });

const k = (key: string) => key as TranslationKey;
export const STUDIO_HREF = { header: "/dashboard/header-builder/studio", footer: "/dashboard/header-builder/footer-studio" } as const;

export function SwitchToStudioButton({ area, variant = "button", className, text, actionLabel }: {
  area: "header" | "footer";
  /** button: a normal button; inline: a small link-style button for settings panels; banner: a strip with text. */
  variant?: "button" | "inline" | "banner";
  className?: string;
  /** banner: own text and button label (the Studio's "converted draft" note). */
  text?: string;
  actionLabel?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const label = actionLabel ?? t(area === "header" ? "studioSwitch.buttonHeader" : "studioSwitch.buttonFooter");
  const trigger = variant === "banner" ? (
    <div className={cn("flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs", className)}>
      <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
      <p className="min-w-0 flex-1">{text ?? t(area === "header" ? "studioSwitch.bannerHeader" : "studioSwitch.bannerFooter")}</p>
      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setOpen(true)}>{label}</Button>
    </div>
  ) : variant === "inline" ? (
    <button type="button" onClick={() => setOpen(true)} className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline", className)}>
      <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden />{label}
    </button>
  ) : (
    <Button size="sm" variant="outline" className={cn("h-8 gap-1.5", className)} onClick={() => setOpen(true)}>
      <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden /><span className="truncate">{label}</span>
    </Button>
  );
  return (
    <>
      {trigger}
      {open && <SwitchDialog area={area} open={open} onOpenChange={setOpen} />}
    </>
  );
}

function SwitchDialog({ area, open, onOpenChange }: { area: "header" | "footer"; open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useT();
  const router = useRouter();
  const [payload, setPayload] = useState<SwitchPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [replace, setReplace] = useState(false);

  const load = useCallback(() => {
    setError(null);
    fetch("/api/studio-switch").then(async (r) => {
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || t("studioSwitch.loadFailed"));
      setPayload(j as SwitchPayload);
    }).catch((e) => setError(e instanceof Error ? e.message : t("studioSwitch.loadFailed")));
  }, [t]);
  // Load when the dialog opens (it mounts open).
  useEffect(() => { load(); }, [load]);

  const post = async (body: Record<string, unknown>, label: string) => {
    setBusy(label);
    try {
      const r = await fetch("/api/studio-switch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || t("studioSwitch.saveFailed"));
      return j as Record<string, unknown>;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("studioSwitch.saveFailed"));
      return null;
    } finally {
      setBusy(null);
    }
  };

  const a = payload?.[area];
  const prepare = async () => {
    const j = await post({ action: "prepare", areas: [area], replace }, "prepare");
    const res = j?.[area] as { prepared?: boolean; reason?: string } | undefined;
    if (!res) return;
    if (!res.prepared) { toast.error(t(k(`studioSwitch.reason.${res.reason ?? "cannot_convert"}`))); load(); return; }
    toast.success(t(area === "header" ? "studioSwitch.preparedHeader" : "studioSwitch.preparedFooter"));
    onOpenChange(false);
    router.push(STUDIO_HREF[area]);
  };
  const back = async () => {
    const j = await post({ action: "switch_back", area }, "back");
    if (!j) return;
    toast.success(t(j.result === "classic" ? "studioSwitch.backToClassic" : "studioSwitch.draftDiscarded"));
    load();
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(area === "header" ? "studioSwitch.titleHeader" : "studioSwitch.titleFooter")}</DialogTitle>
          <DialogDescription>{t(area === "header" ? "studioSwitch.introHeader" : "studioSwitch.introFooter")}</DialogDescription>
        </DialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {!payload && !error && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("studioSwitch.loading")}</p>}
        {payload && a && (
          <div className="space-y-4">
            <StateLine state={a.state} area={area} />
            {a.state !== "studio" && <SwitchCompare payload={payload} area={area} />}
            <div className="flex flex-wrap items-center gap-2 border-t pt-3">
              {a.state === "classic" && a.level !== "unsupported" && (
                <>
                  {a.ownDraft && (
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
                      {t("studioSwitch.replaceOwnDraft")}
                    </label>
                  )}
                  <Button size="sm" className="gap-1.5" disabled={!!busy || (a.ownDraft && !replace)} onClick={() => void prepare()}>
                    {busy === "prepare" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRightLeft className="h-3.5 w-3.5" />}
                    {t("studioSwitch.createDraft")}
                  </Button>
                </>
              )}
              {a.state === "draft" && (
                <>
                  <Button size="sm" asChild><Link href={STUDIO_HREF[area]}>{t("studioSwitch.openToPublish")}</Link></Button>
                  <Button size="sm" variant="ghost" className="gap-1.5" disabled={!!busy} onClick={() => void back()}>
                    {busy === "back" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" />}{t("studioSwitch.discardDraft")}
                  </Button>
                </>
              )}
              {a.state === "studio" && (
                <>
                  <Button size="sm" asChild><Link href={STUDIO_HREF[area]}>{t("studioSwitch.openStudio")}</Link></Button>
                  <Button size="sm" variant="outline" className="gap-1.5" disabled={!!busy} onClick={() => void back()}>
                    {busy === "back" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" />}
                    {t(area === "header" ? "studioSwitch.switchBackHeader" : "studioSwitch.switchBackFooter")}
                  </Button>
                </>
              )}
              <p className="ms-auto max-w-md text-[11px] text-muted-foreground">{t("studioSwitch.safeNote")}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StateLine({ state, area }: { state: "classic" | "draft" | "studio"; area: "header" | "footer" }) {
  const t = useT();
  return (
    <p className={cn("rounded-md px-3 py-2 text-xs", state === "studio" ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200" : state === "draft" ? "bg-primary/10" : "bg-muted")}>
      {t(k(`studioSwitch.state.${state}.${area}`))}
    </p>
  );
}
