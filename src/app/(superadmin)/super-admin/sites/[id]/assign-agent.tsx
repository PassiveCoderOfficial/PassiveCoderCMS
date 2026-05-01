"use client";

import { useState } from "react";
import { Zap, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Agent { id: string; full_name: string; email: string; referral_code: string; }

export default function AssignAgent({
  siteId,
  currentAgentId,
  agents,
}: {
  siteId: string;
  currentAgentId: string | null;
  agents: Agent[];
}) {
  const [selected, setSelected] = useState(currentAgentId ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/super-admin/sites/${siteId}/assign-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: selected || null }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? "Failed to assign agent");
    } else {
      toast.success(selected ? "Agent assigned" : "Agent removed");
    }
  }

  const dirty = selected !== (currentAgentId ?? "");

  return (
    <div className="flex items-center gap-2">
      <select
        value={selected}
        onChange={e => setSelected(e.target.value)}
        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
      >
        <option value="">— None —</option>
        {agents.map(a => (
          <option key={a.id} value={a.id}>
            {a.full_name} ({a.referral_code})
          </option>
        ))}
      </select>
      {dirty && (
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Save
        </button>
      )}
      {!dirty && selected && (
        <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
      )}
    </div>
  );
}
