"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save, Loader2, Zap, UserCheck, ToggleLeft, ToggleRight, Smartphone, DollarSign, CreditCard } from "lucide-react";

interface PlatformSettings {
  default_commission_rate?: number;
  default_commission_type?: "recurring" | "one_time";
  default_agent_one_time_pct?: number | null;
  default_staff_recurring_pct?: number | null;
  agent_signup_enabled: boolean;
  agent_auto_approve: boolean;
  bkash_number?: string | null;
  nagad_number?: string | null;
  bank_details?: string | null;
  manual_payment_instructions?: string | null;
  usd_to_bdt_rate?: number | null;
  shurjopay_mode?: "sandbox" | "live" | null;
  dodo_mode?: "sandbox" | "live" | null;
  whatsapp_number?: string | null;
}

export default function SASettingsClient({ settings }: { settings: PlatformSettings | null }) {
  const [agentOneTimePct, setAgentOneTimePct] = useState(String(settings?.default_agent_one_time_pct ?? 10));
  const [staffRecurringPct, setStaffRecurringPct] = useState(String(settings?.default_staff_recurring_pct ?? 10));
  const [agentSignup, setAgentSignup] = useState(settings?.agent_signup_enabled !== false);
  const [autoApprove, setAutoApprove] = useState(settings?.agent_auto_approve !== false);
  const [bkash, setBkash] = useState(settings?.bkash_number ?? "");
  const [nagad, setNagad] = useState(settings?.nagad_number ?? "");
  const [bankDetails, setBankDetails] = useState(settings?.bank_details ?? "");
  const [manualNote, setManualNote] = useState(settings?.manual_payment_instructions ?? "");
  const [bdtRate, setBdtRate] = useState(String(settings?.usd_to_bdt_rate ?? 125));
  const [shurjopayMode, setShurjopayMode] = useState<"sandbox" | "live">(settings?.shurjopay_mode ?? "sandbox");
  const [dodoMode, setDodoMode] = useState<"sandbox" | "live">(settings?.dodo_mode ?? "live");
  const [whatsappNumber, setWhatsappNumber] = useState(settings?.whatsapp_number ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    const oneTime = parseFloat(agentOneTimePct);
    const recurring = parseFloat(staffRecurringPct);
    const rate = parseFloat(bdtRate);
    if (isNaN(oneTime) || oneTime < 0 || oneTime > 100) { toast.error("One-time % must be 0–100"); return; }
    if (isNaN(recurring) || recurring < 0 || recurring > 100) { toast.error("Recurring % must be 0–100"); return; }
    if (isNaN(rate) || rate <= 0) { toast.error("BDT rate must be a positive number"); return; }
    setSaving(true);
    const res = await fetch("/api/super-admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        default_agent_one_time_pct: oneTime,
        default_staff_recurring_pct: recurring,
        agent_signup_enabled: agentSignup,
        agent_auto_approve: autoApprove,
        bkash_number: bkash,
        nagad_number: nagad,
        bank_details: bankDetails,
        manual_payment_instructions: manualNote,
        usd_to_bdt_rate: rate,
        shurjopay_mode: shurjopayMode,
        dodo_mode: dodoMode,
        whatsapp_number: whatsappNumber,
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
          <h2 className="font-semibold text-white text-sm">Commission Defaults</h2>
        </div>
        <p className="text-xs text-gray-500">Platform-wide defaults. Individual agents can override with per-agent rates.</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Agent one-time % <span className="text-gray-600">(first payment only)</span></label>
            <div className="flex items-center gap-2">
              <input
                type="number" min={0} max={100} step={0.5}
                value={agentOneTimePct}
                onChange={e => setAgentOneTimePct(e.target.value)}
                className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              <span className="text-gray-500 text-sm">%</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Applies to all agents (staff + external)</p>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Staff recurring % <span className="text-gray-600">(each renewal)</span></label>
            <div className="flex items-center gap-2">
              <input
                type="number" min={0} max={100} step={0.5}
                value={staffRecurringPct}
                onChange={e => setStaffRecurringPct(e.target.value)}
                className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              <span className="text-gray-500 text-sm">%</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Only for agents with is_staff = true</p>
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

      {/* Manual payment methods */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-800 pb-4">
          <Smartphone className="w-4 h-4 text-green-400" />
          <h2 className="font-semibold text-white text-sm">Manual Payment Methods</h2>
        </div>
        <p className="text-xs text-gray-500">Shown to clients at subscription checkout. Leave blank to hide a method.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">bKash number</label>
            <input value={bkash} onChange={e => setBkash(e.target.value)} placeholder="01XXXXXXXXX"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Nagad number</label>
            <input value={nagad} onChange={e => setNagad(e.target.value)} placeholder="01XXXXXXXXX"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1.5">Bank transfer details</label>
          <textarea value={bankDetails} onChange={e => setBankDetails(e.target.value)} rows={3} placeholder="Bank name, account name, account number, branch/routing…"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1.5">Extra instructions (optional)</label>
          <textarea value={manualNote} onChange={e => setManualNote(e.target.value)} rows={2} placeholder="e.g. Send money as 'Payment', include your site name in reference."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
        </div>
      </div>

      {/* Currency rate */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-800 pb-4">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <h2 className="font-semibold text-white text-sm">Currency Conversion</h2>
        </div>
        <p className="text-xs text-gray-500">Used by Pricing blocks with USD/BDT switcher enabled.</p>
        <div>
          <label className="text-xs text-gray-400 block mb-1.5">1 USD = ? BDT</label>
          <div className="flex items-center gap-2">
            <input
              type="number" min={1} step={0.5}
              value={bdtRate}
              onChange={e => setBdtRate(e.target.value)}
              className="w-28 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
            <span className="text-gray-500 text-sm">BDT</span>
          </div>
        </div>
      </div>

      {/* Payment gateways */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-800 pb-4">
          <CreditCard className="w-4 h-4 text-violet-400" />
          <h2 className="font-semibold text-white text-sm">Payment Gateways</h2>
        </div>
        <p className="text-xs text-gray-500">Switch gateways between Sandbox and Live without redeploying. Use Sandbox for testing.</p>

        {/* shurjoPay */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-medium block">shurjoPay (Bangladesh)</label>
          <div className="grid grid-cols-2 gap-2">
            {(["sandbox", "live"] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setShurjopayMode(m)}
                className={`text-xs px-3 py-2 rounded-lg border font-medium transition-colors ${
                  shurjopayMode === m
                    ? m === "live"
                      ? "border-green-500 bg-green-500/10 text-green-400"
                      : "border-yellow-500 bg-yellow-500/10 text-yellow-400"
                    : "border-gray-700 text-gray-500 hover:border-gray-600"
                }`}
              >
                {m === "sandbox" ? "🧪 Sandbox" : "🟢 Live"}
              </button>
            ))}
          </div>
          {shurjopayMode === "sandbox" && (
            <p className="text-xs text-yellow-600">Sandbox active — payments go to test environment, no real money.</p>
          )}
        </div>

        {/* Dodo */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-medium block">Dodo Payments (International)</label>
          <div className="grid grid-cols-2 gap-2">
            {(["sandbox", "live"] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setDodoMode(m)}
                className={`text-xs px-3 py-2 rounded-lg border font-medium transition-colors ${
                  dodoMode === m
                    ? m === "live"
                      ? "border-green-500 bg-green-500/10 text-green-400"
                      : "border-yellow-500 bg-yellow-500/10 text-yellow-400"
                    : "border-gray-700 text-gray-500 hover:border-gray-600"
                }`}
              >
                {m === "sandbox" ? "🧪 Sandbox" : "🟢 Live"}
              </button>
            ))}
          </div>
          {dodoMode === "sandbox" && (
            <p className="text-xs text-yellow-600">Sandbox active — use Dodo test API key + test card 4242 4242 4242 4242.</p>
          )}
        </div>

        {/* WhatsApp */}
        <div>
          <label className="text-xs text-gray-400 block mb-1.5">WhatsApp number <span className="text-gray-600">(international, no +)</span></label>
          <input
            value={whatsappNumber}
            onChange={e => setWhatsappNumber(e.target.value)}
            placeholder="e.g. 8801678669699"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
          />
          <p className="text-xs text-gray-600 mt-1">Used in checkout &quot;WhatsApp&quot; button for manual payment requests.</p>
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Settings
      </button>
    </div>
  );
}
