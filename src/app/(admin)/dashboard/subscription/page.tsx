"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CreditCard, Plus, ExternalLink, CheckCircle, Clock, AlertCircle, Loader2, Zap, Star, BadgePercent, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CheckoutDialog, type CheckoutPlan, type PaymentConfig } from "./checkout-dialog";
import { CurrencyToggle } from "@/components/ui/currency-toggle";
import { useCurrencyRate, formatPrice, type Currency } from "@/lib/hooks/use-currency";

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  amount_cents: number | null;
  currency: string | null;
  payment_provider: string | null;
  billing_cycle: string | null;
  tenant_id: string;
  total_billed_cents: number | null;
  total_paid_cents: number | null;
  balance_due_cents: number | null;
  tenants: { name: string; slug: string } | null;
}

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  price_monthly_bdt: number | null;
  price_yearly_bdt: number | null;
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
  onboarded: { color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",   icon: <Clock className="w-3.5 h-3.5" />, label: "Onboarded" },
  pending:   { color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400", icon: <Clock className="w-3.5 h-3.5" />, label: "Pending Payment" },
  active:    { color: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400", icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Active" },
  past_due:  { color: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",         icon: <AlertCircle className="w-3.5 h-3.5" />, label: "Past Due" },
  suspended: { color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400", icon: <AlertCircle className="w-3.5 h-3.5" />, label: "Suspended" },
  cancelled: { color: "text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400",       icon: null, label: "Cancelled" },
  expired:   { color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400", icon: <Clock className="w-3.5 h-3.5" />, label: "Expired" },
};

export default function SubscriptionPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({});
  const [checkout, setCheckout] = useState<{ tenantId: string; plan: CheckoutPlan } | null>(null);
  const [primaryTenantId, setPrimaryTenantId] = useState<string | null>(null);
  const [isSuspended, setIsSuspended] = useState(false);
  const [currency, setCurrency] = useState<Currency>("USD");
  const bdtRate = useCurrencyRate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("suspended")) setIsSuspended(true);
    if (params.get("paid")) toast.success("Payment successful — your plan is now active!");
    else if (params.get("cancelled")) toast.info("Payment cancelled.");
    else if (params.get("error")) toast.error(`Payment issue: ${params.get("error")}`);
  }, []);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: memberships }, { data: agentRow }, { data: plansData }, { data: saRow }, { data: cfg }] = await Promise.all([
        supabase.from("tenant_members").select("tenant_id").eq("user_id", user.id),
        supabase.from("agents").select("id,referral_code,commission_rate,status").eq("user_id", user.id).maybeSingle(),
        supabase.from("plans").select("*").order("sort_order"),
        supabase.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
        supabase.from("platform_settings").select("bkash_number,nagad_number,bank_details,manual_payment_instructions,whatsapp_number").eq("id", 1).maybeSingle(),
      ]);

      setAgent(agentRow);
      setPlans((plansData as Plan[]) ?? []);
      setIsSuperAdmin(!!saRow);
      setPaymentConfig((cfg as PaymentConfig) ?? {});

      if (!memberships?.length) { setLoading(false); return; }
      setPrimaryTenantId(memberships[0].tenant_id);
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
      {isSuspended && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">Your site has been suspended</p>
            <p className="text-sm text-red-600 dark:text-red-500 mt-0.5">Your site has been suspended. Choose a plan below to reactivate.</p>
          </div>
        </div>
      )}
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

      <div className="flex justify-end">
        <CurrencyToggle currency={currency} onChange={setCurrency} />
      </div>

      {subs.length === 0 ? (
        <NoSubscription
          plans={plans}
          discountPct={discountPct}
          currency={currency}
          bdtRate={bdtRate}
          onChoose={primaryTenantId ? (plan) => setCheckout({ tenantId: primaryTenantId, plan }) : undefined}
        />
      ) : (
        <div className="space-y-3">
          {subs.map(sub => (
            <SubCard
              key={sub.id}
              sub={sub}
              plans={plans}
              discountPct={discountPct}
              currency={currency}
              bdtRate={bdtRate}
              onChoose={(plan) => setCheckout({ tenantId: sub.tenant_id, plan })}
            />
          ))}
        </div>
      )}

      <CheckoutDialog
        open={!!checkout}
        onOpenChange={(v) => { if (!v) setCheckout(null); }}
        tenantId={checkout?.tenantId ?? ""}
        plan={checkout?.plan ?? null}
        plans={plans.filter(p => (p.price_yearly ?? 0) > 0).map(p => ({
          id: p.id, name: p.name, price_yearly: p.price_yearly, price_monthly: p.price_monthly,
          price_yearly_bdt: p.price_yearly_bdt, price_monthly_bdt: p.price_monthly_bdt, currency: p.currency, is_popular: p.is_popular,
        }))}
        paymentConfig={paymentConfig}
      />

      <div className="rounded-xl border border-dashed p-6 text-center space-y-3">
        <Plus className="w-8 h-8 text-muted-foreground mx-auto" />
        <p className="font-semibold">Add another site</p>
        <p className="text-sm text-muted-foreground">Each site gets its own subscription.</p>
        <Link href="/onboarding"><Button variant="outline">Start Onboarding</Button></Link>
      </div>
    </div>
  );
}

