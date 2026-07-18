"use client";

import { useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === "Enter" && assign()}
        placeholder="user@example.com"
        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
      />
      <button
        onClick={assign}
        disabled={saving || !email.trim()}
        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
        Assign Owner
      </button>
    </div>
  );
}
