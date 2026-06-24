"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, Link as LinkIcon, Trash2, Shield } from "lucide-react";

export default function AgentActions({
  agentId,
  currentStatus,
  currentCommission,
  currentCommissionType,
  currentReferralCode,
  currentIsStaff,
  currentOneTimePct,
  currentStaffRecurringPct,
}: {
  agentId: string;
  currentStatus: string;
  currentCommission: number;
  currentCommissionType: "recurring" | "one_time";
  currentReferralCode: string;
  currentIsStaff: boolean;
  currentOneTimePct: number | null;
  currentStaffRecurringPct: number | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editingCommission, setEditingCommission] = useState(false);
  const [editingCode, setEditingCode] = useState(false);
  const [editingStaff, setEditingStaff] = useState(false);
  const [commission, setCommission] = useState(String(currentCommission));
  const [commissionType, setCommissionType] = useState<"recurring" | "one_time">(currentCommissionType ?? "one_time");
  const [code, setCode] = useState(currentReferralCode);
  const [codeAvailable, setCodeAvailable] = useState<boolean | null>(null);
  const [codeChecking, setCodeChecking] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [isStaff, setIsStaff] = useState(currentIsStaff);
  const [oneTimePct, setOneTimePct] = useState(currentOneTimePct != null ? String(currentOneTimePct) : "");
  const [staffRecurringPct, setStaffRecurringPct] = useState(currentStaffRecurringPct != null ? String(currentStaffRecurringPct) : "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editingCode || code === currentReferralCode) { setCodeAvailable(null); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const cleaned = code.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (cleaned.length < 3) { setCodeAvailable(false); return; }
      setCodeChecking(true);
      const res = await fetch(`/api/super-admin/agents/check-code?code=${cleaned}&exclude=${agentId}`);
      const d = await res.json();
      setCodeChecking(false);
      setCodeAvailable(d.available);
    }, 400);
  }, [code, editingCode, agentId, currentReferralCode]);

  async function call(body: Record<string, unknown>) {
    setLoading(true);
    const res = await fetch("/api/super-admin/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, ...body }),
    });
    const data = await res.json() as { error?: string };
    setLoading(false);
    if (!res.ok) { toast.error(data.error ?? "Failed"); return false; }
    return true;
  }

  async function updateStatus(status: string) {
    if (await call({ action: "status", status })) { toast.success("Status updated"); router.refresh(); }
  }

  async function saveCommission() {
    const rate = parseFloat(commission);
    if (isNaN(rate) || rate < 0 || rate > 100) { toast.error("Rate must be 0–100"); return; }
    if (await call({ action: "commission", commission_rate: rate, commission_type: commissionType })) {
      toast.success("Commission updated"); setEditingCommission(false); router.refresh();
    }
  }

  async function saveCode() {
    const cleaned = code.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleaned.length < 3) { toast.error("Code must be 3+ chars"); return; }
    if (codeAvailable === false) { toast.error("Code already in use"); return; }
    if (await call({ action: "referral_code", referral_code: cleaned })) {
      toast.success("Referral code updated"); setEditingCode(false); router.refresh();
    }
  }

  async function removeAgent() {
    if (await call({ action: "remove" })) {
      toast.success("Agent removed"); router.refresh();
    }
  }

  async function saveStaff() {
    if (await call({
      action: "staff",
      is_staff: isStaff,
      one_time_pct_override: oneTimePct ? parseFloat(oneTimePct) : null,
      staff_recurring_pct: staffRecurringPct ? parseFloat(staffRecurringPct) : null,
    })) {
      toast.success("Staff settings saved"); setEditingStaff(false); router.refresh();
    }
  }

  const cleanedCode = code.toLowerCase().replace(/[^a-z0-9]/g, "");

  return (
    <div className="flex flex-col gap-2">
      {/* Commission editor */}
      {editingCommission ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <input type="number" min={0} max={100} step={0.5} value={commission}
              onChange={e => setCommission(e.target.value)}
              className="w-16 text-xs bg-gray-800 border border-gray-600 rounded px-1.5 py-1 text-white" />
            <span className="text-gray-500 text-xs">%</span>
          </div>
          <div className="flex gap-1">
            {(["recurring", "one_time"] as const).map(t => (
              <button key={t} type="button" onClick={() => setCommissionType(t)}
                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                  commissionType === t ? "bg-indigo-600 border-indigo-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                }`}>
                {t === "recurring" ? "Recurring" : "One-Time"}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <button onClick={saveCommission} disabled={loading}
              className="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded disabled:opacity-50">
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
            </button>
            <button onClick={() => setEditingCommission(false)} className="text-xs text-gray-500 hover:text-gray-300 px-1">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setEditingCommission(true)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors text-left">
          Edit %
        </button>
      )}

      {/* Referral code editor */}
      {editingCode ? (
        <div className="flex flex-col gap-1.5">
          <div className="relative flex items-center gap-1">
            <input
              value={code}
              onChange={e => { setCode(e.target.value); setCodeAvailable(null); }}
              placeholder="refcode"
              className={`w-28 text-xs bg-gray-800 border rounded px-1.5 py-1 text-white font-mono ${
                codeAvailable === true ? "border-green-500" : codeAvailable === false ? "border-red-500" : "border-gray-600"
              }`}
            />
            {codeChecking && <Loader2 className="w-3 h-3 animate-spin text-gray-500" />}
            {codeAvailable === true && <Check className="w-3 h-3 text-green-400" />}
            {codeAvailable === false && <X className="w-3 h-3 text-red-400" />}
          </div>
          <p className="text-[10px] text-gray-600">→ {cleanedCode || "…"}</p>
          <div className="flex gap-1">
            <button onClick={saveCode} disabled={loading || codeAvailable === false || cleanedCode.length < 3}
              className="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded disabled:opacity-50">
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
            </button>
            <button onClick={() => { setEditingCode(false); setCode(currentReferralCode); }} className="text-xs text-gray-500 hover:text-gray-300 px-1">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setEditingCode(true)} className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 transition-colors">
          <LinkIcon className="w-3 h-3" /> Edit Code
        </button>
      )}

      {/* Status toggle */}
      {currentStatus === "active" ? (
        <button onClick={() => updateStatus("suspended")} disabled={loading}
          className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 text-left">
          Suspend
        </button>
      ) : (
        <button onClick={() => updateStatus("active")} disabled={loading}
          className="text-xs text-green-400 hover:text-green-300 transition-colors disabled:opacity-50 text-left">
          Activate
        </button>
      )}

      {/* Staff settings */}
      {editingStaff ? (
        <div className="flex flex-col gap-1.5 bg-indigo-900/10 border border-indigo-800/30 rounded-lg p-2">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-3 h-3 text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-300">Staff Settings</span>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
            <input type="checkbox" checked={isStaff} onChange={e => setIsStaff(e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500" />
            Is Staff (gets recurring commission)
          </label>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500">One-time % override (blank = platform default 10%)</label>
            <input type="number" min="0" max="100" step="0.5" value={oneTimePct} onChange={e => setOneTimePct(e.target.value)}
              placeholder="e.g. 10"
              className="w-20 text-xs bg-gray-800 border border-gray-600 rounded px-1.5 py-1 text-white" />
          </div>
          {isStaff && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-500">Recurring % override (blank = platform default 10%)</label>
              <input type="number" min="0" max="100" step="0.5" value={staffRecurringPct} onChange={e => setStaffRecurringPct(e.target.value)}
                placeholder="e.g. 10"
                className="w-20 text-xs bg-gray-800 border border-gray-600 rounded px-1.5 py-1 text-white" />
            </div>
          )}
          <div className="flex gap-1">
            <button onClick={saveStaff} disabled={loading}
              className="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded disabled:opacity-50">
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
            </button>
            <button onClick={() => setEditingStaff(false)} className="text-xs text-gray-500 hover:text-gray-300 px-1">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setEditingStaff(true)}
          className={`flex items-center gap-1 text-xs transition-colors ${currentIsStaff ? "text-indigo-400 hover:text-indigo-300" : "text-gray-500 hover:text-gray-300"}`}>
          <Shield className="w-3 h-3" /> {currentIsStaff ? "Staff ✓" : "Staff settings"}
        </button>
      )}

      {/* Remove agent */}
      {confirmRemove ? (
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-red-400">Sure?</span>
          <button onClick={removeAgent} disabled={loading}
            className="text-[10px] bg-red-800 hover:bg-red-700 text-white px-1.5 py-0.5 rounded">
            Yes
          </button>
          <button onClick={() => setConfirmRemove(false)} className="text-[10px] text-gray-500 hover:text-gray-300">No</button>
        </div>
      ) : (
        <button onClick={() => setConfirmRemove(true)}
          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400 transition-colors">
          <Trash2 className="w-3 h-3" /> Remove
        </button>
      )}
    </div>
  );
}