function SubCard({ sub, plans, discountPct, currency, bdtRate, onChoose }: { sub: Subscription; plans: Plan[]; discountPct: number; currency: Currency; bdtRate: number; onChoose: (plan: CheckoutPlan) => void }) {
  const cfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.cancelled;
  const tenant = sub.tenants;
  const renewDate = sub.current_period_end ?? sub.trial_ends_at;
  const plan = plans.find(p => p.id === sub.plan_id || p.name.toLowerCase() === sub.plan_id);

  const cycle = sub.billing_cycle === "monthly" ? "monthly" : "yearly";
  const cycleSuffix = cycle === "monthly" ? "/mo" : "/yr";
  const planUsd = plan ? (cycle === "monthly" ? (plan.price_monthly ?? 0) : plan.price_yearly) / 100 : 0;
  const planBdt = plan ? (cycle === "monthly" ? plan.price_monthly_bdt : plan.price_yearly_bdt) : null;
  const amountStr = plan
    ? formatPrice(planUsd * (1 - discountPct / 100), planBdt != null ? Math.round(planBdt * (1 - discountPct / 100)) : null, currency, bdtRate)
    : null;

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
            {amountStr ? (
              <>
                <p className="font-medium">{amountStr}{cycleSuffix}</p>
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
          <p className="text-xs text-muted-foreground">{sub.status === "onboarded" || sub.status === "pending" ? "Due" : "Renews"}</p>
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

      {(sub.status === "onboarded" || sub.status === "pending") && renewDate && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
          <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Payment pending — your site stays active. Add payment by {new Date(renewDate).toLocaleDateString()} to keep it live.
        </div>
      )}

      {sub.total_billed_cents != null && sub.total_billed_cents > 0 && (
        <ClientPaymentsBlock subscriptionId={sub.id} tenantId={sub.tenant_id} />
      )}

      <div className="flex flex-wrap gap-2 pt-1 items-center">
        {tenant?.slug && (
          <a href={`https://${tenant.slug}.passivecoder.com`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" /> Visit Site
            </Button>
          </a>
        )}
        <a href="/api/enm/sso" target="_blank" rel="noopener noreferrer">
          <Button
            size="sm"
            variant={sub.plan_id === "pro" && sub.status === "active" ? "default" : "outline"}
            className={cn("flex items-center gap-1.5", sub.plan_id === "pro" && sub.status === "active" ? "bg-orange-500 hover:bg-orange-600 text-white border-0" : "")}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            {sub.plan_id === "pro" && sub.status === "active" ? "Open ExpertNear.Me Pro" : "ExpertNear.Me (Free)"}
          </Button>
        </a>
        {sub.status === "pending" && (
          <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Payment awaiting verification
          </span>
        )}
      </div>

      {sub.status !== "active" && plans.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {sub.status === "pending" ? "Change plan or pay" : "Choose a plan to activate"}
          </p>
          <PlanGrid
            plans={plans}
            currentPlanId={sub.plan_id}
            discountPct={discountPct}
            currency={currency}
            bdtRate={bdtRate}
            onChoose={onChoose}
          />
        </div>
      )}
    </div>
  );
}

interface ReceiptRow {
  id: string;
  receipt_number: string;
  amount_cents: number;
  currency: "USD" | "BDT";
  orig_amount_minor: number;
  method: string | null;
  paid_at: string;
  is_advance: boolean;
}

