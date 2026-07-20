import { createAdminClient } from "@/lib/supabase/server";
import { Users, Zap, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";
import AgentActions from "./agent-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" /> Agents & Developers
        </h1>
        <Button asChild>
          <Link href="/super-admin/agents/new">
            <Plus className="w-4 h-4" /> Add Agent
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-yellow-500" /> All Agents
            <span className="text-xs text-muted-foreground font-normal">({agents?.length ?? 0})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!agents?.length ? (
            <div className="p-10 text-center text-muted-foreground text-sm">No agents registered yet.</div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">Email</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden xl:table-cell">Company</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden xl:table-cell">Referral Code</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Commission</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden xl:table-cell">Sites</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">Joined</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map(agent => (
                  <tr key={agent.id} className="border-b last:border-0 hover:bg-accent/50 transition-colors align-top">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{agent.full_name}</p>
                        <Link href={`/super-admin/agents/${agent.id}`}
                          className="flex items-center gap-1 text-[10px] text-primary hover:underline mt-0.5">
                          <ExternalLink className="w-2.5 h-2.5" /> View Dashboard
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">{agent.email}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden xl:table-cell">{agent.company ?? "—"}</td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="font-mono text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded">{agent.referral_code}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span>{agent.one_time_pct_override ?? 10}% one-time</span>
                        {agent.is_staff && <span className="text-indigo-500">{agent.staff_recurring_pct ?? 10}% recurring</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs hidden lg:table-cell">
                      <div className="flex flex-col gap-0.5">
                        <Badge variant={agent.commission_type === "one_time" ? "warning" : "info"} className="w-fit">
                          {agent.commission_type === "one_time" ? "One-Time" : "Recurring"}
                        </Badge>
                        {agent.is_staff && <Badge variant="info" className="w-fit">Staff</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs hidden xl:table-cell">{agent.total_sites}</td>
                    <td className="px-4 py-3">
                      <Badge variant={agent.status === "active" ? "success" : agent.status === "suspended" ? "destructive" : "secondary"}>
                        {agent.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">{new Date(agent.created_at).toLocaleDateString()}</td>
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
        </CardContent>
      </Card>
    </div>
  );
}
