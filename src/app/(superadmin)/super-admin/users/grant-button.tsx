"use client";
import { useState } from "react";
import { ShieldCheck, ShieldOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GrantSuperAdminButton({ userId, isSuperAdmin }: { userId: string; isSuperAdmin: boolean }) {
  const [loading, setLoading] = useState(false);
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

  return (
    <button
      onClick={toggle}
      disabled={loading}
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
  );
}