function ClientPaymentsBlock({ subscriptionId, tenantId }: { subscriptionId: string; tenantId: string }) {
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [totals, setTotals] = useState<{ billed: number; paid: number; due: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const [{ data: sub }, { data: payments }] = await Promise.all([
        supabase.from("subscriptions").select("total_billed_cents,total_paid_cents,balance_due_cents").eq("id", subscriptionId).maybeSingle(),
        supabase.from("subscription_payments").select("id,receipt_number,amount_cents,currency,orig_amount_minor,method,paid_at,is_advance")
          .eq("subscription_id", subscriptionId).eq("tenant_id", tenantId).order("paid_at", { ascending: false }),
      ]);
      if (sub) setTotals({ billed: sub.total_billed_cents ?? 0, paid: sub.total_paid_cents ?? 0, due: sub.balance_due_cents ?? 0 });
      setReceipts((payments as ReceiptRow[]) ?? []);
      setLoading(false);
    })();
  }, [subscriptionId, tenantId]);

  if (loading || !totals) return null;

  return (
    <div className="pt-2 border-t space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payments &amp; Receipts</p>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-[10px] text-muted-foreground uppercase">Total Billed</p>
          <p className="text-sm font-semibold">${(totals.billed / 100).toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-[10px] text-muted-foreground uppercase">Paid</p>
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">${(totals.paid / 100).toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-[10px] text-muted-foreground uppercase">Balance Due</p>
          <p className={cn("text-sm font-semibold", totals.due > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
            ${(totals.due / 100).toFixed(2)}
          </p>
        </div>
      </div>
      {receipts.length > 0 && (
        <div className="space-y-1.5">
          {receipts.map(r => (
            <div key={r.id} className="flex items-center justify-between text-xs bg-muted/30 rounded-lg px-3 py-2">
              <span>
                {r.receipt_number}
                {r.is_advance && <span className="ml-1.5 text-[9px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full">ADVANCE</span>}
                <span className="text-muted-foreground ml-2">
                  {r.currency === "BDT" ? `৳${r.orig_amount_minor.toLocaleString("en-BD")} (≈ $${(r.amount_cents / 100).toFixed(2)})` : `$${(r.amount_cents / 100).toFixed(2)}`}
                  {" · "}{new Date(r.paid_at).toLocaleDateString()}
                </span>
              </span>
              <a href={`/api/receipts/${r.id}/pdf`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlanGrid({ plans, currentPlanId, discountPct, currency, bdtRate, onChoose }: {
  plans: Plan[];
  currentPlanId?: string | null;
  discountPct: number;
  currency: Currency;
  bdtRate: number;
  onChoose?: (plan: CheckoutPlan) => void;
}) {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const paid = plans.filter(p => (p.price_yearly ?? 0) > 0);
  const custom = plans.find(p => p.id === "custom");
  const cycleSuffix = cycle === "monthly" ? "/mo" : "/yr";

  const usdFor = (p: Plan) => (cycle === "monthly" ? (p.price_monthly ?? 0) : p.price_yearly) / 100;
  const bdtFor = (p: Plan) => (cycle === "monthly" ? p.price_monthly_bdt : p.price_yearly_bdt);

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-lg border p-0.5 text-xs">
        {(["monthly", "yearly"] as const).map(c => (
          <button
            key={c}
            type="button"
            onClick={() => setCycle(c)}
            className={cn(
              "px-3 py-1.5 rounded-md font-medium transition-colors capitalize",
              cycle === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {c}{c === "yearly" && <span className="ml-1 text-[10px] opacity-80">save 2 months</span>}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {paid.map(p => {
          const isCurrent = p.id === currentPlanId;
          const usd = usdFor(p) * (1 - discountPct / 100);
          const bdt = bdtFor(p) != null ? Math.round((bdtFor(p) as number) * (1 - discountPct / 100)) : null;
          return (
            <div
              key={p.id}
              className={cn(
                "rounded-xl border p-4 space-y-2 relative",
                p.is_popular ? "border-primary" : "",
              )}
            >
              {p.is_popular && (
                <span className="absolute -top-2.5 left-4 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full">Popular</span>
              )}
              <div className="flex items-center justify-between">
                <p className="font-bold">{p.name}</p>
                {isCurrent && <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Current</span>}
              </div>
              <p className="text-2xl font-black">
                {formatPrice(usd, bdt, currency, bdtRate)}
                <span className="text-sm font-normal text-muted-foreground">{cycleSuffix}</span>
              </p>
              {p.features?.slice(0, 4).map((f, i) => (
                <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />{f}
                </p>
              ))}
              <Button
                size="sm"
                className="w-full mt-1"
                variant={p.is_popular ? "default" : "outline"}
                disabled={!onChoose}
                onClick={() => onChoose?.({ id: p.id, name: p.name, price_yearly: p.price_yearly, price_monthly: p.price_monthly, price_yearly_bdt: p.price_yearly_bdt, price_monthly_bdt: p.price_monthly_bdt, currency: p.currency })}
              >
                <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Choose {p.name}
              </Button>
            </div>
          );
        })}
      </div>

      {custom && (
        <div className="rounded-lg border border-dashed p-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Need something bigger? <strong className="text-foreground">Custom</strong> plan available.</span>
          <Button size="sm" variant="ghost" asChild>
            <a href="/dashboard/support?new=1&dept=custom_dev">Contact Support</a>
          </Button>
        </div>
      )}
    </div>
  );
}

function NoSubscription({ plans, discountPct, currency, bdtRate, onChoose }: { plans: Plan[]; discountPct: number; currency: Currency; bdtRate: number; onChoose?: (plan: CheckoutPlan) => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/30 p-8 text-center space-y-3">
        <CreditCard className="w-10 h-10 text-muted-foreground mx-auto" />
        <p className="font-semibold">No active subscription</p>
        <p className="text-sm text-muted-foreground">No active subscription yet. Choose a plan to activate your site.</p>
        {discountPct > 0 && (
          <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center justify-center gap-1">
            <BadgePercent className="w-4 h-4" /> As an agent, you get {discountPct}% off any plan
          </p>
        )}
      </div>
      {plans.length > 0 && (
        <PlanGrid
          plans={plans}
          discountPct={discountPct}
          currency={currency}
          bdtRate={bdtRate}
          onChoose={onChoose}
        />
      )}
    </div>
  );
}
