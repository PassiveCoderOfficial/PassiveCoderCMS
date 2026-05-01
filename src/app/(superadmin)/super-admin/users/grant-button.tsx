"use client";
import { useState } from "react";
import { ShieldCheck, ShieldOff, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function GrantSuperAdminButton({ userId, isSuperAdmin, isSelf }: { userId: string; isSuperAdmin: boolean; isSelf: boolean }) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    await fetch("/api/super-admin/grant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: isSuperAdmin ? "revoke" : "grant" }),
    });
    router.refresh();
    setLoading(false);
  }

  async function deleteUser() {
    setDeleting(true);
    const res = await fetch(`/api/super-admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? "Failed to delete user");
    }
    setDeleting(false);
    setConfirm(false);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggle}
        disabled={loading || isSelf}
        className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 ${
          isSuperAdmin
            ? "bg-red-900/30 text-red-400 hover:bg-red-900/50"
            : "bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50"
        }`}
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> :
          isSuperAdmin ? <ShieldOff className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
        {isSuperAdmin ? "Revoke" : "Grant SA"}
      </button>

      {!isSelf && (
        confirm ? (
          <span className="flex items-center gap-1 text-xs">
            <span className="text-gray-400">Sure?</span>
            <button onClick={deleteUser} disabled={deleting}
              className="text-red-400 hover:text-red-300 font-medium disabled:opacity-50">
              {deleting ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Yes"}
            </button>
            <span className="text-gray-600">/</span>
            <button onClick={() => setConfirm(false)} className="text-gray-400 hover:text-gray-300">No</button>
          </span>
        ) : (
          <button onClick={() => setConfirm(true)}
            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-800 text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-colors">
            <Trash2 className="w-3 h-3" /> Remove
          </button>
        )
      )}
    </div>
  );
}
