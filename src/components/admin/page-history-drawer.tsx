"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { History, RotateCcw, Loader2, Sparkles, Pencil, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Snapshot {
  id: string;
  title: string | null;
  reason: "edit" | "ai_edit" | "restore";
  /** "live" = published content before it changed; "draft" = unpublished edits before they were overwritten. */
  kind?: "live" | "draft";
  created_at: string;
  created_by: string | null;
}

const REASON_LABEL: Record<Snapshot["reason"], { label: string; icon: typeof Pencil }> = {
  edit: { label: "Edit", icon: Pencil },
  ai_edit: { label: "AiCoder edit", icon: Sparkles },
  restore: { label: "Restored", icon: Undo2 },
};

type Filter = "all" | "live" | "draft";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "live", label: "Published" },
  { id: "draft", label: "Drafts" },
];

export function PageHistoryDrawer({ pageId, open, onClose }: { pageId: string; open: boolean; onClose: () => void }) {
  const [snapshots, setSnapshots] = useState<Snapshot[] | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const shown = snapshots?.filter(s => filter === "all" || (s.kind ?? "live") === filter) ?? null;
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    let live = true;
    fetch(`/api/pages/${pageId}/snapshots`)
      .then(r => r.json())
      .then(d => { if (live) setSnapshots(d.snapshots ?? []); })
      .catch(() => { if (live) setSnapshots([]); });
    // Reset on close so the next open shows the spinner, not stale history.
    return () => { live = false; setSnapshots(null); };
  }, [open, pageId]);

  async function restore(snapshotId: string) {
    setRestoringId(snapshotId);
    const res = await fetch(`/api/pages/${pageId}/snapshots/${snapshotId}/restore`, { method: "POST" });
    setRestoringId(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? "Failed to restore");
      return;
    }
    const d = await res.json().catch(() => ({}));
    toast.success(d.asDraft
      ? "Restored into your draft — publish to make it live"
      : "Page restored — reloading editor");
    onClose();
    // Full reload rather than a store update — the builder's undo/redo stack
    // and dirty state were built around the page it loaded, not a
    // server-side swap underneath it.
    router.refresh();
    window.location.reload();
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />}
      <div className={cn(
        "fixed top-0 right-0 h-full w-full sm:w-[380px] z-50 bg-background border-l shadow-2xl flex flex-col transition-transform duration-200",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between px-4 h-12 border-b shrink-0">
          <span className="font-semibold text-sm flex items-center gap-2"><History className="w-4 h-4" /> Page History</span>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1 px-4 pt-3 shrink-0" role="tablist">
          {FILTERS.map(f => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="px-4 pt-2 text-[11px] text-muted-foreground shrink-0">
          Restoring never publishes: on a live page it goes into your draft for review.
        </p>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {snapshots === null && (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          {shown?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">
              {filter === "draft"
                ? "No draft history yet. Unpublished edits are saved here at most every 10 minutes, and whenever a draft is discarded."
                : "No history yet — snapshots are captured automatically as you edit."}
            </p>
          )}
          {shown?.map(s => {
            const isDraft = s.kind === "draft";
            const meta = REASON_LABEL[s.reason];
            const Icon = meta.icon;
            return (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate flex items-center gap-1.5">
                      <span className="truncate">{s.title ?? "Untitled"}</span>
                      <span className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                        isDraft ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" : "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300",
                      )}>
                        {isDraft ? "Draft" : "Published"}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {meta.label} · {new Date(s.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 shrink-0"
                  onClick={() => restore(s.id)}
                  disabled={restoringId === s.id}
                >
                  {restoringId === s.id
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <RotateCcw className="h-3 w-3" />}
                  Restore
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
