import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Globe, ArrowLeft, ExternalLink, LayoutDashboard,
  CreditCard, Users, Settings, Zap, AlertTriangle,
} from "lucide-react";
import AssignAgent from "./assign-agent";
import AssignOwner from "./assign-owner";
import DeleteSiteButton from "./delete-site-button";

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAdminClient();

  const [{ data: site }, { data: subscription }, { data: members }, { data: agents }] = await Promise.all([
    supabase.from("tenants").select("*").eq("id", id).single(),
    supabase.from("subscriptions").select("*").eq("tenant_id", id).order("created_at", { ascending: false }).limit(1).single(),
    supabase.from("tenant_members").select("user_id, role, profiles(full_name, email)").eq("tenant_id", id).limit(20),
    supabase.from("agents").select("id, full_name, email, referral_code").eq("status", "active").order("full_name"),
  ]);

  if (!site) notFound();

  const STATUS_COLOR: Record<string, string> = {
    active: "bg-green-900/50 text-green-400",
    trial: "bg-amber-900/50 text-amber-400",
    suspended: "bg-red-900/50 text-red-400",
    cancelled: "bg-gray-800 text-gray-400",
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/super-admin/sites" className="text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Globe className="w-5 h-5 text-blue-400" />
        <h1 className="text-2xl font-bold text-white">{site.name}</h1>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[site.status] ?? STATUS_COLOR.cancelled}`}>
          {site.status}
        </span>
      </div>

      {/* Deletion requested warning */}
      {site.deletion_requested_at && (
        <div className="bg-amber-950/40 border border-amber-800 rounded-xl p-4 text-sm text-amber-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-400">Site owner requested deletion</p>
            <p className="text-xs mt-0.5">
              Requested on {new Date(site.deletion_requested_at).toLocaleString()}. Contact the owner via
              Team Members below before deleting.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <a
          href={`/api/super-admin/impersonate?tenant_id=${site.id}`}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" />
          Browse as Super Admin
        </a>
        {site.slug && (
          <a
            href={`https://${site.slug}.passivecoder.com`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Visit Site
          </a>
        )}
        <DeleteSiteButton siteId={site.id} siteName={site.name} />
      </div>

      {/* Site info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Settings className="w-4 h-4 text-gray-400" /> Site Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Slug</p>
            <p className="text-gray-200 font-mono">{site.slug}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Custom Domain</p>
            <p className="text-gray-200">{site.custom_domain ?? <span className="text-gray-600">None</span>}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Onboarding</p>
            <p className={site.onboarding_completed ? "text-green-400" : "text-amber-400"}>
              {site.onboarding_completed ? "Completed" : "Pending"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Created</p>
            <p className="text-gray-200">{new Date(site.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Plan</p>
            <p className="text-gray-200 capitalize">{site.plan ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Tenant ID</p>
            <p className="text-gray-500 font-mono text-xs">{site.id}</p>
          </div>
        </div>
      </div>

      {/* Subscription */}
      {subscription && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2"><CreditCard className="w-4 h-4 text-gray-400" /> Subscription</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Plan</p>
              <p className="text-gray-200 capitalize">{subscription.plan_id ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Status</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[subscription.status] ?? STATUS_COLOR.cancelled}`}>
                {subscription.status}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Amount</p>
              <p className="text-gray-200">
                {subscription.amount_cents ? `$${(subscription.amount_cents / 100).toFixed(2)}/yr` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Period End</p>
              <p className="text-gray-200">
                {subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() :
                 subscription.trial_ends_at ? new Date(subscription.trial_ends_at).toLocaleDateString() : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Provider</p>
              <p className="text-gray-200 capitalize">{subscription.payment_provider ?? "Manual"}</p>
            </div>
          </div>
          <div className="pt-1">
            <Link href={`/super-admin/subscriptions?tenant=${site.id}`} className="text-xs text-indigo-400 hover:text-indigo-300">
              Manage subscription →
            </Link>
          </div>
        </div>
      )}

      {/* Assigned Agent */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> Assigned Agent</h2>
        <AssignAgent
          siteId={site.id}
          currentAgentId={site.assigned_agent_id ?? null}
          agents={agents ?? []}
        />
      </div>

      {/* Members */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" /> Team Members</h2>
        <p className="text-xs text-gray-500">
          Assign an existing user as owner by email. This grants them dashboard access
          to this site (via tenant_members) and updates the site&apos;s owner record —
          the site will then show up in their site switcher.
        </p>
        <AssignOwner siteId={site.id} />
        {members?.length ? (
          <div className="space-y-2">
            {members.map(m => {
              const profile = (Array.isArray(m.profiles) ? m.profiles[0] : m.profiles) as { full_name: string | null; email: string } | null;
              return (
                <div key={m.user_id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-gray-200">{profile?.full_name ?? "—"}</p>
                    <p className="text-xs text-gray-500">{profile?.email}</p>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded capitalize">{m.role}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-600">No members found.</p>
        )}
      </div>
    </div>
  );
}
