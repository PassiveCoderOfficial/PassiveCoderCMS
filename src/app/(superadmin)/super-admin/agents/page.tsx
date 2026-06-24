import { createAdminClient } from "@/lib/supabase/server";
import { Users, Zap, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";
import AgentActions from "./agent-actions";

export const metadata = { title: "Agents — Super Admin" };

export default async function AgentsPage() {
  const supabase = await createAdminClient();
  const { data: agents } = await supabase
    .from("agents")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-400" /> Agents & Developers
        </h1>
        <Link href="/super-admin/agents/new"
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Agent
        </Link>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
          <Users className="w-4 h-4 text-yellow-400" />
          <h2 className="font-semibold text-white text-sm">All Agents</h2>
          <span className="text-xs text-gray-500">({agents?.length ?? 0})</span>
        </div>

        {!agents?.length ? (
          <div className="p-10 text-center text-gray-500 text-sm">No agents registered yet.</div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-800">
                {["Name", "Email", "Company", "Referral Code", "Commission", "Type", "Sites", "Status", "Joined", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.map(agent => (
                <tr key={agent.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors align-top">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white font-medium">{agent.full_name}</p>
                      <Link href={`/super-admin/agents/${agent.id}`}
                        className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 mt-0.5">
                        <ExternalLink className="w-2.5 h-2.5" /> View Dashboard
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{agent.email}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{agent.company ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-yellow-400 bg-yellow-900/20 px-1.5 py-0.5 rounded">{agent.referral_code}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-gray-300">{agent.one_time_pct_override ?? 10}% one-time</span>
                      {agent.is_staff && <span className="text-indigo-300">{agent.staff_recurring_pct ?? 10}% recurring</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                        agent.commission_type === "one_time"
                          ? "bg-amber-900/40 text-amber-400"
                          : "bg-indigo-900/40 text-indigo-400"
                      }`}>
                        {agent.commission_type === "one_time" ? "One-Time" : "Recurring"}
                      </span>
                      {agent.is_staff && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-900/40 text-indigo-300 font-medium">Staff</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{agent.total_sites}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${
                      agent.status === "active" ? "bg-green-900/40 text-green-400" :
                      agent.status === "suspended" ? "bg-red-900/40 text-red-400" :
                      "bg-gray-800 text-gray-400"
                    }`}>
                      {agent.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(agent.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <AgentActions
                      agentId={agent.id}
                      currentStatus={agent.status}
                      currentCommission={agent.commission_rate}
                      currentCommissionType={agent.commission_type ?? "one_time"}
                      currentReferralCode={agent.referral_code}
                      currentIsStaff={agent.is_staff ?? false}
                      currentOneTimePct={agent.one_time_pct_override ?? null}
                      currentStaffRecurringPct={agent.staff_recurring_pct ?? null}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}
