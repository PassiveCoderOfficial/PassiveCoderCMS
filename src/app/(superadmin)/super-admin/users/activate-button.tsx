"use client";
import { useState } from "react";
import { Power, PowerOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
    <Button
      size="sm"
      variant={isActive ? "destructive" : "outline"}
      className={isActive ? "" : "text-green-500 border-green-800 hover:bg-green-900/20"}
      onClick={toggle}
      disabled={loading || isSelf}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> :
        isActive ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
      {isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}
