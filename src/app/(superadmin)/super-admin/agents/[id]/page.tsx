import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Globe, DollarSign, TrendingUp, Percent, ExternalLink,
  Zap, Link as LinkIcon, Building2, Calendar, CheckCircle, XCircle, Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
const proto = ROOT.includes("localhost") ? "http" : "https";

function StatusBadge({ status }: { status: string }) {
  const variant = status === "active" ? "success" : status === "onboarded" ? "info" : status === "suspended" ? "destructive" : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

type SiteRow = {
  id: string; name: string; slug: string; status: string; plan: string;
  created_at: string; onboarding_completed: boolean;
};

function SiteTable({ sites, empty }: { sites: SiteRow[] | null | undefined; empty: string }) {
  if (!sites?.length) return <p className="text-xs text-muted-foreground px-5 py-6 text-center">{empty}</p>;
  return (
    <div className="overflow-x-auto"><table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          {["Site", "Plan", "Status", "Onboarded", "Created", "Visit"].map(h => (
            <th key={h} className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sites.map(site => (
          <tr key={site.id} className="border-b last:border-0 hover:bg-accent/50 transition-colors">
            <td className="px-4 py-2.5 font-medium">{site.name}</td>
            <td className="px-4 py-2.5 text-muted-foreground text-xs capitalize">{site.plan}</td>
            <td className="px-4 py-2.5"><StatusBadge status={site.status} /></td>
            <td className="px-4 py-2.5 text-xs">
              {site.onboarding_completed
                ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                : <XCircle className="w-3.5 h-3.5 text-muted-foreground" />}
            </td>
            <td className="px-4 py-2.5 text-muted-foreground text-xs">{new Date(site.created_at).toLocaleDateString()}</td>
            <td className="px-4 py-2.5">
              <a href={`${proto}://${site.slug}.${ROOT}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <ExternalLink className="w-3 h-3" /> Visit
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table></div>
  );
}

export default async function SAAgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAdminClient();

  const [{ data: agent }, { data: commissions }] = await Promise.all([
    supabase.from("agents").select("*").eq("id", id).single(),
    supabase.from("agent_commissions").select("*, tenants(name,slug)").eq("agent_id", id).order("created_at", { ascending: false }),
  ]);

  if (!agent) notFound();

  // All sites: assigned or referred
  const [{ data: assigned }, { data: referred }] = await Promise.all([
    supabase.from("tenants").select("id,name,slug,status,plan,created_at,onboarding_completed")
      .eq("assigned_agent_id", id).order("created_at", { ascending: false }),
    supabase.from("tenants").select("id,name,slug,status,plan,created_at,onboarding_completed")
      .eq("referred_by_agent_id", id).order("created_at", { ascending: false }),
  ]);

  const assignedIds = new Set((assigned ?? []).map(s => s.id));
  const referredOnly = (referred ?? []).filter(s => !assignedIds.has(s.id));

  const totalEarned = (commissions ?? []).filter(c => c.status === "paid").reduce((s, c) => s + Number(c.amount), 0);
  const pendingEarned = (commissions ?? []).filter(c => c.status === "pending").reduce((s, c) => s + Number(c.amount), 0);
  const referralUrl = `${proto}://${ROOT}/onboarding?ref=${agent.referral_code}`;

  const stats = [
    { label: "Assigned Sites", value: String(assigned?.length ?? 0), icon: Globe, color: "text-indigo-500 bg-indigo-500/10" },
    { label: "Referred Sites", value: String(referred?.length ?? 0), icon: LinkIcon, color: "text-blue-500 bg-blue-500/10" },
    { label: "Total Earned", value: `$${totalEarned.toFixed(2)}`, icon: DollarSign, color: "text-green-500 bg-green-500/10" },
    { label: "Pending Payout", value: `$${pendingEarned.toFixed(2)}`, icon: TrendingUp, color: "text-amber-500 bg-amber-500/10" },
    { label: "Commission", value: `${agent.commission_rate}%`, icon: Percent, color: "text-yellow-500 bg-yellow-500/10" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/super-admin/agents" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Zap className="w-5 h-5 text-yellow-500" />
        <div>
          <h1 className="text-2xl font-bold">{agent.full_name}</h1>
          <p className="text-xs text-muted-foreground">{agent.email}</p>
        </div>
        <StatusBadge status={agent.status} />
        <Button asChild className="ml-auto">
          <Link href={`/super-admin/sites/new?agentId=${agent.id}&agentName=${encodeURIComponent(agent.full_name)}`}>
            <Plus className="w-4 h-4" /> Create Website
          </Link>
        </Button>
      </div>

      {/* Agent info */}
      <Card>
        <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Referral Code</p>
            <span className="font-mono text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded text-sm">{agent.referral_code}</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Commission</p>
            <p>{agent.commission_rate}% · {agent.commission_type === "one_time" ? "One-Time" : "Recurring"}</p>
          </div>
          {agent.company && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Company</p>
              <p className="flex items-center gap-1"><Building2 className="w-3 h-3" />{agent.company}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Member Since</p>
            <p className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(agent.created_at).toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Referral link */}
      <Card>
        <CardContent className="pt-6 space-y-1.5">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Referral Link</p>
          <code className="block text-sm text-primary font-mono bg-muted rounded px-3 py-2 truncate">{referralUrl}</code>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 space-y-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assigned sites */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b py-3.5">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" /> Assigned Sites
            <span className="text-xs text-muted-foreground font-normal">({assigned?.length ?? 0})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <SiteTable sites={assigned} empty="No sites assigned." />
        </CardContent>
      </Card>

      {/* Referred sites */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b py-3.5">
          <CardTitle className="text-sm flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-blue-500" /> Referred Sites
            <span className="text-xs text-muted-foreground font-normal">({referredOnly.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <SiteTable sites={referredOnly} empty="No referrals yet." />
        </CardContent>
      </Card>

      {/* Commissions ledger */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b py-3.5">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-500" /> Commission Ledger
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!commissions?.length ? (
            <p className="text-xs text-muted-foreground px-5 py-6 text-center">No commissions recorded.</p>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {["Site", "Amount", "Status", "Description", "Date"].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commissions.map(c => {
                  const t = (Array.isArray(c.tenants) ? c.tenants[0] : c.tenants) as { name: string; slug: string } | null;
                  return (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{t?.name ?? "—"}</td>
                      <td className="px-4 py-2.5 font-medium">${Number(c.amount).toFixed(2)}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={c.status === "paid" ? "success" : c.status === "pending" ? "warning" : "secondary"}>{c.status}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{c.description ?? "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
          )}
        </CardContent>
      </Card>

      {agent.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Internal Notes</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm whitespace-pre-wrap">{agent.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
