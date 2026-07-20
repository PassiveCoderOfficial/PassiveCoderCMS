"use client";

import { useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
    <Button
      size="sm"
      variant="outline"
      className="text-blue-500 border-blue-800 hover:bg-blue-900/20"
      onClick={verify}
      disabled={loading}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
      Verify
    </Button>
  );
}
