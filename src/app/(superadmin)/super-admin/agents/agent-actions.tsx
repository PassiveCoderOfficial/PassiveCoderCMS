"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AgentActions({
  agentId,
  currentStatus,
  currentCommission,
  currentCommissionType,
}: {
  agentId: string;
  currentStatus: string;
  currentCommission: number;
  currentCommissionType: "recurring" | "one_time";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editingCommission, setEditingCommission] = useState(false);
  const [commission, setCommission] = useState(String(currentCommission));
  const [commissionType, setCommissionType] = useState<"recurring" | "one_time">(currentCommissionType ?? "recurring");

  async function updateStatus(status: string) {
    setLoading(true);
    const res = await fetch("/api/super-admin/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, action: "status", status }),
    });
    const data = await res.json() as { error?: string };
    setLoading(false);
    if (!res.ok) toast.error(data.error ?? "Failed");
    else { toast.success("Agent updated"); router.refresh(); }
  }

  async function saveCommission() {
    const rate = parseFloat(commission);
    if (isNaN(rate) || rate < 0 || rate > 100) { toast.error("Invalid rate (0–100)"); return; }
    setLoading(true);
    const res = await fetch("/api/super-admin/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, action: "commission", commission_rate: rate, commission_type: commissionType }),
    });
    const data = await res.json() as { error?: string };
    setLoading(false);
    if (!res.ok) toast.error(data.error ?? "Failed");
    else { toast.success("Commission updated"); setEditingCommission(false); router.refresh(); }
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {editingCommission ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={commission}
              onChange={e => setCommission(e.target.value)}
              className="w-16 text-xs bg-gray-800 border border-gray-600 rounded px-1.5 py-1 text-white"
            />
            <span className="text-gray-500 text-xs">%</span>
          </div>
          <div className="flex gap-1">
            {(["recurring", "one_time"] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setCommissionType(t)}
                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                  commissionType === t
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                }`}
              >
                {t === "recurring" ? "Recurring" : "One-Time"}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <button
              onClick={saveCommission}
              disabled={loading}
              className="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded transition-colors disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setEditingCommission(false)}
              className="text-xs text-gray-500 hover:text-gray-300 px-1"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditingCommission(true)}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Edit %
        </button>
      )}
      {currentStatus === "active" ? (
        <button
          onClick={() => updateStatus("suspended")}
          disabled={loading}
          className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
        >
          Suspend
        </button>
      ) : (
        <button
          onClick={() => updateStatus("active")}
          disabled={loading}
          className="text-xs text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
        >
          Activate
        </button>
      )}
    </div>
  );
}
