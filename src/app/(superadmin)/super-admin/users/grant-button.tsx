"use client";
import { useState } from "react";
import { ShieldCheck, ShieldOff, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
      <Button
        size="sm"
        variant={isSuperAdmin ? "destructive" : "outline"}
        className={isSuperAdmin ? "" : "text-indigo-500 border-indigo-800 hover:bg-indigo-900/20"}
        onClick={toggle}
        disabled={loading || isSelf}
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> :
          isSuperAdmin ? <ShieldOff className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
        {isSuperAdmin ? "Revoke" : "Grant SA"}
      </Button>

      {!isSelf && (
        confirm ? (
          <span className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Sure?</span>
            <button onClick={deleteUser} disabled={deleting}
              className="text-red-400 hover:text-red-300 font-medium disabled:opacity-50">
              {deleting ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Yes"}
            </button>
            <span className="text-muted-foreground">/</span>
            <button onClick={() => setConfirm(false)} className="text-muted-foreground hover:text-foreground">No</button>
          </span>
        ) : (
          <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-red-400" onClick={() => setConfirm(true)}>
            <Trash2 className="w-3 h-3" /> Remove
          </Button>
        )
      )}
    </div>
  );
}
