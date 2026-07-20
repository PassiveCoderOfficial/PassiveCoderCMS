"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Loader2, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Tenant { id: string; name: string; slug: string; }
interface Plan { id: string; name: string; price_yearly: number; price_monthly: number; currency: string; }

function planPrice(plan: Plan, cycle: string): number {
  if (cycle === "monthly") return plan.price_monthly ?? 0;
  return plan.price_yearly ?? 0;
}

export default function NewSubscriptionPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tenant_id: "",
    plan_id: "",
    status: "onboarded",
    payment_provider: "",
    billing_cycle: "yearly",
    amount_cents: "",
    currency: "USD",
    trial_ends_at: "",
    current_period_end: "",
    notes: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/super-admin/sites").then(r => r.json()),
      fetch("/api/super-admin/plans").then(r => r.json()),
    ]).then(([{ sites }, { plans: p }]) => {
      setTenants((sites ?? []).sort((a: Tenant, b: Tenant) => a.name.localeCompare(b.name)));
      setPlans(p ?? []);
      setLoading(false);
    });
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.tenant_id || !form.plan_id) { toast.error("Select site and plan"); return; }
    setSaving(true);
    const payload: Record<string, unknown> = {
      tenant_id: form.tenant_id,
      plan_id: form.plan_id,
      status: form.status,
      currency: form.currency || "USD",
    };
    if (form.payment_provider.trim()) payload.payment_provider = form.payment_provider.trim();
    payload.billing_cycle = form.billing_cycle;
    if (form.amount_cents.trim()) payload.amount_cents = Math.round(parseFloat(form.amount_cents) * 100);
    if (form.trial_ends_at) payload.trial_ends_at = form.trial_ends_at;
    if (form.current_period_end) payload.current_period_end = form.current_period_end;

    const res = await fetch("/api/super-admin/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error ?? "Failed"); return; }
    toast.success("Subscription created");
    router.push("/super-admin/subscriptions");
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="p-6 max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="w-6 h-6 text-green-500" />
        <h1 className="text-2xl font-bold">New Subscription</h1>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Site *</Label>
            <Select value={form.tenant_id} onValueChange={(v) => set("tenant_id", v)}>
              <SelectTrigger><SelectValue placeholder="— select site —" /></SelectTrigger>
              <SelectContent>
                {tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.slug})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Plan *</Label>
            <Select
              value={form.plan_id}
              onValueChange={(v) => {
                const plan = plans.find(p => p.id === v);
                if (plan) setForm(f => ({ ...f, plan_id: v, amount_cents: planPrice(plan, f.billing_cycle).toString(), currency: plan.currency }));
                else set("plan_id", v);
              }}
            >
              <SelectTrigger><SelectValue placeholder="— select plan —" /></SelectTrigger>
              <SelectContent>
                {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.currency} {p.price_yearly}/yr)</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Billing Cycle</Label>
            <Select
              value={form.billing_cycle}
              onValueChange={(cycle) => {
                const plan = plans.find(p => p.id === form.plan_id);
                setForm(f => ({ ...f, billing_cycle: cycle, ...(plan ? { amount_cents: planPrice(plan, cycle).toString() } : {}) }));
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["monthly", "yearly"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["onboarded", "pending", "active", "past_due", "suspended", "cancelled", "expired"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Provider</Label>
              <Input value={form.payment_provider} onChange={e => set("payment_provider", e.target.value)} placeholder="stripe, manual…" />
            </div>
            <div className="space-y-1.5">
              <Label>Amount ($/yr)</Label>
              <Input type="number" min="0" step="0.01" value={form.amount_cents} onChange={e => set("amount_cents", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Input value={form.currency} onChange={e => set("currency", e.target.value)} placeholder="USD" />
            </div>
            <div className="space-y-1.5">
              <Label>Trial Ends</Label>
              <Input type="date" value={form.trial_ends_at} onChange={e => set("trial_ends_at", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Period End</Label>
              <Input type="date" value={form.current_period_end} onChange={e => set("current_period_end", e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={save} disabled={saving || !form.tenant_id || !form.plan_id}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Create Subscription
            </Button>
            <Button variant="secondary" onClick={() => router.push("/super-admin/subscriptions")}>
              <X className="w-4 h-4" /> Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
