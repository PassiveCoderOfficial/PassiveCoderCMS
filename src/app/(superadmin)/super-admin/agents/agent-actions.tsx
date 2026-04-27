"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AgentActions({
  agentId,
  currentStatus,
  currentCommission,
}: {
  agentId: string;
  currentStatus: string;
  currentCommission: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editingCommission, setEditingCommission] = useState(false);
  const [commission, setCommission] = useState(String(currentCommission));

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
      body: JSON.stringify({ agentId, action: "commission", commission_rate: rate }),
    });
    const data = await res.json() as { error?: string };
    setLoading(false);
    if (!res.ok) toast.error(data.error ?? "Failed");
    else { toast.success("Commission updated"); setEditingCommission(false); router.refresh(); }
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {editingCommission ? (
        <>
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={commission}
            onChange={e => setCommission(e.target.value)}
            className="w-16 text-xs bg-gray-800 border border-gray-600 rounded px-1.5 py-1 text-white"
          />
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
        </>
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
