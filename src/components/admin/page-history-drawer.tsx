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
  created_at: string;
  created_by: string | null;
}

const REASON_LABEL: Record<Snapshot["reason"], { label: string; icon: typeof Pencil }> = {
  edit: { label: "Edit", icon: Pencil },
  ai_edit: { label: "AiCoder edit", icon: Sparkles },
  restore: { label: "Restored", icon: Undo2 },
};

export function PageHistoryDrawer({ pageId, open, onClose }: { pageId: string; open: boolean; onClose: () => void }) {
  const [snapshots, setSnapshots] = useState<Snapshot[] | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    setSnapshots(null);
    fetch(`/api/pages/${pageId}/snapshots`)
      .then(r => r.json())
      .then(d => setSnapshots(d.snapshots ?? []))
      .catch(() => setSnapshots([]));
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
    toast.success("Page restored — reloading editor");
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

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {snapshots === null && (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          {snapshots?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">
              No history yet — snapshots are captured automatically as you edit.
            </p>
          )}
          {snapshots?.map(s => {
            const meta = REASON_LABEL[s.reason];
            const Icon = meta.icon;
            return (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.title ?? "Untitled"}</p>
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
