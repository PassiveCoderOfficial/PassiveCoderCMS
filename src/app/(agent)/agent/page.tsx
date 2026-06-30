import { requireAgent } from "@/lib/agent";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Globe, DollarSign, TrendingUp, Percent } from "lucide-react";
import { CopyButton } from "./copy-button";

export default async function AgentDashboardPage() {
  const agent = await requireAgent();
  if (!agent) redirect("/login");

  const supabase = await createAdminClient();

  const [{ data: sites }, { data: commissions }] = await Promise.all([
    supabase.from("tenants").select("id,name,slug,status,created_at").eq("referred_by_agent_id", agent.id).order("created_at", { ascending: false }),
    supabase.from("agent_commissions").select("amount,status").eq("agent_id", agent.id),
  ]);

  const totalEarned = (commissions ?? []).filter(c => c.status === "paid").reduce((s, c) => s + Number(c.amount), 0);
  const pendingEarned = (commissions ?? []).filter(c => c.status === "pending").reduce((s, c) => s + Number(c.amount), 0);
  const siteCount = sites?.length ?? 0;
  const referralUrl = `${process.env.NEXT_PUBLIC_ROOT_DOMAIN?.includes("localhost") ? "http" : "https"}://${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com"}/onboarding?ref=${agent.referral_code}`;
  const commissionTypeLabel = (agent as { commission_type?: string }).commission_type === "one_time" ? "One-Time" : "Recurring";

  const stats = [
    { label: "Sites Referred", value: String(siteCount), icon: Globe, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
    { label: "Total Earned", value: `$${totalEarned.toFixed(2)}`, icon: DollarSign, color: "text-green-600 bg-green-50 dark:bg-green-900/20" },
    { label: "Pending Payout", value: `$${pendingEarned.toFixed(2)}`, icon: TrendingUp, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
    { label: "Commission", value: `${agent.commission_rate}% · ${commissionTypeLabel}`, icon: Percent, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Staff Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back, {agent.full_name}</p>
      </div>

      {/* Referral Link */}
      <div className="rounded-xl border bg-card p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your Referral Link</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm bg-muted rounded px-3 py-2 font-mono truncate">{referralUrl}</code>
          <CopyButton text={referralUrl} />
        </div>
        <p className="text-xs text-muted-foreground">Share this link. Every site created through it is credited to you.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="rounded-xl border bg-card p-4 space-y-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold leading-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Sites */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-sm">Recently Referred Sites</h2>
        </div>
        {!sites?.length ? (
          <div className="p-10 text-center text-muted-foreground text-sm">
            No sites referred yet. Share your referral link to get started.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {["Site", "Status", "Referred"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sites.slice(0, 10).map(site => (
                <tr key={site.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-5 py-3 font-medium">{site.name}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      site.status === "active" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" :
                      site.status === "onboarded" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" :
                      "bg-gray-100 text-gray-500 dark:bg-gray-800"
                    }`}>
                      {site.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">{new Date(site.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
