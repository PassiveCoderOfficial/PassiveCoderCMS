"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { BlocksPanel } from "./blocks-panel/blocks-panel";
import { Button } from "@/components/ui/button";
import { PageSettingsDrawer } from "@/components/admin/page-settings/page-settings-drawer";
import { Undo2, Redo2, Save, Loader2, Settings, Globe } from "lucide-react";
import type { Page } from "@/types/cms";
import { ConflictBanner, saveStatusText, type BuilderControls } from "./builder-interface";
import { MobileEditorShell } from "./mobile-editor-shell";

/** Page editor on a phone: the shared phone editor plus Save / Publish and Page settings. */
export function MobileBuilderShell({ page, controls }: { page: Page; controls: BuilderControls }) {
  const { undo, redo, canUndo, canRedo } = useBuilderStore();
  const { saving, isDirty, lastSavedAt, handleSave, hasDraft, isLive, publishing, handlePublish, handleDiscard, conflict, resolveConflict } = controls;
  const [pageSettingsOpen, setPageSettingsOpen] = React.useState(false);
  const showPublish = isLive && (hasDraft || isDirty);

  return (
    <>
      <MobileEditorShell
        title={page.title}
        status={saveStatusText({ saving, isDirty, lastSavedAt, hasDraft, isLive })}
        backHref="/dashboard/pages"
        actions={
          <>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={undo} disabled={!canUndo()} aria-label="Undo"><Undo2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={redo} disabled={!canRedo()} aria-label="Redo"><Redo2 className="h-4 w-4" /></Button>
            {showPublish ? (
              <Button size="sm" onClick={() => void handlePublish()} disabled={saving || publishing || conflict} className="h-9 gap-1.5 rounded-full px-3.5">
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />} Publish
              </Button>
            ) : (
              <Button size="sm" onClick={() => void handleSave()} disabled={saving || !isDirty || conflict} className="h-9 gap-1.5 rounded-full px-3.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </Button>
            )}
          </>
        }
        banner={
          <>
            {isLive && hasDraft && (
              <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-300 shrink-0">
                <span className="flex-1 truncate">Saved changes are not on the live site until you publish.</span>
                <button type="button" onClick={() => void handleDiscard()} disabled={saving || publishing || conflict} className="underline underline-offset-2 disabled:opacity-50 shrink-0">Discard</button>
              </div>
            )}
            {conflict && <ConflictBanner onResolve={resolveConflict} />}
          </>
        }
        addPanel={<BlocksPanel />}
        layersPanel={<BlocksPanel initialTab="layers" />}
        extraTab={{ icon: Settings, label: "Page", onTap: () => setPageSettingsOpen(true) }}
      />
      <PageSettingsDrawer page={page} open={pageSettingsOpen} onClose={() => setPageSettingsOpen(false)} />
    </>
  );
}
