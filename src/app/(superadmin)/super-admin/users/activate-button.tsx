"use client";
import { useState } from "react";
import { Power, PowerOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ActivateToggleButton({ userId, isActive, isSelf }: { userId: string; isActive: boolean; isSelf: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/super-admin/users/${userId}/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !isActive }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? "Failed to update status");
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading || isSelf}
      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 ${
        isActive
          ? "bg-red-900/30 text-red-400 hover:bg-red-900/50"
          : "bg-green-900/30 text-green-400 hover:bg-green-900/50"
      }`}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> :
        isActive ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
      {isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
