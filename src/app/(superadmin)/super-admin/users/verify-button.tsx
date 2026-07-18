"use client";

import { useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function VerifyButton({ userId, verified }: { userId: string; verified: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function verify() {
    setLoading(true);
    const res = await fetch(`/api/super-admin/users/${userId}/verify`, { method: "POST" });
    if (res.ok) {
      toast.success("User verified");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? "Failed to verify user");
    }
    setLoading(false);
  }

  if (verified) return null;

  return (
    <button
      onClick={verify}
      disabled={loading}
      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 bg-blue-900/30 text-blue-400 hover:bg-blue-900/50"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
      Verify
    </button>
  );
}
