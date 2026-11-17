"use client";

import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Layers, SlidersHorizontal, Eye, Edit3, Smartphone, Monitor, X, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useBuilderStore, type ContainerPath } from "@/lib/store/builder";
import { BuilderCanvas } from "./canvas/builder-canvas";
import { SettingsPanel } from "./settings-panel/settings-panel";
import { PreviewFrame } from "./canvas/preview-frame";
import { useBlockActions } from "./canvas/use-block-actions";
import { useEditSiteChrome } from "./canvas/site-chrome-context";
import { blockDisplayName } from "@/modules/page-builder/block-display-name";
import { useLanguage } from "@/lib/i18n/language-provider";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Block } from "@/types/cms";

/**
 * The phone editor, shared by the page editor and the header / footer
 * builder (2026-10-16). One layout for every editing surface on a phone:
 *
 *   top bar      back, title + save status, the surface's own actions
 *   canvas       full width, phone-sized; or a real 1280px desktop render
 *                scaled to fit (Phone / Desktop switch) so a header can be
 *                checked as desktop visitors see it
 *   action bar   appears when a block is selected: its name, Edit, move,
 *                duplicate, hide, delete. Replaces the tiny canvas toolbar.
 *   tab bar      Add, Layers, Edit, the surface's extra tab, Preview
 *
 * Panels open as bottom sheets. Adding a block closes the sheet and selects
 * and scrolls to the new block.
 */
export interface MobileEditorShellProps {
  title: string;
  /** Second line under the title (save status). */
  status?: React.ReactNode;
  backHref: string;
  onBack?: () => void;
  /** Right side of the top bar: undo/redo/save/publish. */
  actions: React.ReactNode;
  /** Strip under the top bar (draft notice, conflict, round-trip). */
  banner?: React.ReactNode;
  /** Contents of the Add sheet and the Layers sheet. */
  addPanel: React.ReactNode;
  layersPanel: React.ReactNode;
  /** Extra tab, e.g. Page settings. */
  extraTab?: { icon: React.ComponentType<{ className?: string }>; label: string; onTap: () => void };
  /** Canvas surface colour (header builder previews overlay headers on grey). */
  surfaceClassName?: string;
  /** Header / footer: canvas sized to content, not the full page. */
  compactCanvas?: boolean;
  children?: React.ReactNode;
}

/** ContainerPath of a nested block, from the store's path entries. */
function pathOf(entries: { id: string; columnIndex?: number }[] | undefined): ContainerPath | undefined {
  if (!entries || entries.length < 2) return undefined;
  return entries.slice(0, -1).map((e) => ({ containerId: e.id, columnIndex: e.columnIndex ?? 0 }));
}

/** The block's catalog name ("Menu", "Classic header"...), in Bangla on a Bangla dashboard. */
function blockLabel(block: Block, lang?: string) {
  return blockDisplayName(block.type, lang);
}

