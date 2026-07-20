"use client";

import { useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AssignOwner({ siteId }: { siteId: string }) {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function assign() {
    if (!email.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/super-admin/sites/${siteId}/assign-owner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? "Failed to assign owner");
      return;
    }
    toast.success("Owner assigned — site will now appear in their dashboard switcher");
    setEmail("");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === "Enter" && assign()}
        placeholder="user@example.com"
        className="flex-1"
      />
      <Button size="sm" onClick={assign} disabled={saving || !email.trim()}>
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
        Assign Owner
      </Button>
    </div>
  );
}
