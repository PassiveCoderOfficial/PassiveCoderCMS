"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, ShieldCheck, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SiteDeleteModal({ site, onClose, onDeleted }: {
  site: { id: string; name: string };
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [withBackup, setWithBackup] = useState(true);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (confirm !== site.name) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/super-admin/sites/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: site.id, backup: withBackup }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Delete failed"); setDeleting(false); return; }
      toast.success(`"${site.name}" deleted${withBackup && data.backupPath ? " — backup saved" : ""}`);
      onDeleted(site.id);
      onClose();
    } catch {
      toast.error("Network error");
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold text-white">Delete Site</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-red-950/40 border border-red-800 rounded-lg p-3 text-xs text-red-300 space-y-1">
            <p className="font-semibold text-red-400">This action is permanent and cannot be undone.</p>
            <p>All site data — pages, content, media, orders, members, subscriptions — will be deleted.</p>
          </div>

          <button
            onClick={() => setWithBackup(v => !v)}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
              withBackup ? "border-indigo-500 bg-indigo-950/40" : "border-gray-700 bg-gray-800/40 hover:border-gray-600"
            )}
          >
            <div className={cn(
              "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
              withBackup ? "border-indigo-500 bg-indigo-600" : "border-gray-600"
            )}>
              {withBackup && <ShieldCheck className="w-3 h-3 text-white" />}
            </div>
            <div>
              <p className="text-sm font-medium text-white">Create backup before deleting</p>
              <p className="text-xs text-gray-400 mt-0.5">Saves a full JSON/CSV export to storage — can be restored later</p>
            </div>
          </button>

          <div>
            <label className="text-xs text-gray-400 block mb-1.5">
              Type <span className="font-mono text-gray-200">{site.name}</span> to confirm
            </label>
            <input
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder={site.name}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting || confirm !== site.name}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            {deleting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</>
              : <><Trash2 className="w-4 h-4" /> Delete Site</>
            }
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
