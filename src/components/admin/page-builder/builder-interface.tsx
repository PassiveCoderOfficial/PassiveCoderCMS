"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteChromeProvider } from "./canvas/site-chrome-context";
import { useBuilderStore } from "@/lib/store/builder";
import { BuilderCanvas } from "./canvas/builder-canvas";
import { PreviewFrame } from "./canvas/preview-frame";
import { BlocksPanel } from "./blocks-panel/blocks-panel";
import { MobileBuilderShell } from "./mobile-builder-shell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Monitor, Tablet, Smartphone, Eye, Edit3, Undo2, Redo2,
  Save, PanelLeft, Loader2, Sparkles, Globe, AlertTriangle
} from "lucide-react";
import { AiCoderDialog } from "./aicoder-dialog";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { toast } from "sonner";
import { useAgentContext } from "@/components/agent/agent-context";
import type { Page } from "@/types/cms";

interface BuilderInterfaceProps {
  page: Page;
  /** Server-resolved ai_coder module state for this page's tenant — hides
   *  the AiCoder button when the module isn't enabled. The API route also
   *  enforces this independently, so this is UX polish, not the real gate. */
  aiCoderEnabled?: boolean;
}

/** Shared save/undo/shortcut logic — returned to whichever shell renders. */
export interface BuilderControls {
  saving: boolean;
  isDirty: boolean;
  lastSavedAt: Date | null;
  handleSave: (auto?: boolean) => Promise<void>;
  /** The page has saved edits that are not live yet (published pages only). */
  hasDraft: boolean;
  /** Page is published — edits land in a draft until Publish. */
  isLive: boolean;
  publishing: boolean;
  handlePublish: () => Promise<void>;
  handleDiscard: () => Promise<void>;
  /** Someone/something else changed the page since this editor loaded it.
   *  Autosave is paused until the user reloads or chooses to overwrite. */
  conflict: boolean;
  resolveConflict: (choice: "reload" | "overwrite") => Promise<void>;
}

/**
 * Editor saves go through save_page_blocks / publish_page (migration 105):
 * on a LIVE page, autosave writes a draft the public never sees until
 * Publish — it used to write straight into the live page every 2.5s, so
 * visitors saw half-finished edits. Every save carries the revision this
 * editor last saw; if anything else changed the page in between (another
 * tab, a teammate, the AI assistant, a history restore), the save is
 * rejected instead of silently wiping their work.
 */
function isConflict(err: unknown): boolean {
  const msg = (err as { message?: string } | null)?.message ?? "";
  return msg.includes("page_conflict");
}

