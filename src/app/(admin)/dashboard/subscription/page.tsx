"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CreditCard, Plus, ExternalLink, CheckCircle, Clock, AlertCircle, Loader2, Zap, Star, BadgePercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  amount_cents: number | null;
  currency: string | null;
  payment_provider: string | null;
  tenant_id: string;
  tenants: { name: string; slug: string } | null;
}

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: string[];
  is_popular: boolean;
}

interface Agent {
  id: string;
  referral_code: string;
  commission_rate: number;
  status: string;
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  trial:    { color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400", icon: <Clock className="w-3.5 h-3.5" />, label: "Free Trial" },
  active:   { color: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400", icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Active" },
  past_due: { color: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400", icon: <AlertCircle className="w-3.5 h-3.5" />, label: "Past Due" },
  cancelled:{ color: "text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400", icon: null, label: "Cancelled" },
};

export default function SubscriptionPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: memberships }, { data: agentRow }, { data: plansData }, { data: saRow }] = await Promise.all([
        supabase.from("tenant_members").select("tenant_id").eq("user_id", user.id),
        supabase.from("agents").select("id,referral_code,commission_rate,status").eq("user_id", user.id).maybeSingle(),
        supabase.from("plans").select("*").order("sort_order"),
        supabase.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
      ]);

      setAgent(agentRow);
      setPlans((plansData as Plan[]) ?? []);
      setIsSuperAdmin(!!saRow);

      if (!memberships?.length) { setLoading(false); return; }
      const { data } = await supabase
        .from("subscriptions")
        .select("*, tenants(name, slug)")
        .in("tenant_id", memberships.map(m => m.tenant_id))
        .order("created_at", { ascending: false });

      setSubs((data as Subscription[]) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const discountPct = agent ? agent.commission_rate : 0;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscription</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your site plan and billing.</p>
        </div>
        <Link href="/onboarding">
          <Button className="flex items-center gap-2"><Plus className="w-4 h-4" /> Add Site</Button>
        </Link>
      </div>

      {/* Agent / Super Admin badge */}
      {(agent || isSuperAdmin) && (
        <div className={cn("rounded-xl border p-4 flex items-start gap-3", agent ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800" : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700")}>
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", agent ? "bg-indigo-600" : "bg-gray-700")}>
            {agent ? <Zap className="w-5 h-5 text-white" /> : <Star className="w-5 h-5 text-white" />}
          </div>
          <div className="flex-1">
            {isSuperAdmin && !agent && (
              <>
                <p className="font-bold text-sm">Super Admin Account</p>
                <p className="text-xs text-muted-foreground mt-0.5">You have full platform access. Your site subscription is managed separately.</p>
              </>
            )}
            {agent && (
              <>
                <p className="font-bold text-sm">Agent Account</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your referral code: <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{agent.referral_code}</span>
                </p>
                {discountPct > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 font-medium">
                    <BadgePercent className="w-3.5 h-3.5" />
                    You get <strong>{discountPct}% recurring discount</strong> on your own site subscriptions — same as your commission rate.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {subs.length === 0 ? (
        <NoSubscription plans={plans} discountPct={discountPct} />
      ) : (
        <div className="space-y-3">
          {subs.map(sub => <SubCard key={sub.id} sub={sub} plans={plans} discountPct={discountPct} />)}
        </div>
      )}

      <div className="rounded-xl border border-dashed p-6 text-center space-y-3">
        <Plus className="w-8 h-8 text-muted-foreground mx-auto" />
        <p className="font-semibold">Add another site</p>
        <p className="text-sm text-muted-foreground">Each site gets its own subscription.</p>
        <Link href="/onboarding"><Button variant="outline">Start Onboarding</Button></Link>
      </div>
    </div>
  );
}

function SubCard({ sub, plans, discountPct }: { sub: Subscription; plans: Plan[]; discountPct: number }) {
  const cfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.cancelled;
  const tenant = sub.tenants;
  const renewDate = sub.current_period_end ?? sub.trial_ends_at;
  const plan = plans.find(p => p.id === sub.plan_id || p.name.toLowerCase() === sub.plan_id);

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-bold">{tenant?.name ?? "Unnamed Site"}</p>
            <p className="text-xs text-muted-foreground">{tenant?.slug}.passivecoder.com</p>
          </div>
        </div>
        <span className={cn("flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full", cfg.color)}>
          {cfg.icon}{cfg.label}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Plan</p>
          <p className="font-medium capitalize">{plan?.name ?? sub.plan_id ?? "Unset"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Amount</p>
          <div>
            {sub.amount_cents ? (
              <>
                <p className="font-medium">{sub.currency?.toUpperCase() ?? "USD"} {(sub.amount_cents / 100).toFixed(2)}/yr</p>
                {discountPct > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400">−{discountPct}% agent discount</p>
                )}
              </>
            ) : (
              <p className="font-medium text-muted-foreground">Unset</p>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{sub.status === "trial" ? "Trial ends" : "Renews"}</p>
          <p className="font-medium">{renewDate ? new Date(renewDate).toLocaleDateString() : "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Provider</p>
          <p className="font-medium capitalize">{sub.payment_provider ?? "Manual"}</p>
        </div>
      </div>

      {/* Plan features */}
      {plan?.features && plan.features.length > 0 && (
        <div className="rounded-lg bg-muted/40 p-3 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{plan.name} Plan includes</p>
          <div className="grid grid-cols-2 gap-1">
            {plan.features.slice(0, 6).map((f, i) => (
              <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />{f}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* No plan set */}
      {!plan && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-400">
          <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
          No plan set for this site. Contact support or upgrade to activate a plan.
        </div>
      )}

      {sub.status === "trial" && renewDate && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
          <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Trial expires {new Date(renewDate).toLocaleDateString()}. Upgrade to keep your site live.
        </div>
      )}

      <div className="flex gap-2 pt-1">
        {tenant?.slug && (
          <a href={`https://${tenant.slug}.passivecoder.com`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" /> Visit Site
            </Button>
          </a>
        )}
        {sub.status !== "active" && (
          <Button size="sm" className="flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" /> Upgrade Plan
          </Button>
        )}
      </div>
    </div>
  );
}

function NoSubscription({ plans, discountPct }: { plans: Plan[]; discountPct: number }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/30 p-8 text-center space-y-3">
        <CreditCard className="w-10 h-10 text-muted-foreground mx-auto" />
        <p className="font-semibold">No active subscription</p>
        <p className="text-sm text-muted-foreground">Your site is on a free trial or has no plan assigned yet.</p>
        {discountPct > 0 && (
          <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center justify-center gap-1">
            <BadgePercent className="w-4 h-4" /> As an agent, you get {discountPct}% off any plan
          </p>
        )}
      </div>
      {plans.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div key={plan.id} className={cn("rounded-xl border p-5 space-y-3 relative", plan.is_popular ? "border-primary" : "")}>
              {plan.is_popular && (
                <span className="absolute -top-2.5 left-4 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full">Popular</span>
              )}
              <p className="font-bold">{plan.name}</p>
              <div>
                <p className="text-2xl font-black">
                  {plan.currency} {discountPct > 0 ? (plan.price_yearly * (1 - discountPct / 100)).toFixed(2) : plan.price_yearly.toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground">/yr</span>
                </p>
                {discountPct > 0 && (
                  <p className="text-xs text-muted-foreground line-through">{plan.currency} {plan.price_yearly.toFixed(2)}</p>
                )}
              </div>
              {plan.features?.slice(0, 5).map((f, i) => (
                <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />{f}
                </p>
              ))}
              <Button size="sm" className="w-full" variant={plan.is_popular ? "default" : "outline"}>
                Choose {plan.name}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