/** Bar for the selected block, above the tab bar. */
function SelectionBar({ block, path }: { block: Block; path: ContainerPath | undefined }) {
  const { selectBlock, setMobileSheet } = useBuilderStore();
  const { language } = useLanguage();
  const editSiteChrome = useEditSiteChrome();
  const actions = useBlockActions(block, path, () => toast.info("Save as section is on the desktop editor"), editSiteChrome)
    .filter((a) => !a.isDragHandle && a.label !== "Edit settings" && a.label !== "Save as section" && a.onClick);
  const short: Record<string, string> = { "Move up": "Up", "Move down": "Down", "Hide block": "Hide", "Show block": "Show", "Edit site header": "Site header", "Edit site footer": "Site footer" };
  return (
    <div className="border-t bg-background shrink-0 animate-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center gap-2 px-3 pt-2">
        <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0" />
        <p className="text-xs font-semibold truncate flex-1 min-w-0">{blockLabel(block, language)}</p>
        <button type="button" onClick={() => setMobileSheet("settings")} className="rounded-full bg-primary text-primary-foreground text-xs font-semibold px-3.5 py-1.5 shrink-0">
          Edit
        </button>
        <button type="button" aria-label="Deselect" onClick={() => selectBlock(undefined)} className="p-1.5 -mr-1 rounded-full text-muted-foreground hover:bg-muted shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-stretch gap-1 overflow-x-auto px-2 py-1.5 [scrollbar-width:none]">
        {actions.map((a) => (
          <button key={a.label} type="button" onClick={a.onClick} disabled={a.disabled}
            className={cn("flex flex-col items-center gap-0.5 min-w-[3.6rem] rounded-lg px-1.5 py-1 text-[10px] text-muted-foreground active:bg-muted disabled:opacity-30",
              a.variant === "destructive" && "text-red-600")}>
            <a.icon className="h-4 w-4" />
            <span className="whitespace-nowrap">{short[a.label] ?? a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** A 1280px desktop render scaled down to the phone's width. */
function DesktopPreview({ children }: { children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const [h, setH] = useState(600);
  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / 1280));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={outer} className="w-full overflow-hidden" style={{ height: h * scale }}>
      <div style={{ width: 1280, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <PreviewFrame width={1280} autoHeight onHeight={setH}>{children}</PreviewFrame>
      </div>
    </div>
  );
}

export function MobileEditorShell({
  title, status, backHref, onBack, actions, banner, addPanel, layersPanel, extraTab, surfaceClassName, compactCanvas, children,
}: MobileEditorShellProps) {
  const { mode, setMode, mobileSheet, setMobileSheet, selectedBlockId, getBlock, getBlockPath, blocks } = useBuilderStore();
  const { language } = useLanguage();
  const [view, setView] = useState<"phone" | "desktop">("phone");
  const isPreview = mode === "preview";
  const selected = selectedBlockId ? getBlock(selectedBlockId) : undefined;
  const scroller = useRef<HTMLDivElement>(null);

  // The floating AI / chat buttons would sit on top of the tab bar.
  useEffect(() => {
    document.body.dataset.mobileEditor = "1";
    return () => { delete document.body.dataset.mobileEditor; };
  }, []);

  // A block was just added (block count went up): close the Add sheet and
  // bring the new, selected block into view.
  const count = useRef(blocks.length);
  useEffect(() => {
    if (blocks.length > count.current && mobileSheet === "add") setMobileSheet(null);
    count.current = blocks.length;
  }, [blocks.length, mobileSheet, setMobileSheet]);
  useEffect(() => {
    if (!selectedBlockId) return;
    const el = scroller.current?.querySelector(`[data-block-id="${selectedBlockId}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.top < 60 || r.top > window.innerHeight - 220) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedBlockId]);

  const canvas = <BuilderCanvas surfaceClassName={surfaceClassName} />;
  const tabClass = "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors";

  return (
    <div className="mobile-editor fixed inset-0 z-50 flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Top bar */}
      <div className="flex items-center gap-1 px-1.5 h-14 border-b bg-background shrink-0">
        {onBack ? (
          <button type="button" onClick={onBack} aria-label="Back" className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted shrink-0"><ChevronLeft className="h-5 w-5" /></button>
        ) : (
          <Link href={backHref} aria-label="Back" className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted shrink-0"><ChevronLeft className="h-5 w-5" /></Link>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate leading-tight">{title}</p>
          {status && <p className="text-[11px] text-muted-foreground truncate leading-tight">{status}</p>}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">{actions}</div>
      </div>
      {banner}

      {/* View switch */}
      <div className="flex items-center justify-center gap-1 py-1.5 bg-background/80 border-b shrink-0">
        {([["phone", Smartphone, "Phone"], ["desktop", Monitor, "Desktop"]] as const).map(([v, Icon, l]) => (
          <button key={v} type="button" onClick={() => setView(v)}
            className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", view === v ? "bg-foreground text-background" : "text-muted-foreground")}>
            <Icon className="h-3.5 w-3.5" /> {l}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div ref={scroller} className={cn("flex-1 overflow-auto cms-canvas-light", compactCanvas && "py-4")}>
        {view === "desktop" ? (
          <div className={cn(compactCanvas && "px-2")}><DesktopPreview>{canvas}</DesktopPreview></div>
        ) : compactCanvas ? (
          <div className="mx-2 shadow-sm rounded-md overflow-hidden">{canvas}</div>
        ) : canvas}
        {children}
      </div>

      {selected && !isPreview && <SelectionBar block={selected} path={pathOf(getBlockPath(selected.id))} />}

      {/* Tab bar */}
      <div className="flex items-stretch border-t bg-background shrink-0" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <button type="button" onClick={() => setMobileSheet("add")} className={cn(tabClass, "text-muted-foreground active:bg-muted")}>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground"><Plus className="h-4 w-4" /></span>Add
        </button>
        <button type="button" onClick={() => setMobileSheet("layers")} className={cn(tabClass, "text-muted-foreground active:bg-muted")}><Layers className="h-5 w-5 my-1" />Layers</button>
        <button type="button" onClick={() => (selected ? setMobileSheet("settings") : toast("Tap a block on the page to edit it"))}
          className={cn(tabClass, selected ? "text-foreground active:bg-muted" : "text-muted-foreground/60")}><SlidersHorizontal className="h-5 w-5 my-1" />Edit</button>
        {extraTab && <button type="button" onClick={extraTab.onTap} className={cn(tabClass, "text-muted-foreground active:bg-muted")}><extraTab.icon className="h-5 w-5 my-1" />{extraTab.label}</button>}
        <button type="button" onClick={() => setMode(isPreview ? "edit" : "preview")} className={cn(tabClass, isPreview ? "text-primary" : "text-muted-foreground active:bg-muted")}>
          {isPreview ? <Edit3 className="h-5 w-5 my-1" /> : <Eye className="h-5 w-5 my-1" />}{isPreview ? "Edit" : "Preview"}
        </button>
      </div>

      <Sheet open={mobileSheet === "add"} onOpenChange={(o) => !o && setMobileSheet(null)} title="Add a block">
        <div className="h-[78vh] flex flex-col">{addPanel}</div>
      </Sheet>
      <Sheet open={mobileSheet === "layers"} onOpenChange={(o) => !o && setMobileSheet(null)} title="Layers">
        <div className="h-[70vh] flex flex-col">{layersPanel}</div>
      </Sheet>
      <Sheet open={mobileSheet === "settings"} onOpenChange={(o) => !o && setMobileSheet(null)} title={selected ? blockLabel(selected, language) : "Block settings"}>
        <div className="h-[78vh] flex flex-col"><SettingsPanel /></div>
      </Sheet>
    </div>
  );
}
