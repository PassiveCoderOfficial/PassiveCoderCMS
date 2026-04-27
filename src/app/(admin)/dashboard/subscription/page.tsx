"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CreditCard, Plus, ExternalLink, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
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

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  trial:    { color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400", icon: <Clock className="w-3.5 h-3.5" />, label: "Free Trial" },
  active:   { color: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400", icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Active" },
  past_due: { color: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400", icon: <AlertCircle className="w-3.5 h-3.5" />, label: "Past Due" },
  cancelled:{ color: "text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400", icon: null, label: "Cancelled" },
};

export default function SubscriptionPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberships } = await supabase
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", user.id);

      if (!memberships?.length) { setLoading(false); return; }

      const tenantIds = memberships.map(m => m.tenant_id);
      const { data } = await supabase
        .from("subscriptions")
        .select("*, tenants(name, slug)")
        .in("tenant_id", tenantIds)
        .order("created_at", { ascending: false });

      setSubs((data as Subscription[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your site subscriptions and billing.</p>
        </div>
        <Link href="/onboarding">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Another Site
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : subs.length === 0 ? (
        <div className="rounded-xl border bg-muted/30 p-12 text-center space-y-4">
          <CreditCard className="w-10 h-10 text-muted-foreground mx-auto" />
          <div>
            <p className="font-semibold">No subscriptions found</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first site to get started.</p>
          </div>
          <Link href="/onboarding"><Button>Get Started</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {subs.map(sub => {
            const cfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.cancelled;
            const tenant = sub.tenants;
            const renewDate = sub.current_period_end ?? sub.trial_ends_at;
            return (
              <div key={sub.id} className="rounded-xl border bg-card p-5 space-y-4">
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
                    <p className="font-medium capitalize">{sub.plan_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-medium">{sub.amount_cents ? `${sub.currency?.toUpperCase() ?? "USD"} ${(sub.amount_cents / 100).toFixed(2)}/yr` : "—"}</p>
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

                {sub.status === "trial" && renewDate && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    Trial expires {new Date(renewDate).toLocaleDateString()}. Upgrade to keep your site live.
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <a href={`http://${tenant?.slug}.passivecoder.com`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" /> Visit Site
                    </Button>
                  </a>
                  {sub.status !== "active" && (
                    <Button size="sm" className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" /> Upgrade Plan
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add site CTA */}
      <div className="rounded-xl border border-dashed p-6 text-center space-y-3">
        <Plus className="w-8 h-8 text-muted-foreground mx-auto" />
        <div>
          <p className="font-semibold">Add another site</p>
          <p className="text-sm text-muted-foreground mt-1">Each site gets its own subscription and dashboard.</p>
        </div>
        <Link href="/onboarding"><Button variant="outline">Start Onboarding</Button></Link>
      </div>
    </div>
  );
}
