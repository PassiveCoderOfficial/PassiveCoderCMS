"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { BuilderCanvas } from "./canvas/builder-canvas";
import { PreviewFrame } from "./canvas/preview-frame";
import { BlocksPanel } from "./blocks-panel/blocks-panel";
import { SettingsPanel } from "./settings-panel/settings-panel";
import { MobileBuilderShell } from "./mobile-builder-shell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Monitor, Tablet, Smartphone, Eye, Edit3, Undo2, Redo2,
  Save, PanelLeft, PanelRight, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { toast } from "sonner";
import type { Page } from "@/types/cms";

interface BuilderInterfaceProps {
  page: Page;
}

/** Shared save/undo/shortcut logic — returned to whichever shell renders. */
export interface BuilderControls {
  saving: boolean;
  isDirty: boolean;
  lastSavedAt: Date | null;
  handleSave: (auto?: boolean) => Promise<void>;
}

export function BuilderInterface({ page }: BuilderInterfaceProps) {
  const {
    blocks, isDirty,
    setBlocks, setPageId, setTenantId, setDirty,
    undo, redo,
  } = useBuilderStore();
  const [saving, setSaving] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setPageId(page.id);
    // Scope tenant-aware settings panels to the page's own tenant, which is not
    // the viewer's tenant when a super admin edits another tenant's page.
    setTenantId(page.tenant_id ?? undefined);
    setBlocks(page.blocks ?? []);
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.id]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const savingRef = useRef(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const handleSave = useCallback(async (auto = false) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    const currentBlocks = useBuilderStore.getState().blocks;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("pages")
        .update({ blocks: currentBlocks, updated_at: new Date().toISOString() })
        .eq("id", page.id);
      if (error) throw error;
      // Only clear dirty if nothing changed while the request was in flight
      if (useBuilderStore.getState().blocks === currentBlocks) setDirty(false);
      setLastSavedAt(new Date());
      if (!auto) toast.success("Page saved");
    } catch (err) {
      toast.error("Failed to save page — your changes are still here, try again");
      console.error(err);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [page.id, setDirty]);

  // Autosave: 2.5s after the last change
  useEffect(() => {
    if (!isDirty) return;
    const t = setTimeout(() => void handleSave(true), 2500);
    return () => clearTimeout(t);
  }, [blocks, isDirty, handleSave]);

  // Keyboard shortcuts: Ctrl+S save, Ctrl+Z undo, Ctrl+Y / Ctrl+Shift+Z redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      const target = e.target as HTMLElement;
      const typing = target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if (key === "s") {
        e.preventDefault();
        void handleSave();
      } else if (key === "z" && !typing) {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      } else if (key === "y" && !typing) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave, undo, redo]);

  const controls: BuilderControls = { saving, isDirty, lastSavedAt, handleSave };

  if (isMobile) {
    return <MobileBuilderShell page={page} controls={controls} />;
  }
  return <DesktopBuilderShell controls={controls} />;
}

// ─── Desktop shell (unchanged layout) ───────────────────────────────────────

function DesktopBuilderShell({ controls }: { controls: BuilderControls }) {
  const {
    mode, breakpoint, setMode, setBreakpoint,
    undo, redo, canUndo, canRedo,
  } = useBuilderStore();
  const { saving, isDirty, lastSavedAt, handleSave } = controls;
  const [showBlocks, setShowBlocks] = useState(true);
  const [showSettings, setShowSettings] = useState(true);

  const breakpoints = [
    { value: "desktop", icon: Monitor, label: "Desktop" },
    { value: "tablet", icon: Tablet, label: "Tablet" },
    { value: "mobile", icon: Smartphone, label: "Mobile" },
  ] as const;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b bg-background shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("h-8 w-8", !showBlocks && "text-muted-foreground")} onClick={() => setShowBlocks(!showBlocks)}>
                <PanelLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle blocks panel</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-5" />

          <div className="flex rounded-md border overflow-hidden">
            {[
              { value: "edit", icon: Edit3, label: "Edit mode" },
              { value: "preview", icon: Eye, label: "Preview mode" },
            ].map(({ value, icon: Icon, label }) => (
              <Tooltip key={value}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setMode(value as "edit" | "preview")}
                    className={cn("flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors", mode === value ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{label.split(" ")[0]}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          <div className="flex rounded-md border overflow-hidden">
            {breakpoints.map(({ value, icon: Icon, label }) => (
              <Tooltip key={value}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setBreakpoint(value)}
                    className={cn("px-2.5 py-1.5 transition-colors", breakpoint === value ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          <Separator orientation="vertical" className="h-5" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={!canUndo()}>
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={!canRedo()}>
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
          </Tooltip>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {saving ? "Saving…" : isDirty ? "Unsaved changes" : lastSavedAt ? "All changes saved" : ""}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("h-8 w-8", !showSettings && "text-muted-foreground")} onClick={() => setShowSettings(!showSettings)}>
                  <PanelRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle settings panel</TooltipContent>
            </Tooltip>
            <Button size="sm" onClick={() => void handleSave()} disabled={saving || !isDirty} className="h-8 gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {/* Main */}
        <div className="flex flex-1 overflow-hidden relative">
          {showBlocks && (
            <div className="flex w-52 border-r shrink-0 overflow-hidden flex-col">
              <BlocksPanel />
            </div>
          )}

          <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
            <div className={cn("min-h-full transition-all", breakpoint !== "desktop" && "py-6")}>
              {breakpoint !== "desktop" && (
                <div className="text-center text-xs text-gray-400 mb-3">
                  {breakpoint === "tablet" ? "768px" : "375px"} preview
                </div>
              )}
              {breakpoint === "desktop" ? (
                <BuilderCanvas />
              ) : (
                <div className="mx-auto shadow-2xl bg-white overflow-hidden w-fit">
                  <PreviewFrame width={breakpoint === "tablet" ? 768 : 375}>
                    <BuilderCanvas />
                  </PreviewFrame>
                </div>
              )}
            </div>
          </div>

          {showSettings && mode === "edit" && (
            <div className="flex w-64 border-l shrink-0 overflow-hidden flex-col">
              <SettingsPanel />
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
