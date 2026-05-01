"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save, Loader2, Zap, UserCheck, ToggleLeft, ToggleRight } from "lucide-react";

interface PlatformSettings {
  default_commission_rate: number;
  default_commission_type: "recurring" | "one_time";
  agent_signup_enabled: boolean;
  agent_auto_approve: boolean;
}

export default function SASettingsClient({ settings }: { settings: PlatformSettings | null }) {
  const [commissionRate, setCommissionRate] = useState(String(settings?.default_commission_rate ?? 20));
  const [commissionType, setCommissionType] = useState<"recurring" | "one_time">(settings?.default_commission_type ?? "recurring");
  const [agentSignup, setAgentSignup] = useState(settings?.agent_signup_enabled !== false);
  const [autoApprove, setAutoApprove] = useState(settings?.agent_auto_approve !== false);
  const [saving, setSaving] = useState(false);

  async function save() {
    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) { toast.error("Commission rate must be 0–100"); return; }
    setSaving(true);
    const res = await fetch("/api/super-admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        default_commission_rate: rate,
        default_commission_type: commissionType,
        agent_signup_enabled: agentSignup,
        agent_auto_approve: autoApprove,
      }),
    });
    setSaving(false);
    if (res.ok) toast.success("Settings saved");
    else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? "Failed to save");
    }
  }

  function Toggle({ value, onChange, label, desc }: { value: boolean; onChange: (v: boolean) => void; label: string; desc: string }) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
        </div>
        <button onClick={() => onChange(!value)} className="text-gray-400 hover:text-white transition-colors">
          {value
            ? <ToggleRight className="w-8 h-8 text-indigo-400" />
            : <ToggleLeft className="w-8 h-8" />}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Commission defaults */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5">
        <div className="flex items-center gap-2 border-b border-gray-800 pb-4">
          <Zap className="w-4 h-4 text-yellow-400" />
          <h2 className="font-semibold text-white text-sm">Agent Commission Defaults</h2>
        </div>
        <p className="text-xs text-gray-500">Applied to all new agents created via /become-agent or SA panel. Existing agents keep their individual rates.</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Default Rate (%)</label>
            <div className="flex items-center gap-2">
              <input
                type="number" min={0} max={100} step={0.5}
                value={commissionRate}
                onChange={e => setCommissionRate(e.target.value)}
                className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              <span className="text-gray-500 text-sm">%</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Default Type</label>
            <div className="flex gap-2">
              {(["recurring", "one_time"] as const).map(t => (
                <button key={t} onClick={() => setCommissionType(t)}
                  className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                    commissionType === t
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                  }`}>
                  {t === "recurring" ? "Recurring" : "One-Time"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Agent signup settings */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5">
        <div className="flex items-center gap-2 border-b border-gray-800 pb-4">
          <UserCheck className="w-4 h-4 text-blue-400" />
          <h2 className="font-semibold text-white text-sm">Agent Signup</h2>
        </div>

        <Toggle
          value={agentSignup}
          onChange={setAgentSignup}
          label="Allow self-signup (/become-agent)"
          desc="If off, the become-agent form returns an error. Only SA can create agents."
        />
        <Toggle
          value={autoApprove}
          onChange={setAutoApprove}
          label="Auto-approve new agents"
          desc="If on, agents get 'active' status immediately. If off, they get 'pending' and must be activated by SA."
        />
      </div>

      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Settings
      </button>
    </div>
  );
}
