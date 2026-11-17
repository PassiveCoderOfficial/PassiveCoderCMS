"use client";

/**
 * Before / after for "Switch to Studio" (menus P5): the classic header or
 * footer (as stored, menus filled in) next to the Studio draft it becomes,
 * on desktop and phone, plus the list of differences. Used by the owner's
 * Switch dialog and the staff batch review. Display only: it never saves.
 *
 * Each side renders in its own frame (true viewport, so md:/lg: rules fire
 * for the preview width), scaled down to fit.
 */
import React, { useEffect, useRef, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/locales/en";
import { PreviewFrame } from "@/components/admin/page-builder/canvas/preview-frame";
import { BlockRenderer } from "@/components/admin/page-builder/canvas/block-renderer";
import { SiteContactProvider } from "@/components/site/site-contact-context";
import { CartProvider } from "@/lib/cart/cart-context";
import { StudioHeader } from "@/components/site/header-studio/studio-header";
import { StudioFooter } from "@/components/site/footer-studio/studio-footer";
import type { HeaderConfig } from "@/modules/header-studio/model";
import type { FooterConfig } from "@/modules/footer-studio/model";
import type { SwitchAreaPayload, SwitchPayload } from "@/lib/site/studio-switch-payload";

const k = (key: string) => key as TranslationKey;
const FRAME = { desktop: 1280, mobile: 390 } as const;

function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/** A frame `frameWidth` wide (its own viewport), scaled to fit `width`. */
function Scaled({ width, frameWidth, minHeight, children }: { width: number; frameWidth: number; minHeight: number; children: React.ReactNode }) {
  const [h, setH] = useState(minHeight);
  const scale = Math.min(1, width / frameWidth);
  return (
    <div className="overflow-hidden rounded-md border bg-background" style={{ width: frameWidth * scale, height: Math.max(h, minHeight) * scale }}>
      <div style={{ width: frameWidth, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <PreviewFrame width={frameWidth} autoHeight onHeight={setH}>
          <div style={{ minHeight }}>{children}</div>
        </PreviewFrame>
      </div>
    </div>
  );
}

export function SwitchCompare({ payload, area }: { payload: SwitchPayload; area: "header" | "footer" }) {
  const t = useT();
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [ref, width] = useWidth<HTMLDivElement>();
  const a: SwitchAreaPayload = payload[area];
  // Side by side on wide screens, stacked on narrow ones.
  const sideBySide = width >= 720;
  const colWidth = sideBySide ? Math.floor((width - 16) / 2) : width;
  const frameWidth = FRAME[device];
  const minHeight = area === "header" ? (device === "mobile" ? 120 : 110) : 200;

  const before = (
    <SiteContactProvider value={payload.contact}>
      <CartProvider>
        {a.classic.filter((b) => b.visible !== false).map((b) => <BlockRenderer key={b.id} block={b} isPreview />)}
      </CartProvider>
    </SiteContactProvider>
  );
  const after = a.config ? (
    <SiteContactProvider value={payload.contact}>
      <CartProvider>
        {area === "header"
          ? <StudioHeader config={a.config as HeaderConfig} menus={payload.menus} logoUrl={payload.logoUrl} logoDarkUrl={payload.logoDarkUrl} siteName={payload.siteName} preview={device} previewPath="/" />
          : <StudioFooter config={a.config as FooterConfig} menus={payload.menus} logoUrl={payload.logoUrl} logoDarkUrl={payload.logoDarkUrl} siteName={payload.siteName} preview={device} />}
      </CartProvider>
    </SiteContactProvider>
  ) : null;

  return (
    <div className="space-y-3">
      {/* The site's own colours for both frames (scoped to the frames' body class). */}
      <style key={payload.tenantId}>{payload.themeCss}</style>
      <div className="flex items-center justify-between gap-2">
        <div role="group" aria-label={t("studioSwitch.device")} className="inline-flex rounded-md border p-0.5">
          {(["desktop", "mobile"] as const).map((d) => {
            const Icon = d === "desktop" ? Monitor : Smartphone;
            return (
              <button key={d} type="button" aria-pressed={device === d} onClick={() => setDevice(d)}
                className={cn("inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs", device === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                <Icon className="h-3.5 w-3.5" aria-hidden />{t(k(`studioSwitch.device.${d}`))}
              </button>
            );
          })}
        </div>
        <LevelBadge level={a.level} />
      </div>
      <div ref={ref} className={cn("gap-4", sideBySide ? "grid grid-cols-2" : "flex flex-col")}>
        {width > 0 && (
          <>
            <figure className="min-w-0 space-y-1.5">
              <figcaption className="text-xs font-medium text-muted-foreground">{t("studioSwitch.before")}</figcaption>
              {a.classic.length
                ? <Scaled key={`b-${device}`} width={colWidth} frameWidth={frameWidth} minHeight={minHeight}>{before}</Scaled>
                : <p className="rounded-md border border-dashed p-4 text-xs text-muted-foreground">{t("studioSwitch.noClassic")}</p>}
            </figure>
            <figure className="min-w-0 space-y-1.5">
              <figcaption className="text-xs font-medium text-muted-foreground">{t(a.stored ? "studioSwitch.afterDraft" : "studioSwitch.after")}</figcaption>
              {after
                ? <Scaled key={`a-${device}`} width={colWidth} frameWidth={frameWidth} minHeight={minHeight}>{after}</Scaled>
                : <p className="rounded-md border border-dashed p-4 text-xs text-muted-foreground">{t("studioSwitch.cannotConvert")}</p>}
            </figure>
          </>
        )}
      </div>
      <SwitchDifferences area={a} />
    </div>
  );
}

export function LevelBadge({ level }: { level: SwitchAreaPayload["level"] }) {
  const t = useT();
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
      level === "exact" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
        : level === "minor" ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
          : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200")}>
      {t(k(`studioSwitch.level.${level}`))}
    </span>
  );
}

/** The converter's notes (translated) and any content differences the check found (site data, as is). */
export function SwitchDifferences({ area }: { area: Pick<SwitchAreaPayload, "notes" | "diffs" | "level"> }) {
  const t = useT();
  if (!area.notes.length && !area.diffs.length) {
    return <p className="text-xs text-emerald-700 dark:text-emerald-300">{t("studioSwitch.noDifferences")}</p>;
  }
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium">{t(area.level === "unsupported" ? "studioSwitch.whyNot" : "studioSwitch.differences")}</p>
      <ul className="list-disc space-y-0.5 ps-5 text-xs text-muted-foreground">
        {area.notes.map((n, i) => <li key={`n${i}`}>{t(k(`studioSwitch.note.${n.code}`))}{n.detail ? ` (${n.detail})` : ""}</li>)}
        {area.diffs.map((d, i) => <li key={`d${i}`} className="text-amber-800 dark:text-amber-300">{d}</li>)}
      </ul>
    </div>
  );
}
