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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

  function statusVariant(status: string) {
    if (status === "active") return "success" as const;
    if (status === "trial") return "warning" as const;
    if (status === "suspended") return "destructive" as const;
    return "secondary" as const;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/super-admin/sites" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Globe className="w-5 h-5 text-blue-400" />
        <h1 className="text-2xl font-bold">{site.name}</h1>
        <Badge variant={statusVariant(site.status)}>{site.status}</Badge>
      </div>

      {/* Deletion requested warning */}
      {site.deletion_requested_at && (
        <Card className="border-amber-800 bg-amber-950/40">
          <CardContent className="p-4 text-sm text-amber-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-400">Site owner requested deletion</p>
              <p className="text-xs mt-0.5">
                Requested on {new Date(site.deletion_requested_at).toLocaleString()}. Contact the owner via
                Team Members below before deleting.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button asChild>
          <a href={`/api/super-admin/impersonate?tenant_id=${site.id}`}>
            <LayoutDashboard className="w-4 h-4" />
            Browse as Super Admin
          </a>
        </Button>
        {site.slug && (
          <Button variant="secondary" asChild>
            <a href={`https://${site.slug}.passivecoder.com`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
              Visit Site
            </a>
          </Button>
        )}
        <DeleteSiteButton siteId={site.id} siteName={site.name} />
      </div>

      {/* Site info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Settings className="w-4 h-4 text-muted-foreground" /> Site Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Slug</p>
              <p className="font-mono">{site.slug}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Custom Domain</p>
              <p>{site.custom_domain ?? <span className="text-muted-foreground">None</span>}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Onboarding</p>
              <p className={site.onboarding_completed ? "text-green-400" : "text-amber-400"}>
                {site.onboarding_completed ? "Completed" : "Pending"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Created</p>
              <p>{new Date(site.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Plan</p>
              <p className="capitalize">{site.plan ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Tenant ID</p>
              <p className="text-muted-foreground font-mono text-xs">{site.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><CreditCard className="w-4 h-4 text-muted-foreground" /> Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Plan</p>
                <p className="capitalize">{subscription.plan_id ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                <Badge variant={statusVariant(subscription.status)}>{subscription.status}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Amount</p>
                <p>
                  {subscription.amount_cents ? `$${(subscription.amount_cents / 100).toFixed(2)}/yr` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Period End</p>
                <p>
                  {subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() :
                   subscription.trial_ends_at ? new Date(subscription.trial_ends_at).toLocaleDateString() : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Provider</p>
                <p className="capitalize">{subscription.payment_provider ?? "Manual"}</p>
              </div>
            </div>
            <div className="pt-1">
              <Link href={`/super-admin/subscriptions?tenant=${site.id}`} className="text-xs text-indigo-400 hover:text-indigo-300">
                Manage subscription →
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assigned Agent */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> Assigned Agent</CardTitle>
        </CardHeader>
        <CardContent>
          <AssignAgent
            siteId={site.id}
            currentAgentId={site.assigned_agent_id ?? null}
            agents={agents ?? []}
          />
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" /> Team Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
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
                      <p>{profile?.full_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{profile?.email}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">{m.role}</Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No members found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
