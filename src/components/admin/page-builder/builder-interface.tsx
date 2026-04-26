"use client";

import React, { useEffect, useState } from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { BuilderCanvas } from "./canvas/builder-canvas";
import { BlocksPanel } from "./blocks-panel/blocks-panel";
import { SettingsPanel } from "./settings-panel/settings-panel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Monitor, Tablet, Smartphone, Eye, Edit3, Undo2, Redo2,
  Save, PanelLeft, PanelRight, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Page } from "@/types/cms";

interface BuilderInterfaceProps {
  page: Page;
}

export function BuilderInterface({ page }: BuilderInterfaceProps) {
  const {
    blocks, mode, breakpoint, isDirty,
    setBlocks, setMode, setBreakpoint, setPageId, setDirty,
    undo, redo, canUndo, canRedo,
  } = useBuilderStore();
  const [saving, setSaving] = useState(false);
  const [showBlocks, setShowBlocks] = useState(true);
  const [showSettings, setShowSettings] = useState(true);

  useEffect(() => {
    setPageId(page.id);
    setBlocks(page.blocks ?? []);
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("pages")
        .update({ blocks, updated_at: new Date().toISOString() })
        .eq("id", page.id);
      if (error) throw error;
      setDirty(false);
      toast.success("Page saved successfully");
    } catch (err) {
      toast.error("Failed to save page");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

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
          {/* Panel toggles */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("h-8 w-8", !showBlocks && "text-muted-foreground")} onClick={() => setShowBlocks(!showBlocks)}>
                <PanelLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle blocks panel</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-5" />

          {/* Mode toggle */}
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

          {/* Breakpoints */}
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

          {/* Undo/Redo */}
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
            {isDirty && <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("h-8 w-8", !showSettings && "text-muted-foreground")} onClick={() => setShowSettings(!showSettings)}>
                  <PanelRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle settings panel</TooltipContent>
            </Tooltip>
            <Button size="sm" onClick={handleSave} disabled={saving || !isDirty} className="h-8 gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {/* Main */}
        <div className="flex flex-1 overflow-hidden">
          {/* Blocks panel */}
          {showBlocks && (
            <div className="w-52 border-r shrink-0 overflow-hidden flex flex-col">
              <BlocksPanel />
            </div>
          )}

          {/* Canvas */}
          <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
            <div className={cn("min-h-full transition-all", breakpoint !== "desktop" && "py-6")}>
              {breakpoint !== "desktop" && (
                <div className="text-center text-xs text-gray-400 mb-3">
                  {breakpoint === "tablet" ? "768px" : "375px"} preview
                </div>
              )}
              <div className={cn(breakpoint !== "desktop" && "mx-auto shadow-2xl bg-white overflow-hidden")} style={{ width: breakpoint === "tablet" ? 768 : breakpoint === "mobile" ? 375 : "100%" }}>
                <BuilderCanvas />
              </div>
            </div>
          </div>

          {/* Settings panel */}
          {showSettings && mode === "edit" && (
            <div className="w-64 border-l shrink-0 overflow-hidden flex flex-col">
              <SettingsPanel />
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
