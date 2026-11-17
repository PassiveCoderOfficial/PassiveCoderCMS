"use client";

/**
 * Header Studio editor (Header & Footer Studio phase 2, Nov 2026).
 *
 * Left: Presets / Layout / Phone / Behaviour / History. Right: the real site
 * header component (StudioHeader) in preview mode, at desktop, tablet or
 * phone width. Save draft keeps changes private; Publish makes the studio
 * header the site's header (and keeps the previous one in History). "Use the
 * classic header" switches back without losing anything.
 *
 * All editing operations are the tested pure functions in
 * modules/header-studio/model.ts; storage rules in doc.ts.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowUp, ArrowDown, Trash2, Settings2, Monitor, Tablet, Smartphone, Loader2,
  Save, Rocket, History, RotateCcw, Check, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import { useT } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/locales/en";
import type { NavItem } from "@/types/cms";
import { CartProvider } from "@/lib/cart/cart-context";
import { SiteContactProvider, type SiteContact } from "@/components/site/site-contact-context";
import { usePanelDates } from "@/components/providers/panel-time-zone";
import { StudioHeader, type PreviewDevice } from "@/components/site/header-studio/studio-header";
import {
  HEADER_ELEMENT_TYPES, MOBILE_BAR_TYPES, MAX_MOBILE_ICONS, MAX_ZONE_ELEMENTS, ROW_KEYS, ZONES,
  addElement, defaultConfig, findElement, makeElement, moveElement, removeElement, updateElement, transparentOn,
  type HeaderConfig, type HeaderElement, type HeaderElementType, type HeaderRowKey, type HeaderZone, type MobileBarType,
} from "@/modules/header-studio/model";
import { HEADER_PRESETS, buildPreset, type SiteFacts } from "@/modules/header-studio/presets";
import { hasUnpublishedChanges, resolveEditorHeader, type HeaderStudioDoc } from "@/modules/header-studio/doc";

export type StudioMenu = { id: string; name: string; location: string | null; items: NavItem[] };

type Tab = "presets" | "layout" | "phone" | "behaviour" | "history";
const TABS: Tab[] = ["presets", "layout", "phone", "behaviour", "history"];
const DEVICE_WIDTH: Record<PreviewDevice, number | null> = { desktop: null, tablet: 820, mobile: 390 };

const SELECT = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function k(key: string): TranslationKey {
  return key as TranslationKey;
}

export default function HeaderStudioClient({
  initialDoc, unavailable, menus, classicItems, pages, facts, contact, logoUrl, logoDarkUrl, siteName,
}: {
  initialDoc: HeaderStudioDoc;
  unavailable: boolean;
  menus: StudioMenu[];
  /** The classic header links: the menu when no saved menu is in the header. */
  classicItems: NavItem[] | null;
  pages: { path: string; title: string }[];
  facts: SiteFacts;
  contact: SiteContact | null;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  siteName: string;
}) {
  const t = useT();
  const [doc, setDoc] = useState<HeaderStudioDoc>(initialDoc);
  const [config, setConfig] = useState<HeaderConfig | null>(() => resolveEditorHeader(initialDoc));
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(resolveEditorHeader(initialDoc)));
  const [tab, setTab] = useState<Tab>(() => (resolveEditorHeader(initialDoc) ? "layout" : "presets"));
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pendingPreset, setPendingPreset] = useState<string | null>(null);

  const dirty = JSON.stringify(config) !== savedJson;
  const live = doc.enabled && !!doc.published;

  // Menus for the preview, keyed the way the site keys them ("" = default header menu).
  const previewMenus = useMemo(() => {
    const out: Record<string, NavItem[]> = {};
    // Same order as the site: header menu, classic header links, any menu.
    out[""] = menus.find((m) => m.location === "header")?.items ?? classicItems ?? menus[0]?.items ?? [];
    for (const m of menus) out[m.id] = m.items;
    return out;
  }, [menus, classicItems]);

  const call = useCallback(async (action: string, extra: Record<string, unknown> = {}, label = action) => {
    setBusy(label);
    try {
      const res = await fetch("/api/header-studio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || t("headerStudio.saveFailed"));
      const next = json.doc as HeaderStudioDoc;
      setDoc(next);
      return next;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("headerStudio.saveFailed"));
      return null;
    } finally {
      setBusy(null);
    }
  }, [t]);

  const saveDraft = useCallback(async () => {
    if (!config) return;
    const next = await call("save_draft", { config }, "draft");
    if (next) { setSavedJson(JSON.stringify(next.draft)); setConfig(next.draft); toast.success(t("headerStudio.draftSaved")); }
  }, [call, config, t]);

  const publish = useCallback(async () => {
    if (!config) return;
    const next = await call("publish", { config }, "publish");
    if (next) { setSavedJson(JSON.stringify(next.published)); setConfig(next.published); toast.success(t("headerStudio.published")); }
  }, [call, config, t]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); void saveDraft(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveDraft]);

  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  function applyPreset(id: string) {
    const next = buildPreset(id, facts);
    if (!next) return;
    setConfig(next);
    setSelected(null);
    setPendingPreset(null);
    setTab("layout");
    toast.success(t("headerStudio.presetApplied"));
  }

  const status = unavailable
    ? { tone: "warn", text: t("headerStudio.statusUnavailable") }
    : live
      ? (hasUnpublishedChanges(doc) || dirty ? { tone: "info", text: t("headerStudio.statusLiveChanges") } : { tone: "ok", text: t("headerStudio.statusLive") })
      : doc.published
        ? { tone: "muted", text: t("headerStudio.statusClassicKept") }
        : { tone: "muted", text: t("headerStudio.statusClassic") };

  const width = DEVICE_WIDTH[device];
  const overlayHome = config ? transparentOn(config, "/") : false;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-background px-3 py-2 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild title={t("headerStudio.back")}>
          <Link href="/dashboard/header-builder" aria-label={t("headerStudio.back")}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold leading-tight">{t("headerStudio.title")}</h1>
          <p className={cn("text-[11px] leading-tight", status.tone === "ok" ? "text-emerald-600" : status.tone === "warn" ? "text-amber-600" : status.tone === "info" ? "text-primary" : "text-muted-foreground")}>
            {status.text}{dirty && ` · ${t("headerStudio.unsaved")}`}
          </p>
        </div>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          {live && (
            <Button size="sm" variant="ghost" className="h-8" disabled={!!busy || unavailable} onClick={() => void call("use_classic", {}, "classic").then((d) => d && toast.success(t("headerStudio.classicOn")))}>
              {t("headerStudio.useClassic")}
            </Button>
          )}
          {!live && doc.published && (
            <Button size="sm" variant="ghost" className="h-8" disabled={!!busy || unavailable} onClick={() => void call("use_studio", {}, "studio").then((d) => d && toast.success(t("headerStudio.studioOn")))}>
              {t("headerStudio.useStudio")}
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-8 gap-1.5" disabled={!config || !!busy || unavailable || !dirty} onClick={() => void saveDraft()}>
            {busy === "draft" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}{t("headerStudio.saveDraft")}
          </Button>
          <Button size="sm" className="h-8 gap-1.5" disabled={!config || !!busy || unavailable} onClick={() => void publish()}>
            {busy === "publish" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}{t("headerStudio.publish")}
          </Button>
        </div>
      </div>

      {unavailable && (
        <div className="flex items-start gap-2 border-b bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{t("headerStudio.unavailableHint")}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Panel */}
        <div className="flex w-full shrink-0 flex-col border-b lg:w-[400px] lg:border-b-0 lg:border-e min-h-0">
          <div role="tablist" aria-label={t("headerStudio.title")} className="flex shrink-0 gap-1 overflow-x-auto border-b px-2 py-1.5">
            {TABS.map((id) => (
              <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)}
                className={cn("rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap", tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                {t(k(`headerStudio.tab.${id}`))}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto p-3 max-h-[50vh] lg:max-h-none">
            {tab === "presets" && (
              <PresetGallery facts={facts} contact={contact} menus={previewMenus} logoUrl={logoUrl} logoDarkUrl={logoDarkUrl} siteName={siteName}
                current={config?.preset ?? null}
                onPick={(id) => (config ? setPendingPreset(id) : applyPreset(id))} />
            )}
            {tab !== "presets" && tab !== "history" && !config && (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <p>{t("headerStudio.pickPresetFirst")}</p>
                <Button size="sm" className="mt-3" onClick={() => setTab("presets")}>{t("headerStudio.tab.presets")}</Button>
                <Button size="sm" variant="ghost" className="mt-3 ms-2" onClick={() => setConfig(defaultConfig())}>{t("headerStudio.startBlank")}</Button>
              </div>
            )}
            {tab === "layout" && config && (
              <LayoutPanel config={config} onChange={setConfig} selected={selected} onSelect={setSelected} menus={menus} contact={contact} />
            )}
            {tab === "phone" && config && <PhonePanel config={config} onChange={setConfig} />}
            {tab === "behaviour" && config && <BehaviourPanel config={config} onChange={setConfig} pages={pages} />}
            {tab === "history" && (
              <HistoryPanel doc={doc} busy={!!busy || unavailable}
                onRestore={async (index, now) => {
                  const next = await call("restore", { index, publish: now }, "restore");
                  if (next) { const c = now ? next.published : next.draft; setConfig(c); setSavedJson(JSON.stringify(c)); toast.success(t(now ? "headerStudio.restoredLive" : "headerStudio.restoredDraft")); }
                }}
                onDiscard={async () => {
                  const next = await call("discard_draft", {}, "discard");
                  if (next) { setConfig(next.published); setSavedJson(JSON.stringify(next.published)); }
                }} />
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="flex min-h-0 flex-1 flex-col bg-muted/40">
          <div className="flex shrink-0 items-center justify-center gap-1 border-b bg-background px-3 py-1.5" role="group" aria-label={t("headerStudio.device")}>
            {(["desktop", "tablet", "mobile"] as PreviewDevice[]).map((d) => {
              const Icon = d === "desktop" ? Monitor : d === "tablet" ? Tablet : Smartphone;
              return (
                <button key={d} type="button" aria-pressed={device === d} onClick={() => setDevice(d)}
                  className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs", device === d ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>
                  <Icon className="h-3.5 w-3.5" />{t(k(`headerStudio.device.${d}`))}
                </button>
              );
            })}
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-4">
            {config ? (
              <div className="cms-canvas-light relative mx-auto overflow-hidden rounded-lg border bg-background text-foreground shadow-sm transition-[width]"
                style={{ width: width ? `${width}px` : "100%", maxWidth: "100%", minHeight: device === "desktop" ? 420 : 640 }}>
                <SiteContactProvider value={contact}>
                  <CartProvider>
                    <div className={cn(overlayHome && "absolute inset-x-0 top-0 z-10")}>
                      <StudioHeader config={config} menus={previewMenus} logoUrl={logoUrl} logoDarkUrl={logoDarkUrl} siteName={siteName} preview={device} previewPath="/" />
                    </div>
                  </CartProvider>
                </SiteContactProvider>
                <SampleHero dark={overlayHome} />
              </div>
            ) : (
              <div className="mx-auto mt-10 max-w-md text-center text-sm text-muted-foreground">{t("headerStudio.previewEmpty")}</div>
            )}
            <p className="mt-3 text-center text-[11px] text-muted-foreground">{t("headerStudio.previewNote")}</p>
          </div>
        </div>
      </div>

      <AlertDialog open={!!pendingPreset} onOpenChange={(o) => !o && setPendingPreset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("headerStudio.replaceTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("headerStudio.replaceBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("headerStudio.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingPreset && applyPreset(pendingPreset)}>{t("headerStudio.usePreset")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SampleHero({ dark }: { dark: boolean }) {
  const t = useT();
  return dark ? (
    <div className="flex h-[360px] items-end bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-8 text-white">
      <div><p className="text-2xl font-bold">{t("headerStudio.sampleHeroTitle")}</p><p className="mt-1 text-sm opacity-80">{t("headerStudio.sampleHeroText")}</p></div>
    </div>
  ) : (
    <div className="space-y-3 p-8" aria-hidden>
      <div className="h-6 w-1/2 rounded bg-muted" />
      <div className="h-3 w-3/4 rounded bg-muted" />
      <div className="h-3 w-2/3 rounded bg-muted" />
      <div className="mt-6 h-40 rounded-lg bg-muted/70" />
    </div>
  );
}

// ── Presets ─────────────────────────────────────────────────────────────

function PresetGallery({ facts, contact, menus, logoUrl, logoDarkUrl, siteName, current, onPick }: {
  facts: SiteFacts; contact: SiteContact | null; menus: Record<string, NavItem[]>;
  logoUrl: string | null; logoDarkUrl: string | null; siteName: string; current: string | null; onPick: (id: string) => void;
}) {
  const t = useT();
  const built = useMemo(() => HEADER_PRESETS.map((p) => ({ id: p.id, config: p.build(facts) })), [facts]);
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{t("headerStudio.presetsHint")}</p>
      {built.map(({ id, config }) => (
        // Not a <button>: the preview holds real links and buttons, and
        // interactive content inside a <button> is invalid HTML (the browser
        // re-parents it and React hydration fails).
        <div key={id} role="button" tabIndex={0} aria-pressed={current === id} onClick={() => onPick(id)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(id); } }}
          className={cn("group block w-full cursor-pointer overflow-hidden rounded-lg border text-start transition hover:border-primary hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", current === id && "border-primary ring-1 ring-primary")}>
          <div className="cms-canvas-light pointer-events-none relative h-[92px] overflow-hidden bg-background" aria-hidden inert>
            <div className={cn("origin-top-left", transparentOn(config, "/") && "bg-gradient-to-br from-slate-800 to-slate-900")} style={{ width: "1200px", transform: "scale(0.31)", height: "300px" }}>
              <SiteContactProvider value={contact}>
                <CartProvider>
                  <StudioHeader config={config} menus={menus} logoUrl={logoUrl} logoDarkUrl={logoDarkUrl} siteName={siteName} preview="desktop" previewPath="/" />
                </CartProvider>
              </SiteContactProvider>
            </div>
          </div>
          <div className="flex items-center gap-2 border-t px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t(k(`headerStudio.preset.${id}`))}</p>
              <p className="text-[11px] text-muted-foreground">{t(k(`headerStudio.preset.${id}Desc`))}</p>
            </div>
            {current === id && <Check className="h-4 w-4 text-primary" />}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Layout: rows, zones, elements ───────────────────────────────────────

function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="flex items-center justify-between gap-3 py-1 text-sm">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} aria-label={label} />
    </label>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

function LayoutPanel({ config, onChange, selected, onSelect, menus, contact }: {
  config: HeaderConfig; onChange: (c: HeaderConfig) => void; selected: string | null; onSelect: (id: string | null) => void;
  menus: StudioMenu[]; contact: SiteContact | null;
}) {
  const t = useT();
  const sel = selected ? findElement(config, selected) : null;
  const setRow = (key: HeaderRowKey, patch: Partial<HeaderConfig["rows"][HeaderRowKey]>) =>
    onChange({ ...config, rows: { ...config.rows, [key]: { ...config.rows[key], ...patch } } });
  return (
    <div className="space-y-4">
      <section className="space-y-2 rounded-lg border p-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("headerStudio.style")}</h2>
        <Field label={t("headerStudio.container")}>
          <select className={SELECT} value={config.style.container} onChange={(e) => onChange({ ...config, style: { ...config.style, container: e.target.value as HeaderConfig["style"]["container"] } })}>
            {(["full", "boxed", "floating"] as const).map((v) => <option key={v} value={v}>{t(k(`headerStudio.container.${v}`))}</option>)}
          </select>
        </Field>
        <Toggle label={t("headerStudio.shadow")} checked={config.style.shadow} onChange={(v) => onChange({ ...config, style: { ...config.style, shadow: v } })} />
        <Toggle label={t("headerStudio.uppercase")} checked={config.style.uppercase} onChange={(v) => onChange({ ...config, style: { ...config.style, uppercase: v } })} />
      </section>

      {ROW_KEYS.map((key) => {
        const row = config.rows[key];
        return (
          <section key={key} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">{t(k(`headerStudio.row.${key}`))}</h2>
              {key !== "main" && <Switch checked={row.enabled} onCheckedChange={(v) => setRow(key, { enabled: v })} aria-label={t(k(`headerStudio.row.${key}`))} />}
            </div>
            {row.enabled && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Field label={t("headerStudio.background")}>
                    <select className={SELECT} value={row.background} onChange={(e) => setRow(key, { background: e.target.value as typeof row.background })}>
                      {(["default", "muted", "primary", "dark", "transparent"] as const).map((v) => <option key={v} value={v}>{t(k(`headerStudio.bg.${v}`))}</option>)}
                    </select>
                  </Field>
                  <Field label={t("headerStudio.size")}>
                    <select className={SELECT} value={row.size} onChange={(e) => setRow(key, { size: e.target.value as typeof row.size })}>
                      {(["sm", "md", "lg"] as const).map((v) => <option key={v} value={v}>{t(k(`headerStudio.size.${v}`))}</option>)}
                    </select>
                  </Field>
                </div>
                <Toggle label={t("headerStudio.border")} checked={row.border} onChange={(v) => setRow(key, { border: v })} />
                <div className="grid grid-cols-3 gap-1.5">
                  {ZONES.map((zone) => (
                    <ZoneBox key={zone} config={config} row={key} zone={zone} selected={selected} onSelect={onSelect} onChange={onChange} />
                  ))}
                </div>
              </>
            )}
          </section>
        );
      })}

      {sel && (
        <ElementEditor key={sel.element.id} config={config} element={sel.element} onChange={onChange} onClose={() => onSelect(null)} menus={menus} contact={contact} />
      )}
    </div>
  );
}

function ZoneBox({ config, row, zone, selected, onSelect, onChange }: {
  config: HeaderConfig; row: HeaderRowKey; zone: HeaderZone; selected: string | null;
  onSelect: (id: string | null) => void; onChange: (c: HeaderConfig) => void;
}) {
  const t = useT();
  const list = config.rows[row].zones[zone];
  const full = list.length >= MAX_ZONE_ELEMENTS;
  return (
    <div className="min-w-0 rounded-md border border-dashed bg-muted/30 p-1.5">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t(k(`headerStudio.zone.${zone}`))}</p>
      <ul className="space-y-1">
        {list.map((e) => (
          <li key={e.id}>
            <button type="button" onClick={() => onSelect(selected === e.id ? null : e.id)} aria-pressed={selected === e.id}
              className={cn("flex w-full items-center gap-1 truncate rounded border bg-background px-1.5 py-1 text-start text-[11px]", selected === e.id && "border-primary text-primary")}>
              <Settings2 className="h-3 w-3 shrink-0 opacity-60" />
              <span className="truncate">{t(k(`headerStudio.el.${e.type}`))}{e.label && e.type !== "menu" ? `: ${e.label}` : ""}</span>
            </button>
          </li>
        ))}
      </ul>
      <select className="mt-1 h-7 w-full rounded border border-input bg-background px-1 text-[11px]" value="" disabled={full}
        aria-label={`${t("headerStudio.add")} (${t(k(`headerStudio.zone.${zone}`))})`}
        onChange={(ev) => {
          const type = ev.target.value as HeaderElementType;
          if (!type) return;
          const el = makeElement(type, defaultsFor(type));
          onChange(addElement(config, row, zone, el));
          onSelect(el.id);
        }}>
        <option value="">{full ? t("headerStudio.zoneFull") : `+ ${t("headerStudio.add")}`}</option>
        {HEADER_ELEMENT_TYPES.map((type) => <option key={type} value={type}>{t(k(`headerStudio.el.${type}`))}</option>)}
      </select>
    </div>
  );
}

function defaultsFor(type: HeaderElementType): Partial<HeaderElement> {
  switch (type) {
    case "button": return { label: "Contact us", url: "/contact", variant: "solid" };
    case "text": return { label: "Your announcement" };
    case "language": return { lang: "bn" };
    default: return {};
  }
}

function ElementEditor({ config, element: e, onChange, onClose, menus, contact }: {
  config: HeaderConfig; element: HeaderElement; onChange: (c: HeaderConfig) => void; onClose: () => void;
  menus: StudioMenu[]; contact: SiteContact | null;
}) {
  const t = useT();
  const set = (patch: Partial<HeaderElement>) => onChange(updateElement(config, e.id, patch));
  const at = findElement(config, e.id)!;
  const siteValue = e.type === "phone" ? contact?.phone : e.type === "whatsapp" ? contact?.whatsapp || contact?.phone : e.type === "email" ? contact?.email : null;
  return (
    <section className="space-y-3 rounded-lg border border-primary/40 bg-primary/[0.03] p-3" aria-label={t(k(`headerStudio.el.${e.type}`))}>
      <div className="flex items-center gap-1">
        <h2 className="flex-1 text-sm font-semibold">{t(k(`headerStudio.el.${e.type}`))}</h2>
        <Button size="icon" variant="ghost" className="h-7 w-7" title={t("headerStudio.moveUp")} aria-label={t("headerStudio.moveUp")} onClick={() => onChange(moveElement(config, e.id, -1))}><ArrowUp className="h-3.5 w-3.5" /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" title={t("headerStudio.moveDown")} aria-label={t("headerStudio.moveDown")} onClick={() => onChange(moveElement(config, e.id, 1))}><ArrowDown className="h-3.5 w-3.5" /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" title={t("headerStudio.remove")} aria-label={t("headerStudio.remove")} onClick={() => { onChange(removeElement(config, e.id)); onClose(); }}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
      <Field label={t("headerStudio.position")}>
        <select className={SELECT} value={`${at.row}:${at.zone}`} onChange={(ev) => {
          const [row, zone] = ev.target.value.split(":") as [HeaderRowKey, HeaderZone];
          onChange(moveElement(config, e.id, { row, zone }));
        }}>
          {ROW_KEYS.flatMap((r) => ZONES.map((z) => (
            <option key={`${r}:${z}`} value={`${r}:${z}`}>{t(k(`headerStudio.row.${r}`))} / {t(k(`headerStudio.zone.${z}`))}</option>
          )))}
        </select>
      </Field>

      {e.type === "logo" && (
        <>
          <Field label={t("headerStudio.logoImage")} hint={t("headerStudio.logoImageHint")}>
            <MediaPickerInput value={e.imageUrl ?? ""} onChange={(v) => set({ imageUrl: v || undefined })} compact />
          </Field>
          <Field label={t("headerStudio.logoHeight")}>
            <Input type="number" min={16} max={120} value={e.height ?? 36} onChange={(ev) => set({ height: Number(ev.target.value) || undefined })} />
          </Field>
          <Toggle label={t("headerStudio.showName")} checked={!!e.showName} onChange={(v) => set({ showName: v })} />
        </>
      )}
      {e.type === "menu" && (
        <>
          <Field label={t("headerStudio.menu")} hint={menus.length ? undefined : t("headerStudio.noMenus")}>
            <select className={SELECT} value={e.menuId ?? ""} onChange={(ev) => set({ menuId: ev.target.value || undefined })}>
              <option value="">{t("headerStudio.menuDefault")}</option>
              {menus.map((m) => <option key={m.id} value={m.id}>{m.name}{m.location ? ` (${m.location})` : ""}</option>)}
            </select>
          </Field>
          <Field label={t("headerStudio.menuPart")}>
            <select className={SELECT} value={e.menuPart ?? ""} onChange={(ev) => set({ menuPart: (ev.target.value || undefined) as HeaderElement["menuPart"] })}>
              <option value="">{t("headerStudio.menuPartAll")}</option>
              <option value="first">{t("headerStudio.menuPartFirst")}</option>
              <option value="second">{t("headerStudio.menuPartSecond")}</option>
            </select>
          </Field>
          <Link href="/dashboard/navigation" className="text-xs text-primary underline-offset-4 hover:underline">{t("headerStudio.editMenus")}</Link>
        </>
      )}
      {(e.type === "button" || e.type === "booking" || e.type === "text" || e.type === "account" || e.type === "search") && (
        <Field label={e.type === "search" ? t("headerStudio.placeholder") : t("headerStudio.label")}>
          <Input value={e.label ?? ""} placeholder={e.type === "booking" ? "Book now" : e.type === "account" ? "My account" : e.type === "search" ? "Search" : ""} onChange={(ev) => set({ label: ev.target.value })} />
        </Field>
      )}
      {(e.type === "button" || e.type === "text") && (
        <>
          <Field label={t("headerStudio.link")}>
            <Input value={e.url ?? ""} placeholder="/contact" onChange={(ev) => set({ url: ev.target.value })} />
          </Field>
          {e.type === "button" && <Toggle label={t("headerStudio.newTab")} checked={!!e.newTab} onChange={(v) => set({ newTab: v })} />}
        </>
      )}
      {(e.type === "button" || e.type === "booking") && (
        <Field label={t("headerStudio.variant")}>
          <select className={SELECT} value={e.variant ?? "solid"} onChange={(ev) => set({ variant: ev.target.value as HeaderElement["variant"] })}>
            {(["solid", "outline", "gradient", "ghost"] as const).map((v) => <option key={v} value={v}>{t(k(`headerStudio.variant.${v}`))}</option>)}
          </select>
        </Field>
      )}
      {(e.type === "phone" || e.type === "whatsapp" || e.type === "email") && (
        <Field label={t("headerStudio.value")} hint={siteValue ? t("headerStudio.valueFromSite", { value: siteValue }) : t("headerStudio.valueMissing")}>
          <Input value={e.value ?? ""} placeholder={siteValue ?? ""} onChange={(ev) => set({ value: ev.target.value })} />
        </Field>
      )}
      {(e.type === "phone" || e.type === "whatsapp" || e.type === "email" || e.type === "cart" || e.type === "account") && (
        <Toggle label={t("headerStudio.showLabel")} checked={!!e.showLabel} onChange={(v) => set({ showLabel: v })} />
      )}
      {e.type === "search" && (
        <Field label={t("headerStudio.searchStyle")}>
          <select className={SELECT} value={e.searchStyle ?? "icon"} onChange={(ev) => set({ searchStyle: ev.target.value as HeaderElement["searchStyle"] })}>
            <option value="icon">{t("headerStudio.searchIcon")}</option>
            <option value="box">{t("headerStudio.searchBox")}</option>
          </select>
        </Field>
      )}
      {e.type === "language" && (
        <div className="grid grid-cols-2 gap-2">
          <Field label={t("headerStudio.langCode")}>
            <Input value={e.lang ?? ""} placeholder="bn" maxLength={8} onChange={(ev) => set({ lang: ev.target.value.trim().toLowerCase() })} />
          </Field>
          <Field label={t("headerStudio.langMode")}>
            <select className={SELECT} value={e.langMode ?? "google"} onChange={(ev) => set({ langMode: ev.target.value as HeaderElement["langMode"] })}>
              <option value="google">{t("headerStudio.langGoogle")}</option>
              <option value="native">{t("headerStudio.langNative")}</option>
            </select>
          </Field>
        </div>
      )}
      {e.type === "socials" && <p className="text-xs text-muted-foreground">{t("headerStudio.socialsHint")}</p>}
      {e.type === "booking" && <p className="text-xs text-muted-foreground">{t("headerStudio.bookingHint")}</p>}
      {e.type !== "logo" && (
        <Field label={t("headerStudio.showOn")}>
          <select className={SELECT} value={e.hideOn ?? ""} onChange={(ev) => set({ hideOn: (ev.target.value || undefined) as HeaderElement["hideOn"] })}>
            <option value="">{t("headerStudio.showOnAll")}</option>
            <option value="mobile">{t("headerStudio.showOnDesktop")}</option>
            <option value="desktop">{t("headerStudio.showOnPhone")}</option>
          </select>
        </Field>
      )}
    </section>
  );
}

// ── Phone ───────────────────────────────────────────────────────────────

function PhonePanel({ config, onChange }: { config: HeaderConfig; onChange: (c: HeaderConfig) => void }) {
  const t = useT();
  const m = config.mobile;
  const set = (patch: Partial<HeaderConfig["mobile"]>) => onChange({ ...config, mobile: { ...m, ...patch } });
  const toggleIcon = (type: MobileBarType, on: boolean) => {
    const icons = on ? [...m.icons, type].slice(0, MAX_MOBILE_ICONS) : m.icons.filter((x) => x !== type);
    set({ icons });
  };
  return (
    <div className="space-y-4">
      <Field label={t("headerStudio.phoneLayout")}>
        <select className={SELECT} value={m.layout} onChange={(e) => set({ layout: e.target.value as typeof m.layout })}>
          {(["logo-left", "logo-center", "menu-left"] as const).map((v) => <option key={v} value={v}>{t(k(`headerStudio.phoneLayout.${v}`))}</option>)}
        </select>
      </Field>
      <Field label={t("headerStudio.drawer")}>
        <select className={SELECT} value={m.drawer} onChange={(e) => set({ drawer: e.target.value as typeof m.drawer })}>
          {(["side", "full", "dropdown"] as const).map((v) => <option key={v} value={v}>{t(k(`headerStudio.drawer.${v}`))}</option>)}
        </select>
      </Field>
      <Field label={t("headerStudio.breakpoint")} hint={t("headerStudio.breakpointHint")}>
        <select className={SELECT} value={m.breakpoint} onChange={(e) => set({ breakpoint: e.target.value as typeof m.breakpoint })}>
          <option value="lg">{t("headerStudio.breakpoint.lg")}</option>
          <option value="md">{t("headerStudio.breakpoint.md")}</option>
        </select>
      </Field>
      <fieldset className="space-y-1">
        <legend className="text-xs font-medium text-muted-foreground">{t("headerStudio.phoneIcons", { max: MAX_MOBILE_ICONS })}</legend>
        {MOBILE_BAR_TYPES.map((type) => {
          const on = m.icons.includes(type);
          return (
            <label key={type} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={on} disabled={!on && m.icons.length >= MAX_MOBILE_ICONS} onChange={(e) => toggleIcon(type, e.target.checked)} />
              {t(k(`headerStudio.el.${type}`))}
            </label>
          );
        })}
      </fieldset>
      <p className="text-xs text-muted-foreground">{t("headerStudio.drawerHint")}</p>
    </div>
  );
}

// ── Behaviour ───────────────────────────────────────────────────────────

function BehaviourPanel({ config, onChange, pages }: { config: HeaderConfig; onChange: (c: HeaderConfig) => void; pages: { path: string; title: string }[] }) {
  const t = useT();
  const b = config.behaviour;
  const set = (patch: Partial<HeaderConfig["behaviour"]>) => onChange({ ...config, behaviour: { ...b, ...patch } });
  return (
    <div className="space-y-3">
      <Toggle label={t("headerStudio.sticky")} checked={b.sticky} onChange={(v) => set({ sticky: v })} />
      <Toggle label={t("headerStudio.shrink")} checked={b.shrink} onChange={(v) => set({ shrink: v })} />
      <Toggle label={t("headerStudio.hideOnScroll")} checked={b.hideOnScroll} onChange={(v) => set({ hideOnScroll: v })} />
      <Field label={t("headerStudio.transparent")} hint={t("headerStudio.transparentHint")}>
        <select className={SELECT} value={b.transparent} onChange={(e) => set({ transparent: e.target.value as typeof b.transparent })}>
          {(["off", "home", "all", "selected"] as const).map((v) => <option key={v} value={v}>{t(k(`headerStudio.transparent.${v}`))}</option>)}
        </select>
      </Field>
      {b.transparent === "selected" && (
        <fieldset className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
          <legend className="px-1 text-xs font-medium text-muted-foreground">{t("headerStudio.transparentPages")}</legend>
          {pages.length === 0 && <p className="text-xs text-muted-foreground">{t("headerStudio.noPages")}</p>}
          {pages.map((p) => {
            const on = b.transparentPages.includes(p.path);
            return (
              <label key={p.path} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={on} onChange={(e) => set({ transparentPages: e.target.checked ? [...b.transparentPages, p.path] : b.transparentPages.filter((x) => x !== p.path) })} />
                <span className="truncate">{p.title}</span><span className="ms-auto truncate text-[11px] text-muted-foreground">{p.path}</span>
              </label>
            );
          })}
        </fieldset>
      )}
    </div>
  );
}

// ── History ─────────────────────────────────────────────────────────────

function HistoryPanel({ doc, busy, onRestore, onDiscard }: {
  doc: HeaderStudioDoc; busy: boolean; onRestore: (index: number, publishNow: boolean) => void; onDiscard: () => void;
}) {
  const t = useT();
  const dates = usePanelDates();
  const fmt = (iso?: string | null) => (iso ? dates.dateTime(iso) : "");
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{t("headerStudio.historyHint")}</p>
      {doc.published && (
        <div className="rounded-lg border p-3 text-sm">
          <p className="font-medium">{t("headerStudio.currentVersion")}</p>
          <p className="text-xs text-muted-foreground">{fmt(doc.publishedAt)} · {t(k(`headerStudio.preset.${doc.published.preset}`)) || doc.published.preset}</p>
          {hasUnpublishedChanges(doc) && (
            <Button size="sm" variant="ghost" className="mt-2 h-7 px-2 text-xs" disabled={busy} onClick={onDiscard}>{t("headerStudio.discardDraft")}</Button>
          )}
        </div>
      )}
      {doc.history.length === 0 && <p className="text-sm text-muted-foreground">{t("headerStudio.historyEmpty")}</p>}
      <ol className="space-y-2">
        {doc.history.map((v, i) => (
          <li key={`${v.publishedAt}-${i}`} className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm">
              <History className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{fmt(v.publishedAt)}</span>
            </div>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" disabled={busy} onClick={() => onRestore(i, false)}>
                <RotateCcw className="h-3 w-3" />{t("headerStudio.restoreDraft")}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={busy} onClick={() => onRestore(i, true)}>{t("headerStudio.restoreLive")}</Button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
