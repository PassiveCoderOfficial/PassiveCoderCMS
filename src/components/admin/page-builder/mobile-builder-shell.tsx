"use client";

import React from "react";
import Link from "next/link";
import { useBuilderStore } from "@/lib/store/builder";
import { BuilderCanvas } from "./canvas/builder-canvas";
import { BlocksPanel } from "./blocks-panel/blocks-panel";
import { SettingsPanel } from "./settings-panel/settings-panel";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PageSettingsDrawer } from "@/components/admin/page-settings/page-settings-drawer";
import {
  ChevronLeft, Undo2, Redo2, Save, Loader2, Plus, Layers, SlidersHorizontal, Eye, Edit3, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Page } from "@/types/cms";
import type { BuilderControls } from "./builder-interface";

export function MobileBuilderShell({ page, controls }: { page: Page; controls: BuilderControls }) {
  const {
    mode, setMode, mobileSheet, setMobileSheet, selectedBlockId,
    undo, redo, canUndo, canRedo,
  } = useBuilderStore();
  const { saving, isDirty, handleSave } = controls;
  const [pageSettingsOpen, setPageSettingsOpen] = React.useState(false);

  const isPreview = mode === "preview";

  const tabs = [
    { key: "add" as const, icon: Plus, label: "Add", onTap: () => setMobileSheet("add") },
    { key: "layers" as const, icon: Layers, label: "Layers", onTap: () => setMobileSheet("layers") },
    {
      key: "settings" as const, icon: SlidersHorizontal, label: "Edit",
      onTap: () => setMobileSheet("settings"),
      disabled: !selectedBlockId,
    },
    { key: "page-settings" as const, icon: Settings, label: "Page", onTap: () => setPageSettingsOpen(true) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Top bar */}
      <div className="flex items-center gap-1 px-2 h-12 border-b bg-background shrink-0">
        <Button asChild variant="ghost" size="icon" className="h-9 w-9 shrink-0">
          <Link href="/dashboard/pages"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <span className="font-medium text-sm truncate flex-1 min-w-0">{page.title}</span>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={undo} disabled={!canUndo()}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={redo} disabled={!canRedo()}>
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={() => void handleSave()} disabled={saving || !isDirty} className="h-9 gap-1.5 shrink-0">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </Button>
      </div>

      {/* Canvas — full width; the phone is the mobile preview */}
      <div className="flex-1 overflow-auto bg-white">
        <BuilderCanvas />
      </div>

      {/* Bottom tab bar */}
      <div
        className="flex items-stretch border-t bg-background shrink-0"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={tab.onTap}
            disabled={tab.disabled}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
              tab.disabled ? "text-muted-foreground/40" : "text-muted-foreground active:bg-muted",
            )}
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => setMode(isPreview ? "edit" : "preview")}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
            isPreview ? "text-primary" : "text-muted-foreground active:bg-muted",
          )}
        >
          {isPreview ? <Edit3 className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          {isPreview ? "Editing" : "Preview"}
        </button>
      </div>

      {/* Add / Blocks / Layers sheet */}
      <Sheet open={mobileSheet === "add"} onOpenChange={(o) => !o && setMobileSheet(null)} title="Add to page">
        <div className="h-[75vh] flex flex-col">
          <BlocksPanel />
        </div>
      </Sheet>

      {/* Layers sheet */}
      <Sheet open={mobileSheet === "layers"} onOpenChange={(o) => !o && setMobileSheet(null)} title="Layers">
        <div className="h-[70vh] flex flex-col">
          <BlocksPanel initialTab="layers" />
        </div>
      </Sheet>

      {/* Settings sheet — for the selected block */}
      <Sheet open={mobileSheet === "settings"} onOpenChange={(o) => !o && setMobileSheet(null)} title="Block settings">
        <div className="h-[75vh] flex flex-col">
          <SettingsPanel />
        </div>
      </Sheet>

      {/* Page-level settings — title/slug/SEO/featured image, same drawer as desktop */}
      <PageSettingsDrawer page={page} open={pageSettingsOpen} onClose={() => setPageSettingsOpen(false)} />
    </div>
  );
}