export function BuilderInterface({ page, aiCoderEnabled = false }: BuilderInterfaceProps) {
  const {
    blocks, isDirty,
    setBlocks, setPageId, setTenantId, setDirty,
    undo, redo,
  } = useBuilderStore();
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [hasDraft, setHasDraft] = useState(!!page.draft_blocks);
  const [conflict, setConflict] = useState(false);
  const revRef = useRef<number>(page.draft_rev ?? 0);
  const isMobile = useIsMobile();
  const router = useRouter();
  const { setEditorContext, clearEditorContext } = useAgentContext();
  // A saved draft only ever exists on a live page (save_page_blocks decides
  // that server-side from the row's real status), so hasDraft also implies
  // live — keeps Publish reachable even if the status prop is momentarily
  // stale after a status change elsewhere.
  const isLive = (page.status === "published" && !page.template_id) || hasDraft;

  useEffect(() => {
    setEditorContext({ pageId: page.id });
    return () => clearEditorContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.id]);

  useEffect(() => {
    setPageId(page.id);
    // Scope tenant-aware settings panels to the page's own tenant, which is not
    // the viewer's tenant when a super admin edits another tenant's page.
    setTenantId(page.tenant_id ?? undefined);
    // Resume unpublished edits if there are any — otherwise the live content.
    // isInitialLoad: seeds undo history with the pristine page and leaves it
    // clean, so the user's first edit is undoable.
    setBlocks(page.draft_blocks ?? page.blocks ?? [], true);
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

  const handleSave = useCallback(async (auto = false, force = false) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    const currentBlocks = useBuilderStore.getState().blocks;
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("save_page_blocks", {
        p_id: page.id,
        p_blocks: currentBlocks,
        p_expected_rev: force ? null : revRef.current,
      });
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as { rev: number; has_draft: boolean } | null;
      if (row) {
        revRef.current = row.rev;
        setHasDraft(row.has_draft);
      }
      setConflict(false);
      // Only clear dirty if nothing changed while the request was in flight
      if (useBuilderStore.getState().blocks === currentBlocks) setDirty(false);
      setLastSavedAt(new Date());
      if (!auto) toast.success(row?.has_draft ? "Draft saved — publish to make it live" : "Page saved");
    } catch (err) {
      if (isConflict(err)) {
        setConflict(true);
      } else {
        toast.error("Failed to save page — your changes are still here, try again");
        console.error(err);
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [page.id, setDirty]);

  const handlePublish = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setPublishing(true);
    const currentBlocks = useBuilderStore.getState().blocks;
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("publish_page", {
        p_id: page.id,
        p_blocks: currentBlocks,
        p_expected_rev: revRef.current,
      });
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as { rev: number } | null;
      if (row) revRef.current = row.rev;
      setHasDraft(false);
      if (useBuilderStore.getState().blocks === currentBlocks) setDirty(false);
      setLastSavedAt(new Date());
      toast.success("Published — your changes are live");
    } catch (err) {
      if (isConflict(err)) setConflict(true);
      else {
        toast.error("Failed to publish — your changes are still here, try again");
        console.error(err);
      }
    } finally {
      savingRef.current = false;
      setPublishing(false);
    }
  }, [page.id, setDirty]);

  const handleDiscard = useCallback(async () => {
    if (!window.confirm("Discard all unpublished changes and go back to the live version? This can't be undone.")) return;
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("discard_page_draft", { p_id: page.id });
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as { rev: number; blocks: Page["blocks"] } | null;
      if (row) {
        revRef.current = row.rev;
        setBlocks(row.blocks ?? [], true);
      }
      setHasDraft(false);
      setConflict(false);
      toast.success("Unpublished changes discarded");
    } catch (err) {
      toast.error("Failed to discard changes");
      console.error(err);
    } finally {
      savingRef.current = false;
    }
  }, [page.id, setBlocks]);

  const resolveConflict = useCallback(async (choice: "reload" | "overwrite") => {
    if (choice === "reload") {
      // Drop local unsaved state on purpose — the user chose theirs.
      setDirty(false);
      window.location.reload();
      return;
    }
    await handleSave(false, true);
  }, [handleSave, setDirty]);

  // Autosave: 2.5s after the last change — paused while in conflict, so it
  // doesn't keep retrying a save that will be rejected while the user decides.
  useEffect(() => {
    if (!isDirty || conflict) return;
    const t = setTimeout(() => void handleSave(true), 2500);
    return () => clearTimeout(t);
  }, [blocks, isDirty, conflict, handleSave]);

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

  const controls: BuilderControls = {
    saving, isDirty, lastSavedAt, handleSave,
    hasDraft, isLive, publishing, handlePublish, handleDiscard,
    conflict, resolveConflict,
  };

  /**
   * Leaves for the header/footer builder from a navigation or footer block.
   *
   * Saves first, and only navigates once the save resolves — the user is being
   * sent out of the editor from a block they clicked, so losing unsaved page
   * edits here would be losing work they never chose to discard. A failed save
   * aborts the trip and leaves them on the page with their changes intact
   * (handleSave has already shown the error).
   */
  const editSiteChrome = useCallback(async (target: "header" | "footer") => {
    if (useBuilderStore.getState().isDirty) {
      await handleSave();
      if (useBuilderStore.getState().isDirty) return;
    }
    const returnTo = `/dashboard/pages/${page.id}`;
    router.push(`/dashboard/header-builder?target=${target}&returnTo=${encodeURIComponent(returnTo)}`);
  }, [handleSave, page.id, router]);

  const shell = isMobile
    ? <MobileBuilderShell page={page} controls={controls} />
    : <DesktopBuilderShell controls={controls} aiCoderEnabled={aiCoderEnabled} pageId={page.id} />;

  return (
    <SiteChromeProvider value={(t) => void editSiteChrome(t)}>
      {shell}
    </SiteChromeProvider>
  );
}

// ─── Desktop shell (unchanged layout) ───────────────────────────────────────

