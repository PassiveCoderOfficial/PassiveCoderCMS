"use client";

import { useState } from "react";
import { Zap, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Agent { id: string; full_name: string; email: string; referral_code: string; }

const NONE = "__none__";

export default function AssignAgent({
  siteId,
  currentAgentId,
  agents,
}: {
  siteId: string;
  currentAgentId: string | null;
  agents: Agent[];
}) {
  const [selected, setSelected] = useState(currentAgentId ?? NONE);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const agentId = selected === NONE ? null : selected;
    const res = await fetch(`/api/super-admin/sites/${siteId}/assign-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: agentId }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? "Failed to assign agent");
    } else {
      toast.success(agentId ? "Agent assigned" : "Agent removed");
    }
  }

  const dirty = selected !== (currentAgentId ?? NONE);

  return (
    <div className="flex items-center gap-2">
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>— None —</SelectItem>
          {agents.map(a => (
            <SelectItem key={a.id} value={a.id}>
              {a.full_name} ({a.referral_code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {dirty && (
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Save
        </Button>
      )}
      {!dirty && selected !== NONE && (
        <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
      )}
    </div>
  );
}
