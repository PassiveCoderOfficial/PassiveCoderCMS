import { requireAgent } from "@/lib/agent";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DollarSign } from "lucide-react";

export default async function AgentCommissionsPage() {
  const agent = await requireAgent();
  if (!agent) redirect("/login");

  const supabase = await createAdminClient();
  const { data: commissions } = await supabase
    .from("agent_commissions")
    .select("*, tenants(name,slug)")
    .eq("agent_id", agent.id)
    .order("created_at", { ascending: false });

  const paid = (commissions ?? []).filter(c => c.status === "paid").reduce((s, c) => s + Number(c.amount), 0);
  const pending = (commissions ?? []).filter(c => c.status === "pending").reduce((s, c) => s + Number(c.amount), 0);

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Commissions</h1>
        <p className="text-muted-foreground text-sm mt-1">Your earnings from assigned and referred sites.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-5 space-y-1">
          <p className="text-xs text-muted-foreground">Total Paid</p>
          <p className="text-3xl font-bold text-green-600">${paid.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 space-y-1">
          <p className="text-xs text-muted-foreground">Pending Payout</p>
          <p className="text-3xl font-bold text-amber-600">${pending.toFixed(2)}</p>
        </div>
      </div>

      {!commissions?.length ? (
        <div className="rounded-xl border bg-muted/30 p-12 text-center space-y-3">
          <DollarSign className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="font-semibold">No commissions yet</p>
          <p className="text-sm text-muted-foreground">Commissions appear when a referred site upgrades to a paid plan.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {["Site", "Amount", "Status", "Description", "Date"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commissions.map(c => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-5 py-3 font-medium">{(c.tenants as { name: string } | null)?.name ?? "—"}</td>
                  <td className="px-5 py-3 font-semibold">${Number(c.amount).toFixed(2)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      c.status === "paid" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" :
                      c.status === "pending" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" :
                      "bg-gray-100 text-gray-500 dark:bg-gray-800"
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">{c.description ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
