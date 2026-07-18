import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Globe, DollarSign, TrendingUp, Percent, ExternalLink,
  Zap, Link as LinkIcon, Building2, Calendar, CheckCircle, XCircle, Plus,
} from "lucide-react";

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
const proto = ROOT.includes("localhost") ? "http" : "https";

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "active"    ? "bg-green-900/40 text-green-400" :
    status === "onboarded" ? "bg-blue-900/40 text-blue-400" :
    status === "suspended" ? "bg-red-900/40 text-red-400" :
    "bg-gray-800 text-gray-400";
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{status}</span>;
}

type SiteRow = {
  id: string; name: string; slug: string; status: string; plan: string;
  created_at: string; onboarding_completed: boolean;
};

function SiteTable({ sites, empty }: { sites: SiteRow[] | null | undefined; empty: string }) {
  if (!sites?.length) return <p className="text-xs text-gray-600 px-5 py-6 text-center">{empty}</p>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-800">
          {["Site", "Plan", "Status", "Onboarded", "Created", "Visit"].map(h => (
            <th key={h} className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sites.map(site => (
          <tr key={site.id} className="border-b border-gray-800/40 hover:bg-gray-800/20">
            <td className="px-4 py-2.5 text-white font-medium">{site.name}</td>
            <td className="px-4 py-2.5 text-gray-400 text-xs capitalize">{site.plan}</td>
            <td className="px-4 py-2.5"><StatusBadge status={site.status} /></td>
            <td className="px-4 py-2.5 text-xs">
              {site.onboarding_completed
                ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                : <XCircle className="w-3.5 h-3.5 text-gray-600" />}
            </td>
            <td className="px-4 py-2.5 text-gray-500 text-xs">{new Date(site.created_at).toLocaleDateString()}</td>
            <td className="px-4 py-2.5">
              <a href={`${proto}://${site.slug}.${ROOT}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                <ExternalLink className="w-3 h-3" /> Visit
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
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
    { label: "Assigned Sites", value: String(assigned?.length ?? 0), icon: Globe, color: "text-indigo-400 bg-indigo-900/20" },
    { label: "Referred Sites", value: String(referred?.length ?? 0), icon: LinkIcon, color: "text-blue-400 bg-blue-900/20" },
    { label: "Total Earned", value: `$${totalEarned.toFixed(2)}`, icon: DollarSign, color: "text-green-400 bg-green-900/20" },
    { label: "Pending Payout", value: `$${pendingEarned.toFixed(2)}`, icon: TrendingUp, color: "text-amber-400 bg-amber-900/20" },
    { label: "Commission", value: `${agent.commission_rate}%`, icon: Percent, color: "text-yellow-400 bg-yellow-900/20" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/super-admin/agents" className="text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Zap className="w-5 h-5 text-yellow-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">{agent.full_name}</h1>
          <p className="text-xs text-gray-500">{agent.email}</p>
        </div>
        <StatusBadge status={agent.status} />
        <Link
          href={`/super-admin/sites/new?agentId=${agent.id}&agentName=${encodeURIComponent(agent.full_name)}`}
          className="ml-auto flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Website
        </Link>
      </div>

      {/* Agent info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Referral Code</p>
          <span className="font-mono text-yellow-400 bg-yellow-900/20 px-2 py-0.5 rounded text-sm">{agent.referral_code}</span>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Commission</p>
          <p className="text-white">{agent.commission_rate}% · {agent.commission_type === "one_time" ? "One-Time" : "Recurring"}</p>
        </div>
        {agent.company && (
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Company</p>
            <p className="text-gray-300 flex items-center gap-1"><Building2 className="w-3 h-3" />{agent.company}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Member Since</p>
          <p className="text-gray-300 flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(agent.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Referral link */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-1.5">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Referral Link</p>
        <code className="block text-sm text-indigo-300 font-mono bg-gray-800 rounded px-3 py-2 truncate">{referralUrl}</code>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-white leading-tight">{s.value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Assigned sites */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-800 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <h2 className="font-semibold text-white text-sm">Assigned Sites</h2>
          <span className="text-xs text-gray-500">({assigned?.length ?? 0})</span>
        </div>
        <SiteTable sites={assigned} empty="No sites assigned." />
      </div>

      {/* Referred sites */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-800 flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-blue-400" />
          <h2 className="font-semibold text-white text-sm">Referred Sites</h2>
          <span className="text-xs text-gray-500">({referredOnly.length})</span>
        </div>
        <SiteTable sites={referredOnly} empty="No referrals yet." />
      </div>

      {/* Commissions ledger */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-800 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-400" />
          <h2 className="font-semibold text-white text-sm">Commission Ledger</h2>
        </div>
        {!commissions?.length ? (
          <p className="text-xs text-gray-600 px-5 py-6 text-center">No commissions recorded.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {["Site", "Amount", "Status", "Description", "Date"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commissions.map(c => {
                const t = (Array.isArray(c.tenants) ? c.tenants[0] : c.tenants) as { name: string; slug: string } | null;
                return (
                  <tr key={c.id} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                    <td className="px-4 py-2.5 text-gray-300 text-xs">{t?.name ?? "—"}</td>
                    <td className="px-4 py-2.5 text-white font-medium">${Number(c.amount).toFixed(2)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        c.status === "paid" ? "bg-green-900/40 text-green-400" :
                        c.status === "pending" ? "bg-amber-900/40 text-amber-400" :
                        "bg-gray-800 text-gray-400"
                      }`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{c.description ?? "—"}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {agent.notes && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Internal Notes</p>
          <p className="text-gray-300 text-sm whitespace-pre-wrap">{agent.notes}</p>
        </div>
      )}
    </div>
  );
}