function DesktopBuilderShell({ controls, aiCoderEnabled, pageId }: { controls: BuilderControls; aiCoderEnabled: boolean; pageId: string }) {
  const {
    mode, breakpoint, setMode, setBreakpoint,
    undo, redo, canUndo, canRedo,
  } = useBuilderStore();
  const { saving, isDirty, lastSavedAt, handleSave, hasDraft, isLive, publishing, handlePublish, handleDiscard, conflict, resolveConflict } = controls;
  const [showBlocks, setShowBlocks] = useState(true);
  const [aiCoderOpen, setAiCoderOpen] = useState(false);

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
                    data-testid={`toolbar-mode-${value}`}
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
                    data-testid={`toolbar-breakpoint-${value}`}
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
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={!canUndo()} data-testid="toolbar-undo" aria-label="Undo">
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={!canRedo()} data-testid="toolbar-redo" aria-label="Redo">
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
          </Tooltip>

          <div className="ml-auto flex items-center gap-2">
            {aiCoderEnabled && (
              <Button size="sm" variant="outline" onClick={() => setAiCoderOpen(true)} className="h-8 gap-1.5" data-testid="toolbar-aicoder">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> AiCoder
              </Button>
            )}
            <span className="text-xs text-muted-foreground hidden sm:inline" data-testid="toolbar-save-status">
              {saveStatusText({ saving, isDirty, lastSavedAt, hasDraft, isLive })}
            </span>
            <Button size="sm" variant={isLive ? "outline" : "default"} onClick={() => void handleSave()} disabled={saving || !isDirty || conflict} className="h-8 gap-1.5" data-testid="toolbar-save">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? "Saving..." : isLive ? "Save draft" : "Save"}
            </Button>
            {isLive && (hasDraft || isDirty) && (
              <>
                {hasDraft && (
                  <Button size="sm" variant="ghost" onClick={() => void handleDiscard()} disabled={saving || publishing || conflict} className="h-8 text-muted-foreground" data-testid="toolbar-discard">
                    Discard
                  </Button>
                )}
                <Button size="sm" onClick={() => void handlePublish()} disabled={saving || publishing || conflict} className="h-8 gap-1.5" data-testid="toolbar-publish">
                  {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
                  {publishing ? "Publishing..." : "Publish"}
                </Button>
              </>
            )}
          </div>
        </div>

        {conflict && <ConflictBanner onResolve={resolveConflict} />}

        {/* Main */}
        <div className="flex flex-1 overflow-hidden relative">
          {showBlocks && (
            <div className="flex w-64 border-r shrink-0 overflow-hidden flex-col">
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
                // The canvas shows the SITE, which never renders in the admin's
                // dark mode — its palette comes from the tenant's theme. This
                // wrapper re-declares the light values of the same CSS vars
                // `.dark` overrides, so blocks using bg-background /
                // text-foreground look here exactly as they do published, even
                // while the dashboard around them stays dark.
                <div className="cms-canvas-light">
                  <BuilderCanvas />
                </div>
              ) : (
                <div className="mx-auto shadow-2xl overflow-hidden w-fit">
                  <PreviewFrame width={breakpoint === "tablet" ? 768 : 375}>
                    <BuilderCanvas />
                  </PreviewFrame>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AiCoderDialog open={aiCoderOpen} onClose={() => setAiCoderOpen(false)} pageId={pageId} />
    </TooltipProvider>
  );
}

/** One line of save state, shared by the desktop and mobile shells. On a
 *  live page it spells out that saved edits are NOT on the public site yet —
 *  the whole point of the draft split is that nobody should have to guess. */
export function saveStatusText({ saving, isDirty, lastSavedAt, hasDraft, isLive }: {
  saving: boolean; isDirty: boolean; lastSavedAt: Date | null; hasDraft: boolean; isLive: boolean;
}): string {
  if (saving) return "Saving…";
  if (isDirty) return "Unsaved changes";
  if (isLive && hasDraft) return "Draft saved · not live yet";
  if (isLive) return "Live · up to date";
  return lastSavedAt ? "All changes saved" : "";
}

/** Shown when a save was rejected because the page changed elsewhere
 *  (another tab, a teammate, the AI assistant, a history restore). */
export function ConflictBanner({ onResolve }: { onResolve: (choice: "reload" | "overwrite") => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-b bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-sm shrink-0" role="alert" data-testid="editor-conflict-banner">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="flex-1 min-w-[16rem]">
        This page was changed somewhere else (another tab, a teammate, or the AI assistant). Autosave is paused so nothing gets overwritten.
      </span>
      <Button size="sm" variant="outline" className="h-7" disabled={busy} onClick={() => { setBusy(true); void onResolve("reload"); }}>
        Load their version
      </Button>
      <Button size="sm" variant="ghost" className="h-7" disabled={busy} onClick={async () => { setBusy(true); await onResolve("overwrite"); setBusy(false); }}>
        Keep mine
      </Button>
    </div>
  );
}
