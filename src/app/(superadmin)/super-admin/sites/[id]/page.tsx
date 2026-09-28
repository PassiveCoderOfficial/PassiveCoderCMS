import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Globe, ArrowLeft, ExternalLink, LayoutDashboard,
  CreditCard, Users, Settings, Zap, AlertTriangle, LayoutTemplate,
} from "lucide-react";
import AssignAgent from "./assign-agent";
import AssignOwner from "./assign-owner";
import { TransferSiteDialog } from "@/components/admin/transfer-site-dialog";
import DeleteSiteButton from "./delete-site-button";
import AiCreditsCard from "./ai-credits-card";
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
    supabase.from("pc_staff").select("id, full_name, email, referral_code").eq("status", "active").order("full_name"),
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
        {/* Snapshots this site (pages, colours, nav, footer) into a new
            reusable template. Read-only for the site itself. */}
        <Button variant="secondary" asChild>
          <Link href={`/super-admin/my-templates/new?from=${site.id}`}>
            <LayoutTemplate className="w-4 h-4" />
            Save as Template
          </Link>
        </Button>
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

      {/* Billing — always shown. It used to render only when a subscription
          existed, so sites with none (plan set by hand) were never flagged. */}
      <Card className={!subscription ? "border-red-500/40" : undefined}>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><CreditCard className="w-4 h-4 text-muted-foreground" /> Billing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!subscription ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div className="text-sm">
                <p className="font-medium text-red-600">This site isn&apos;t billed</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  It&apos;s on the <span className="capitalize font-medium">{site.plan ?? "—"}</span> plan but has no subscription, so no invoices, payment reminders or non-payment pause apply.
                </p>
              </div>
              <Button asChild size="sm">
                <Link href={`/super-admin/subscriptions/new?tenant=${site.id}&plan=${site.plan ?? ""}`}>Set up billing</Link>
              </Button>
            </div>
          ) : (
            <>
              {subscription.plan_id !== site.plan && (
                <p className="text-xs rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 px-3 py-2">
                  The site runs on <b className="capitalize">{site.plan}</b> but the subscription is for <b className="capitalize">{subscription.plan_id}</b>. Saving the subscription sets the site to the subscription&apos;s plan.
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Plan</p>
                  <p className="capitalize">{subscription.plan_id ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                  <Badge variant={statusVariant(subscription.status)}>{subscription.status}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Price</p>
                  <p>
                    {(() => {
                      const cents = subscription.custom_amount_cents ?? subscription.amount_cents;
                      if (!cents) return "—";
                      const cur = subscription.currency === "BDT" ? "৳" : "$";
                      const cyc = subscription.billing_cycle === "monthly" ? "/month" : subscription.billing_cycle === "lifetime" ? " one-time" : "/year";
                      return `${cur}${(cents / 100).toLocaleString()}${cyc}`;
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Next payment due</p>
                  <p>
                    {subscription.next_payment_due ? new Date(subscription.next_payment_due).toLocaleDateString()
                      : subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString()
                      : <span className="text-amber-600">Not set</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Paid by</p>
                  <p className="capitalize">{subscription.payment_provider ?? "manual"}</p>
                </div>
              </div>
              <div className="pt-1">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/super-admin/subscriptions/${subscription.id}/edit`}>Edit billing &amp; payments</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AiCreditsCard siteId={site.id} />

      {/* Assigned Staff */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> Assigned Staff</CardTitle>
        </CardHeader>
        <CardContent>
          <AssignAgent
            siteId={site.id}
            currentAgentId={site.assigned_staff_id ?? null}
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
            Hand this site over to the client. Use Transfer when the client is taking
            ownership — it can create their account with a password so they can sign in
            straight away. Assign Owner below is the older path and only works for an
            email that already has an account.
          </p>
          <TransferSiteDialog tenantId={site.id} siteName={site.name} />
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
