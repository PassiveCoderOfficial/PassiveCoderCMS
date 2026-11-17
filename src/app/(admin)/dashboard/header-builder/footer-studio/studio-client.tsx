"use client";

/**
 * Footer Studio editor (Header & Footer Studio phase 3, Nov 2026).
 *
 * Left: Presets / Layout / Style / History. Right: the real site footer
 * component (StudioFooter) in preview mode, at desktop, tablet or phone
 * width. Save draft keeps changes private; Publish makes the studio footer
 * the site's footer (and keeps the previous one in History). "Use the
 * classic footer" switches back without losing anything.
 *
 * All editing operations are the tested pure functions in
 * modules/footer-studio/model.ts; storage rules in doc.ts.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Trash2, Settings2, Monitor, Tablet, Smartphone, Loader2,
  Save, Rocket, History, RotateCcw, Check, AlertTriangle, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import { ColorPicker } from "@/components/ui/color-picker";
import { SwitchToStudioButton } from "@/components/admin/studio-switch/switch-to-studio";
import { MapLocationInput, MAP_LOCATION_LABELS, MAP_LOCATION_LABELS_BN } from "@/components/map/map-location-input";
import { loadSiteBusinessAddress } from "@/components/map/business-address";
import { useLanguage, useT } from "@/lib/i18n/language-provider";
import { useUnsavedGuard } from "@/lib/hooks/use-unsaved-guard";
import type { TranslationKey } from "@/lib/i18n/locales/en";
import type { NavItem } from "@/types/cms";
import { SiteContactProvider, type SiteContact } from "@/components/site/site-contact-context";
import { usePanelDates } from "@/components/providers/panel-time-zone";
import { StudioFooter } from "@/components/site/footer-studio/studio-footer";
import { SavedMenuSelect, type PickableMenu } from "@/components/admin/menus/saved-menu-select";
import { MenuStyleEditor } from "@/components/admin/menus/menu-style-editor";
import { normalizeMenu } from "@/modules/navigation/menu-model";
import type { FooterDevice } from "@/components/site/footer-studio/footer-widgets";
import {
  BOTTOM_WIDGET_TYPES, BOTTOM_ZONES, COLUMN_WIDGET_TYPES, CONTACT_FIELDS, MAX_COLUMNS, MAX_COLUMN_WIDGETS, MAX_LINKS,
  MAX_ZONE_WIDGETS, PAYMENT_LABELS, PAYMENT_METHODS,
  addColumn, addWidget, allowedInBottom, allowedInColumn, defaultFooterConfig, findWidget, makeColumn, makeLink, makeWidget,
  moveColumn, moveWidget, removeColumn, removeWidget, updateColumn, updateWidget,
  linksAsMenuItems, linksToMenuWidget,
  type FooterConfig, type FooterWidget, type FooterWidgetType, type FooterZone, type Target,
} from "@/modules/footer-studio/model";
import { FOOTER_PRESETS, buildFooterPreset, type FooterFacts } from "@/modules/footer-studio/presets";
import { hasUnpublishedChanges, resolveEditorFooter, type FooterStudioDoc } from "@/modules/footer-studio/doc";

export type StudioMenu = { id: string; name: string; location: string | null; items: NavItem[] };

type Tab = "presets" | "layout" | "style" | "history";
const TABS: Tab[] = ["presets", "layout", "style", "history"];
const DEVICE_WIDTH: Record<FooterDevice, number | null> = { desktop: null, tablet: 820, mobile: 390 };

const SELECT = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function k(key: string): TranslationKey {
  return key as TranslationKey;
}

export default function FooterStudioClient({
  initialDoc, unavailable, menus: initialMenus, defaultItems, facts, contact, hours, siteMap, tenantId, logoUrl, logoDarkUrl, siteName,
}: {
  initialDoc: FooterStudioDoc;
  unavailable: boolean;
  menus: StudioMenu[];
  /** What a menu widget with no menu of its own shows (footer menu, header menu, classic links, pages). */
  defaultItems: NavItem[];
  facts: FooterFacts;
  contact: SiteContact | null;
  hours: string | null;
  siteMap: string | null;
  tenantId: string;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  siteName: string;
}) {
  const t = useT();
  // Saved menus, refreshed when this tab gets focus again, so a menu edited
  // or created in the Navigation tab shows in the preview at once (menus P2).
  const [menus, setMenus] = useState<StudioMenu[]>(initialMenus);
  useEffect(() => {
    const reload = () => {
      fetch("/api/navigation").then((r) => (r.ok ? r.json() : null)).then((j) => {
        if (!Array.isArray(j?.menus)) return;
        setMenus((j.menus as { id: string; name: string; location: string | null; items: unknown }[])
          .map((m) => ({ id: m.id, name: m.name, location: m.location, items: normalizeMenu(m.items) })));
      }).catch(() => {});
    };
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, []);
  const addMenu = (m: PickableMenu) => setMenus((list) => (list.some((x) => x.id === m.id) ? list : [...list, { id: m.id, name: m.name ?? "", location: m.location ?? null, items: [] }]));
  const [doc, setDoc] = useState<FooterStudioDoc>(initialDoc);
  const [config, setConfig] = useState<FooterConfig | null>(() => resolveEditorFooter(initialDoc));
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(resolveEditorFooter(initialDoc)));
  const [tab, setTab] = useState<Tab>(() => (resolveEditorFooter(initialDoc) ? "layout" : "presets"));
  const [device, setDevice] = useState<FooterDevice>("desktop");
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pendingPreset, setPendingPreset] = useState<string | null>(null);

  const dirty = JSON.stringify(config) !== savedJson;
  const live = doc.enabled && !!doc.published;

  // Menus for the preview, keyed the way the site keys them ("" = default footer menu).
  const previewMenus = useMemo(() => {
    const out: Record<string, NavItem[]> = { "": defaultItems };
    for (const m of menus) out[m.id] = m.items;
    return out;
  }, [menus, defaultItems]);

  const call = useCallback(async (action: string, extra: Record<string, unknown> = {}, label = action) => {
    setBusy(label);
    try {
      const res = await fetch("/api/footer-studio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || t("footerStudio.saveFailed"));
      const next = json.doc as FooterStudioDoc;
      setDoc(next);
      return next;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("footerStudio.saveFailed"));
      return null;
    } finally {
      setBusy(null);
    }
  }, [t]);

  const saveDraft = useCallback(async () => {
    if (!config) return;
    const next = await call("save_draft", { config }, "draft");
    if (next) { setSavedJson(JSON.stringify(next.draft)); setConfig(next.draft); toast.success(t("footerStudio.draftSaved")); }
  }, [call, config, t]);

  const publish = useCallback(async () => {
    if (!config) return;
    const next = await call("publish", { config }, "publish");
    if (next) { setSavedJson(JSON.stringify(next.published)); setConfig(next.published); toast.success(t("footerStudio.published")); }
  }, [call, config, t]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); void saveDraft(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveDraft]);

  // Closing, reloading or following a dashboard link with unsaved work asks first.
  useUnsavedGuard(dirty, t("footerStudio.unsavedLeave"));

  function applyPreset(id: string) {
    const next = buildFooterPreset(id, facts);
    if (!next) return;
    setConfig(next);
    setSelected(null);
    setPendingPreset(null);
    setTab("layout");
    toast.success(t("footerStudio.presetApplied"));
  }

  const status = unavailable
    ? { tone: "warn", text: t("footerStudio.statusUnavailable") }
    : live
      ? (hasUnpublishedChanges(doc) || dirty ? { tone: "info", text: t("footerStudio.statusLiveChanges") } : { tone: "ok", text: t("footerStudio.statusLive") })
      : doc.published
        ? { tone: "muted", text: t("footerStudio.statusClassicKept") }
        : { tone: "muted", text: t("footerStudio.statusClassic") };

  const width = DEVICE_WIDTH[device];

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-background px-3 py-2 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild title={t("footerStudio.back")}>
          <Link href="/dashboard/header-builder?target=footer" aria-label={t("footerStudio.back")}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold leading-tight">{t("footerStudio.title")}</h1>
          <p className={cn("text-[11px] leading-tight", status.tone === "ok" ? "text-emerald-600" : status.tone === "warn" ? "text-amber-600" : status.tone === "info" ? "text-primary" : "text-muted-foreground")}>
            {status.text}{dirty && ` · ${t("footerStudio.unsaved")}`}
          </p>
        </div>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          {live && (
            <Button size="sm" variant="ghost" className="h-8" disabled={!!busy || unavailable} onClick={() => void call("use_classic", {}, "classic").then((d) => d && toast.success(t("footerStudio.classicOn")))}>
              {t("footerStudio.useClassic")}
            </Button>
          )}
          {!live && doc.published && (
            <Button size="sm" variant="ghost" className="h-8" disabled={!!busy || unavailable} onClick={() => void call("use_studio", {}, "studio").then((d) => d && toast.success(t("footerStudio.studioOn")))}>
              {t("footerStudio.useStudio")}
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-8 gap-1.5" disabled={!config || !!busy || unavailable || !dirty} onClick={() => void saveDraft()}>
            {busy === "draft" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}{t("footerStudio.saveDraft")}
          </Button>
          <Button size="sm" className="h-8 gap-1.5" disabled={!config || !!busy || unavailable} onClick={() => void publish()}>
            {busy === "publish" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}{t("footerStudio.publish")}
          </Button>
        </div>
      </div>

      {unavailable && (
        <div className="flex items-start gap-2 border-b bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{t("footerStudio.unavailableHint")}
        </div>
      )}

      {/* Menus P5: this draft came from the classic footer; compare, publish, or drop it and keep the classic one. */}
      {doc.switched && !live && (
        <div className="border-b px-3 py-2 shrink-0">
          <SwitchToStudioButton area="footer" variant="banner" text={t("studioSwitch.studioDraftNoteFooter")} actionLabel={t("studioSwitch.compare")} />
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Panel */}
        <div className="flex w-full shrink-0 flex-col border-b lg:w-[400px] lg:border-b-0 lg:border-e min-h-0">
          <div role="tablist" aria-label={t("footerStudio.title")} className="flex shrink-0 gap-1 overflow-x-auto border-b px-2 py-1.5">
            {TABS.map((id) => (
              <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)}
                className={cn("rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap", tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                {t(k(`footerStudio.tab.${id}`))}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto p-3 max-h-[50vh] lg:max-h-none">
            {tab === "presets" && (
              <PresetGallery facts={facts} contact={contact} menus={previewMenus} hours={hours} siteMap={siteMap} logoUrl={logoUrl} logoDarkUrl={logoDarkUrl} siteName={siteName}
                current={config?.preset ?? null}
                onPick={(id) => (config ? setPendingPreset(id) : applyPreset(id))} />
            )}
            {tab !== "presets" && tab !== "history" && !config && (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <p>{t("footerStudio.pickPresetFirst")}</p>
                <Button size="sm" className="mt-3" onClick={() => setTab("presets")}>{t("footerStudio.tab.presets")}</Button>
                <Button size="sm" variant="ghost" className="mt-3 ms-2" onClick={() => setConfig(defaultFooterConfig())}>{t("footerStudio.startBlank")}</Button>
              </div>
            )}
            {tab === "layout" && config && (
              <LayoutPanel config={config} onChange={setConfig} selected={selected} onSelect={setSelected} menus={menus} onMenuCreated={addMenu} contact={contact} hours={hours} tenantId={tenantId} />
            )}
            {tab === "style" && config && <StylePanel config={config} onChange={setConfig} creditEditable={!!contact?.creditEditable} />}
            {tab === "history" && (
              <HistoryPanel doc={doc} busy={!!busy || unavailable}
                onRestore={async (index, now) => {
                  const next = await call("restore", { index, publish: now }, "restore");
                  if (next) { const c = now ? next.published : next.draft; setConfig(c); setSavedJson(JSON.stringify(c)); toast.success(t(now ? "footerStudio.restoredLive" : "footerStudio.restoredDraft")); }
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
          <div className="flex shrink-0 items-center justify-center gap-1 border-b bg-background px-3 py-1.5" role="group" aria-label={t("footerStudio.device")}>
            {(["desktop", "tablet", "mobile"] as FooterDevice[]).map((d) => {
              const Icon = d === "desktop" ? Monitor : d === "tablet" ? Tablet : Smartphone;
              return (
                <button key={d} type="button" aria-pressed={device === d} onClick={() => setDevice(d)}
                  className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs", device === d ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>
                  <Icon className="h-3.5 w-3.5" />{t(k(`footerStudio.device.${d}`))}
                </button>
              );
            })}
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-4">
            {config ? (
              <div className="cms-canvas-light relative mx-auto overflow-hidden rounded-lg border bg-background text-foreground shadow-sm transition-[width]"
                style={{ width: width ? `${width}px` : "100%", maxWidth: "100%" }}>
                <div className="space-y-3 p-8" aria-hidden>
                  <div className="h-5 w-1/2 rounded bg-muted" />
                  <div className="h-3 w-3/4 rounded bg-muted" />
                  <div className="h-24 rounded-lg bg-muted/70" />
                </div>
                <SiteContactProvider value={contact}>
                  <StudioFooter config={config} menus={previewMenus} hours={hours} siteMap={siteMap} logoUrl={logoUrl} logoDarkUrl={logoDarkUrl} siteName={siteName} preview={device} />
                </SiteContactProvider>
              </div>
            ) : (
              <div className="mx-auto mt-10 max-w-md text-center text-sm text-muted-foreground">{t("footerStudio.previewEmpty")}</div>
            )}
            <p className="mt-3 text-center text-[11px] text-muted-foreground">{t("footerStudio.previewNote")}</p>
          </div>
        </div>
      </div>

      <AlertDialog open={!!pendingPreset} onOpenChange={(o) => !o && setPendingPreset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("footerStudio.replaceTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("footerStudio.replaceBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("footerStudio.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingPreset && applyPreset(pendingPreset)}>{t("footerStudio.usePreset")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Presets ─────────────────────────────────────────────────────────────

function PresetGallery({ facts, contact, menus, hours, siteMap, logoUrl, logoDarkUrl, siteName, current, onPick }: {
  facts: FooterFacts; contact: SiteContact | null; menus: Record<string, NavItem[]>; hours: string | null; siteMap: string | null;
  logoUrl: string | null; logoDarkUrl: string | null; siteName: string; current: string | null; onPick: (id: string) => void;
}) {
  const t = useT();
  const built = useMemo(() => FOOTER_PRESETS.map((p) => ({ id: p.id, config: p.build(facts) })), [facts]);
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{t("footerStudio.presetsHint")}</p>
      {built.map(({ id, config }) => (
        // Not a <button>: the preview holds real links, buttons and a form,
        // and interactive content inside a <button> is invalid HTML (the
        // browser re-parents it and React hydration fails, error #418).
        <div key={id} role="button" tabIndex={0} aria-pressed={current === id} onClick={() => onPick(id)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(id); } }}
          className={cn("group block w-full cursor-pointer overflow-hidden rounded-lg border text-start transition hover:border-primary hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", current === id && "border-primary ring-1 ring-primary")}>
          <div className="cms-canvas-light pointer-events-none relative h-[120px] overflow-hidden bg-background" aria-hidden inert>
            <div className="origin-top-left" style={{ width: "1200px", transform: "scale(0.31)" }}>
              <SiteContactProvider value={contact}>
                <StudioFooter config={config} menus={menus} hours={hours} siteMap={siteMap} logoUrl={logoUrl} logoDarkUrl={logoDarkUrl} siteName={siteName} preview="desktop" thumb />
              </SiteContactProvider>
            </div>
          </div>
          <div className="flex items-center gap-2 border-t px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t(k(`footerStudio.preset.${id}`))}</p>
              <p className="text-[11px] text-muted-foreground">{t(k(`footerStudio.preset.${id}Desc`))}</p>
            </div>
            {current === id && <Check className="h-4 w-4 text-primary" />}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Shared bits ─────────────────────────────────────────────────────────

function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="flex items-center justify-between gap-3 py-1 text-sm">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} aria-label={label} />
    </label>
  );
}

/** An optional own colour (menus P5): empty = the default colour. */
function ColorField({ label, value, onChange }: { label: string; value?: string; onChange: (v: string | undefined) => void }) {
  const t = useT();
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <ColorPicker value={value ?? ""} onChange={(v) => onChange(v || undefined)} className="min-w-0 flex-1" />
        {value && <Button type="button" size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={() => onChange(undefined)}>{t("headerStudio.colorDefault")}</Button>}
      </div>
    </div>
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

function widgetDefaults(type: FooterWidgetType): Partial<FooterWidget> {
  switch (type) {
    case "links": return { links: [makeLink("Contact us", "/contact")] };
    case "text": return { text: "Your text" };
    case "payments": return { methods: ["visa", "mastercard"] };
    default: return {};
  }
}

function WidgetChip({ w, selected, onSelect }: { w: FooterWidget; selected: string | null; onSelect: (id: string | null) => void }) {
  const t = useT();
  return (
    <button type="button" onClick={() => onSelect(selected === w.id ? null : w.id)} aria-pressed={selected === w.id}
      className={cn("flex w-full items-center gap-1 truncate rounded border bg-background px-1.5 py-1 text-start text-[11px]", selected === w.id && "border-primary text-primary")}>
      <Settings2 className="h-3 w-3 shrink-0 opacity-60" />
      <span className="truncate">{t(k(`footerStudio.w.${w.type}`))}{w.title ? `: ${w.title}` : ""}</span>
    </button>
  );
}

function AddWidget({ types, full, label, onAdd }: { types: readonly FooterWidgetType[]; full: boolean; label: string; onAdd: (type: FooterWidgetType) => void }) {
  const t = useT();
  return (
    <select className="mt-1 h-7 w-full rounded border border-input bg-background px-1 text-[11px]" value="" disabled={full} aria-label={label}
      onChange={(ev) => { const type = ev.target.value as FooterWidgetType; if (type) onAdd(type); }}>
      <option value="">{full ? t("footerStudio.full") : `+ ${t("footerStudio.add")}`}</option>
      {types.map((type) => <option key={type} value={type}>{t(k(`footerStudio.w.${type}`))}</option>)}
    </select>
  );
}

// ── Layout: columns, bottom bar, widgets ────────────────────────────────

function LayoutPanel({ config, onChange, selected, onSelect, menus, onMenuCreated, contact, hours, tenantId }: {
  config: FooterConfig; onChange: (c: FooterConfig) => void; selected: string | null; onSelect: (id: string | null) => void;
  menus: StudioMenu[]; onMenuCreated: (m: PickableMenu) => void; contact: SiteContact | null; hours: string | null; tenantId: string;
}) {
  const t = useT();
  const sel = selected ? findWidget(config, selected) : null;
  const add = (to: Target, type: FooterWidgetType) => {
    const w = makeWidget(type, widgetDefaults(type));
    const next = addWidget(config, to, w);
    if (next !== config) { onChange(next); onSelect(w.id); }
  };
  return (
    <div className="space-y-4">
      <section className="space-y-2 rounded-lg border p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">{t("footerStudio.columns")}</h2>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" disabled={config.columns.length >= MAX_COLUMNS}
            onClick={() => onChange(addColumn(config, makeColumn()))}>
            <Plus className="h-3 w-3" />{t("footerStudio.addColumn")}
          </Button>
        </div>
        {config.columns.length === 0 && <p className="text-xs text-muted-foreground">{t("footerStudio.noColumns")}</p>}
        <div className="space-y-2">
          {config.columns.map((c, i) => (
            <div key={c.id} className="rounded-md border border-dashed bg-muted/30 p-2">
              <div className="mb-1.5 flex items-center gap-1">
                <p className="flex-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t("footerStudio.column", { n: i + 1 })}</p>
                <Button size="icon" variant="ghost" className="h-6 w-6" aria-label={t("footerStudio.moveColumnLeft")} title={t("footerStudio.moveColumnLeft")} disabled={i === 0} onClick={() => onChange(moveColumn(config, i, -1))}><ArrowUp className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" aria-label={t("footerStudio.moveColumnRight")} title={t("footerStudio.moveColumnRight")} disabled={i === config.columns.length - 1} onClick={() => onChange(moveColumn(config, i, 1))}><ArrowDown className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" aria-label={t("footerStudio.removeColumn")} title={t("footerStudio.removeColumn")} onClick={() => { onChange(removeColumn(config, i)); onSelect(null); }}><Trash2 className="h-3 w-3" /></Button>
              </div>
              <div className="mb-1.5 grid grid-cols-[1fr_auto] gap-1.5">
                <Input className="h-7 text-xs" value={c.title ?? ""} placeholder={t("footerStudio.columnTitle")} aria-label={t("footerStudio.columnTitle")}
                  onChange={(e) => onChange(updateColumn(config, i, { title: e.target.value }))} />
                <select className="h-7 rounded border border-input bg-background px-1 text-[11px]" value={c.span} aria-label={t("footerStudio.columnWidth")}
                  onChange={(e) => onChange(updateColumn(config, i, { span: e.target.value === "2" ? 2 : 1 }))}>
                  <option value="1">{t("footerStudio.width1")}</option>
                  <option value="2">{t("footerStudio.width2")}</option>
                </select>
              </div>
              <ul className="space-y-1">
                {c.widgets.map((w) => <li key={w.id}><WidgetChip w={w} selected={selected} onSelect={onSelect} /></li>)}
              </ul>
              <AddWidget types={COLUMN_WIDGET_TYPES} full={c.widgets.length >= MAX_COLUMN_WIDGETS} label={`${t("footerStudio.add")} (${t("footerStudio.column", { n: i + 1 })})`}
                onAdd={(type) => add({ where: "column", column: i }, type)} />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2 rounded-lg border p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">{t("footerStudio.bottomBar")}</h2>
          <Switch checked={config.bottom.enabled} onCheckedChange={(v) => onChange({ ...config, bottom: { ...config.bottom, enabled: v } })} aria-label={t("footerStudio.bottomBar")} />
        </div>
        {config.bottom.enabled && (
          <>
            <Toggle label={t("footerStudio.bottomBorder")} checked={config.bottom.border} onChange={(v) => onChange({ ...config, bottom: { ...config.bottom, border: v } })} />
            <div className="grid grid-cols-3 gap-1.5">
              {BOTTOM_ZONES.map((zone) => {
                const list = config.bottom.zones[zone];
                return (
                  <div key={zone} className="min-w-0 rounded-md border border-dashed bg-muted/30 p-1.5">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t(k(`footerStudio.zone.${zone}`))}</p>
                    <ul className="space-y-1">
                      {list.map((w) => <li key={w.id}><WidgetChip w={w} selected={selected} onSelect={onSelect} /></li>)}
                    </ul>
                    <AddWidget types={BOTTOM_WIDGET_TYPES} full={list.length >= MAX_ZONE_WIDGETS} label={`${t("footerStudio.add")} (${t(k(`footerStudio.zone.${zone}`))})`}
                      onAdd={(type) => add({ where: "bottom", zone }, type)} />
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">{t("footerStudio.creditHint")}</p>
          </>
        )}
      </section>

      {sel && (
        <WidgetEditor key={sel.widget.id} config={config} widget={sel.widget} onChange={onChange} onClose={() => onSelect(null)}
          menus={menus} onMenuCreated={onMenuCreated} contact={contact} hours={hours} tenantId={tenantId} />
      )}
    </div>
  );
}

function WidgetEditor({ config, widget: w, onChange, onClose, menus, onMenuCreated, contact, hours, tenantId }: {
  config: FooterConfig; widget: FooterWidget; onChange: (c: FooterConfig) => void; onClose: () => void;
  menus: StudioMenu[]; onMenuCreated: (m: PickableMenu) => void; contact: SiteContact | null; hours: string | null; tenantId: string;
}) {
  const t = useT();
  const { language } = useLanguage();
  const set = (patch: Partial<FooterWidget>) => onChange(updateWidget(config, w.id, patch));
  const [saving, setSaving] = useState(false);
  const at = findWidget(config, w.id)!;
  const posValue = at.where === "column" ? `c:${at.column}` : `b:${at.zone}`;
  const inColumn = at.where === "column";
  const links = w.links ?? [];
  const setLinks = (next: typeof links) => set({ links: next });
  return (
    <section className="space-y-3 rounded-lg border border-primary/40 bg-primary/[0.03] p-3" aria-label={t(k(`footerStudio.w.${w.type}`))}>
      <div className="flex items-center gap-1">
        <h2 className="flex-1 text-sm font-semibold">{t(k(`footerStudio.w.${w.type}`))}</h2>
        <Button size="icon" variant="ghost" className="h-7 w-7" title={t("footerStudio.moveUp")} aria-label={t("footerStudio.moveUp")} onClick={() => onChange(moveWidget(config, w.id, -1))}><ArrowUp className="h-3.5 w-3.5" /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" title={t("footerStudio.moveDown")} aria-label={t("footerStudio.moveDown")} onClick={() => onChange(moveWidget(config, w.id, 1))}><ArrowDown className="h-3.5 w-3.5" /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" title={t("footerStudio.remove")} aria-label={t("footerStudio.remove")} onClick={() => { onChange(removeWidget(config, w.id)); onClose(); }}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
      <Field label={t("footerStudio.position")}>
        <select className={SELECT} value={posValue} onChange={(ev) => {
          const [kind, rest] = ev.target.value.split(":");
          const to: Target = kind === "c" ? { where: "column", column: Number(rest) } : { where: "bottom", zone: rest as FooterZone };
          onChange(moveWidget(config, w.id, to));
        }}>
          {allowedInColumn(w.type) && config.columns.map((_, i) => <option key={`c:${i}`} value={`c:${i}`}>{t("footerStudio.column", { n: i + 1 })}</option>)}
          {allowedInBottom(w.type) && BOTTOM_ZONES.map((z) => <option key={`b:${z}`} value={`b:${z}`}>{t("footerStudio.bottomBar")} / {t(k(`footerStudio.zone.${z}`))}</option>)}
        </select>
      </Field>

      {inColumn && w.type !== "about" && w.type !== "copyright" && (
        <Field label={t("footerStudio.widgetTitle")}>
          <Input value={w.title ?? ""} onChange={(ev) => set({ title: ev.target.value })} />
        </Field>
      )}

      {w.type === "about" && (
        <>
          <Toggle label={t("footerStudio.showLogo")} checked={!w.hideLogo} onChange={(v) => set({ hideLogo: !v })} />
          {!w.hideLogo && (
            <>
              <Field label={t("footerStudio.logoImage")} hint={t("footerStudio.logoImageHint")}>
                <MediaPickerInput value={w.imageUrl ?? ""} onChange={(v) => set({ imageUrl: v || undefined })} compact />
              </Field>
              <Field label={t("footerStudio.textLogo")} hint={t("footerStudio.textLogoHint")}>
                <Input value={w.name ?? ""} onChange={(ev) => set({ name: ev.target.value || undefined })} />
              </Field>
              <Field label={t("footerStudio.logoHeight")}>
                <Input type="number" min={16} max={160} value={w.height ?? 40} onChange={(ev) => set({ height: Number(ev.target.value) || undefined })} />
              </Field>
            </>
          )}
          <Field label={t("footerStudio.aboutText")}>
            <Textarea rows={3} value={w.text ?? ""} onChange={(ev) => set({ text: ev.target.value })} />
          </Field>
        </>
      )}
      {w.type === "menu" && (
        <>
          <SavedMenuSelect menus={menus} value={w.menuId} onChange={(id) => set({ menuId: id })} onCreated={onMenuCreated}
            label={t("footerStudio.menu")} defaultLabel={t("footerStudio.menuDefault")} />
          {!w.menuId && <p className="text-[11px] text-muted-foreground">{t("footerStudio.menuDefaultHint")}</p>}
          <Field label={t("footerStudio.levels")}>
            <select className={SELECT} value={w.levels ?? 1} onChange={(ev) => set({ levels: Number(ev.target.value) > 1 ? 2 : undefined })}>
              <option value={1}>{t("footerStudio.levels1")}</option>
              <option value={2}>{t("footerStudio.levels2")}</option>
            </select>
          </Field>
        </>
      )}
      {(w.type === "menu" || w.type === "links") && inColumn && (
        <Field label={t("footerStudio.linkLayout")}>
          <select className={SELECT} value={w.layout ?? "list"} onChange={(ev) => set({ layout: ev.target.value === "inline" || ev.target.value === "columns" ? ev.target.value : undefined })}>
            <option value="list">{t("footerStudio.layoutList")}</option>
            <option value="inline">{t("footerStudio.layoutInline")}</option>
            {w.type === "menu" && <option value="columns">{t("menuPlace.layoutColumns")}</option>}
          </select>
        </Field>
      )}
      {w.type === "menu" && (
        <div className="space-y-2 rounded-md border p-2">
          <Toggle label={t("menuPlace.styleThis")} checked={!!w.menuStyle} onChange={(v) => set({ menuStyle: v ? { preset: "plain" } : undefined })} />
          {w.menuStyle
            ? <MenuStyleEditor value={w.menuStyle} onChange={(menuStyle) => set({ menuStyle: menuStyle ?? { preset: "plain" } })} showDropdown={false} />
            : <p className="text-[11px] text-muted-foreground">{t("menuPlace.styleThisFooterHint")}</p>}
        </div>
      )}
      {w.type === "links" && (
        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-muted-foreground">{t("footerStudio.links")}</legend>
          {links.map((l, i) => (
            <div key={l.id} className="space-y-1 rounded-md border p-2">
              <div className="grid grid-cols-2 gap-1.5">
                <Input className="h-8 text-xs" value={l.label} placeholder={t("footerStudio.linkLabel")} aria-label={t("footerStudio.linkLabel")}
                  onChange={(ev) => setLinks(links.map((x) => (x.id === l.id ? { ...x, label: ev.target.value } : x)))} />
                <Input className="h-8 text-xs" value={l.url} placeholder="/contact" aria-label={t("footerStudio.linkUrl")}
                  onChange={(ev) => setLinks(links.map((x) => (x.id === l.id ? { ...x, url: ev.target.value } : x)))} />
              </div>
              <div className="flex items-center gap-1">
                <label className="flex flex-1 items-center gap-1.5 text-[11px]">
                  <input type="checkbox" checked={!!l.newTab} onChange={(ev) => setLinks(links.map((x) => (x.id === l.id ? { ...x, newTab: ev.target.checked || undefined } : x)))} />
                  {t("footerStudio.newTab")}
                </label>
                <Button size="icon" variant="ghost" className="h-6 w-6" aria-label={t("footerStudio.moveUp")} disabled={i === 0}
                  onClick={() => { const n = [...links]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setLinks(n); }}><ArrowUp className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" aria-label={t("footerStudio.moveDown")} disabled={i === links.length - 1}
                  onClick={() => { const n = [...links]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; setLinks(n); }}><ArrowDown className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" aria-label={t("footerStudio.remove")}
                  onClick={() => setLinks(links.filter((x) => x.id !== l.id))}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          ))}
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" disabled={links.length >= MAX_LINKS}
            onClick={() => setLinks([...links, makeLink("New link", "/")])}><Plus className="h-3 w-3" />{t("footerStudio.addLink")}</Button>
          <p className="text-[11px] text-muted-foreground">{t("footerStudio.linksHint")}</p>
          {/* Menus P2: these links become a saved menu, so the same links can be shown anywhere and edited in one place. */}
          <Button size="sm" variant="ghost" className="h-7 gap-1 px-1 text-xs text-primary" disabled={!linksAsMenuItems(w).length || saving}
            onClick={async () => {
              setSaving(true);
              try {
                const res = await fetch("/api/navigation", { method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name: w.title || t("menuPlace.footerLinksName"), location: "none", items: linksAsMenuItems(w) }) });
                const json = await res.json().catch(() => ({}));
                if (!res.ok || !json.menu) throw new Error(json.error || t("menuPlace.saveAsMenuFailed"));
                onMenuCreated({ ...json.menu, items: linksAsMenuItems(w) });
                onChange(linksToMenuWidget(config, w.id, json.menu.id));
                toast.success(t("menuPlace.savedAsMenu"));
              } catch (err) {
                toast.error(err instanceof Error ? err.message : t("menuPlace.saveAsMenuFailed"));
              } finally {
                setSaving(false);
              }
            }}>{t("menuPlace.saveAsMenu")}</Button>
        </fieldset>
      )}
      {w.type === "contact" && (
        <>
          <fieldset className="space-y-1">
            <legend className="text-xs font-medium text-muted-foreground">{t("footerStudio.contactShow")}</legend>
            {CONTACT_FIELDS.map((f) => {
              const on = (w.fields ?? CONTACT_FIELDS).includes(f);
              return (
                <label key={f} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={on} onChange={(ev) => {
                    const cur = w.fields ?? [...CONTACT_FIELDS];
                    const next = ev.target.checked ? CONTACT_FIELDS.filter((x) => x === f || cur.includes(x)) : cur.filter((x) => x !== f);
                    set({ fields: next.length === CONTACT_FIELDS.length ? undefined : next });
                  }} />
                  {t(k(`footerStudio.contact.${f}`))}
                </label>
              );
            })}
          </fieldset>
          {CONTACT_FIELDS.map((f) => {
            const siteValue = f === "whatsapp" ? contact?.whatsapp || contact?.phone : contact?.[f];
            return (
              <Field key={f} label={t(k(`footerStudio.contact.${f}`))} hint={siteValue ? t("footerStudio.valueFromSite", { value: siteValue }) : t("footerStudio.valueMissing")}>
                <Input value={w[f] ?? ""} placeholder={siteValue ?? ""} onChange={(ev) => set({ [f]: ev.target.value } as Partial<FooterWidget>)} />
              </Field>
            );
          })}
        </>
      )}
      {w.type === "hours" && (
        <Field label={t("footerStudio.hours")} hint={hours ? t("footerStudio.hoursFromSite") : t("footerStudio.hoursMissing")}>
          <Textarea rows={4} value={w.hours ?? ""} placeholder={hours ?? "Mon - Fri: 9am - 6pm\nSat: 10am - 2pm"} onChange={(ev) => set({ hours: ev.target.value })} />
        </Field>
      )}
      {w.type === "socials" && (
        // Menus P5: an own list (a converted classic footer keeps its links); empty = the site's social links.
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{w.socials?.length ? t("footerStudio.socialsOwnHint") : t("footerStudio.socialsHint")}</p>
          {(w.socials ?? []).map((sl, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Input aria-label={t("footerStudio.socialNetwork")} className="h-8 w-28 text-xs" value={sl.platform} placeholder="facebook"
                onChange={(ev) => set({ socials: (w.socials ?? []).map((x, j) => (j === i ? { ...x, platform: ev.target.value.trim().toLowerCase() } : x)) })} />
              <Input aria-label={t("footerStudio.socialUrl")} className="h-8 min-w-0 flex-1 text-xs" value={sl.url} placeholder="https://"
                onChange={(ev) => set({ socials: (w.socials ?? []).map((x, j) => (j === i ? { ...x, url: ev.target.value } : x)) })} />
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label={t("footerStudio.socialRemove")}
                onClick={() => { const next = (w.socials ?? []).filter((_, j) => j !== i); set({ socials: next.length ? next : undefined }); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => set({ socials: [...(w.socials ?? []), { platform: "facebook", url: "" }] })}>{t("footerStudio.socialAdd")}</Button>
            {!!w.socials?.length && <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => set({ socials: undefined })}>{t("footerStudio.socialUseSite")}</Button>}
          </div>
        </div>
      )}
      {w.type === "newsletter" && (
        <>
          <Field label={t("footerStudio.newsletterText")}>
            <Textarea rows={2} value={w.text ?? ""} onChange={(ev) => set({ text: ev.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label={t("footerStudio.placeholder")}><Input value={w.placeholder ?? ""} placeholder="Your email" onChange={(ev) => set({ placeholder: ev.target.value })} /></Field>
            <Field label={t("footerStudio.buttonLabel")}><Input value={w.buttonLabel ?? ""} placeholder="Subscribe" onChange={(ev) => set({ buttonLabel: ev.target.value })} /></Field>
          </div>
          <Field label={t("footerStudio.successText")}>
            <Input value={w.successText ?? ""} placeholder="Thank you! You are subscribed." onChange={(ev) => set({ successText: ev.target.value })} />
          </Field>
          <p className="text-xs text-muted-foreground">{t("footerStudio.newsletterHint")}</p>
        </>
      )}
      {w.type === "map" && (
        <>
          <MapLocationInput hideTitle location={w.mapLocation ?? null} embedUrl={w.mapEmbedUrl ?? null}
            onChange={(loc, url) => set({ mapLocation: loc ?? undefined, mapEmbedUrl: url || undefined })}
            fallbackAddress={contact?.address ?? null}
            loadBusinessAddress={() => loadSiteBusinessAddress(tenantId)}
            labels={language === "bn" ? MAP_LOCATION_LABELS_BN : MAP_LOCATION_LABELS}
            height={{ value: w.mapHeight, onChange: (v) => set({ mapHeight: v }) }} />
          <p className="text-xs text-muted-foreground">{t("footerStudio.mapHint")}</p>
        </>
      )}
      {w.type === "payments" && (
        <>
          <fieldset className="grid grid-cols-2 gap-1">
            <legend className="mb-1 text-xs font-medium text-muted-foreground">{t("footerStudio.paymentMethods")}</legend>
            {PAYMENT_METHODS.map((m) => {
              const on = (w.methods ?? []).includes(m);
              return (
                <label key={m} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={on} onChange={(ev) => set({ methods: ev.target.checked ? PAYMENT_METHODS.filter((x) => x === m || (w.methods ?? []).includes(x)) : (w.methods ?? []).filter((x) => x !== m) })} />
                  {PAYMENT_LABELS[m]}
                </label>
              );
            })}
          </fieldset>
          <Field label={t("footerStudio.paymentImage")} hint={t("footerStudio.paymentImageHint")}>
            <MediaPickerInput value={w.imageUrl ?? ""} onChange={(v) => set({ imageUrl: v || undefined })} compact />
          </Field>
        </>
      )}
      {w.type === "copyright" && (
        <Field label={t("footerStudio.copyrightText")} hint={t("footerStudio.copyrightHint")}>
          <Input value={w.text ?? ""} placeholder="© {year} Your Business. All rights reserved." onChange={(ev) => set({ text: ev.target.value })} />
        </Field>
      )}
      {w.type === "text" && (
        <>
          <Field label={t("footerStudio.text")}>
            <Textarea rows={3} value={w.text ?? ""} onChange={(ev) => set({ text: ev.target.value })} />
          </Field>
          <Field label={t("footerStudio.link")}>
            <Input value={w.url ?? ""} placeholder="/about" onChange={(ev) => set({ url: ev.target.value })} />
          </Field>
        </>
      )}
      {w.type === "backToTop" && <p className="text-xs text-muted-foreground">{t("footerStudio.backToTopHint")}</p>}
    </section>
  );
}

// ── Style, phone, credit ────────────────────────────────────────────────

function StylePanel({ config, onChange, creditEditable }: { config: FooterConfig; onChange: (c: FooterConfig) => void; creditEditable: boolean }) {
  const t = useT();
  const s = config.style;
  const setStyle = (patch: Partial<FooterConfig["style"]>) => onChange({ ...config, style: { ...s, ...patch } });
  const setMobile = (patch: Partial<FooterConfig["mobile"]>) => onChange({ ...config, mobile: { ...config.mobile, ...patch } });
  const credit = config.credit ?? {};
  const setCredit = (patch: Partial<NonNullable<FooterConfig["credit"]>>) => {
    const next = { ...credit, ...patch };
    for (const key of Object.keys(next) as (keyof typeof next)[]) if (next[key] === undefined || next[key] === "") delete next[key];
    onChange({ ...config, credit: Object.keys(next).length ? next : undefined });
  };
  return (
    <div className="space-y-4">
      <section className="space-y-2 rounded-lg border p-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("footerStudio.style")}</h2>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t("footerStudio.background")}>
            <select className={SELECT} value={s.background} onChange={(e) => setStyle({ background: e.target.value as typeof s.background })}>
              {(["secondary", "dark", "primary", "muted", "default"] as const).map((v) => <option key={v} value={v}>{t(k(`footerStudio.bg.${v}`))}</option>)}
            </select>
          </Field>
          <Field label={t("footerStudio.size")}>
            <select className={SELECT} value={s.size} onChange={(e) => setStyle({ size: e.target.value as typeof s.size })}>
              {(["sm", "md", "lg"] as const).map((v) => <option key={v} value={v}>{t(k(`footerStudio.size.${v}`))}</option>)}
            </select>
          </Field>
        </div>
        <Field label={t("footerStudio.align")}>
          <select className={SELECT} value={s.align} onChange={(e) => setStyle({ align: e.target.value as typeof s.align })}>
            <option value="start">{t("footerStudio.align.start")}</option>
            <option value="center">{t("footerStudio.align.center")}</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <ColorField label={t("footerStudio.bgColor")} value={s.bgColor} onChange={(v) => setStyle({ bgColor: v })} />
          <ColorField label={t("footerStudio.fgColor")} value={s.fgColor} onChange={(v) => setStyle({ fgColor: v })} />
          <ColorField label={t("footerStudio.headingColor")} value={s.accentColor} onChange={(v) => setStyle({ accentColor: v })} />
        </div>
        <Field label={t("footerStudio.gradient")}>
          <select className={SELECT} value={s.gradient ?? ""} onChange={(e) => setStyle({ gradient: (e.target.value || undefined) as typeof s.gradient })}>
            <option value="">{t("footerStudio.gradientNone")}</option>
            <option value="dark">{t("footerStudio.gradientDark")}</option>
            <option value="light">{t("footerStudio.gradientLight")}</option>
          </select>
        </Field>
        <Toggle label={t("footerStudio.uppercase")} checked={s.uppercase} onChange={(v) => setStyle({ uppercase: v })} />
        <Toggle label={t("footerStudio.topBorder")} checked={s.topBorder} onChange={(v) => setStyle({ topBorder: v })} />
      </section>

      <section className="space-y-2 rounded-lg border p-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("footerStudio.phone")}</h2>
        <Toggle label={t("footerStudio.accordion")} checked={config.mobile.accordion} onChange={(v) => setMobile({ accordion: v })} />
        <p className="text-[11px] text-muted-foreground">{t("footerStudio.accordionHint")}</p>
        <Toggle label={t("footerStudio.mobileCenter")} checked={config.mobile.center} onChange={(v) => setMobile({ center: v })} />
      </section>

      <section className="space-y-2 rounded-lg border p-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("footerStudio.credit")}</h2>
        {creditEditable ? (
          <>
            <Toggle label={t("footerStudio.creditShow")} checked={credit.show !== false} onChange={(v) => setCredit({ show: v ? undefined : false })} />
            {credit.show !== false && (
              <>
                <Field label={t("footerStudio.creditText")}><Input value={credit.text ?? ""} maxLength={80} placeholder="Powered by Passive Coder" onChange={(e) => setCredit({ text: e.target.value })} /></Field>
                <Field label={t("footerStudio.creditUrl")}><Input value={credit.url ?? ""} placeholder="https://" onChange={(e) => setCredit({ url: e.target.value })} /></Field>
              </>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">{t("footerStudio.creditLocked")}</p>
        )}
      </section>
    </div>
  );
}

// ── History ─────────────────────────────────────────────────────────────

function HistoryPanel({ doc, busy, onRestore, onDiscard }: {
  doc: FooterStudioDoc; busy: boolean; onRestore: (index: number, publishNow: boolean) => void; onDiscard: () => void;
}) {
  const t = useT();
  const dates = usePanelDates();
  const fmt = (iso?: string | null) => (iso ? dates.dateTime(iso) : "");
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{t("footerStudio.historyHint")}</p>
      {doc.published && (
        <div className="rounded-lg border p-3 text-sm">
          <p className="font-medium">{t("footerStudio.currentVersion")}</p>
          <p className="text-xs text-muted-foreground">{fmt(doc.publishedAt)} · {t(k(`footerStudio.preset.${doc.published.preset}`)) || doc.published.preset}</p>
          {hasUnpublishedChanges(doc) && (
            <Button size="sm" variant="ghost" className="mt-2 h-7 px-2 text-xs" disabled={busy} onClick={onDiscard}>{t("footerStudio.discardDraft")}</Button>
          )}
        </div>
      )}
      {doc.history.length === 0 && <p className="text-sm text-muted-foreground">{t("footerStudio.historyEmpty")}</p>}
      <ol className="space-y-2">
        {doc.history.map((v, i) => (
          <li key={`${v.publishedAt}-${i}`} className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm">
              <History className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{fmt(v.publishedAt)}</span>
            </div>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" disabled={busy} onClick={() => onRestore(i, false)}>
                <RotateCcw className="h-3 w-3" />{t("footerStudio.restoreDraft")}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" disabled={busy} onClick={() => onRestore(i, true)}>
                {t("footerStudio.restoreLive")}<ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
