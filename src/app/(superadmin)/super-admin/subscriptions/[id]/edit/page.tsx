"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Loader2, Check, X, Plus, FileText, Calendar, Package as PackageIcon } from "lucide-react";
import PaymentsSection from "./payments-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Sub {
  id: string; tenant_id: string; plan_id: string; status: string;
  payment_provider: string | null; billing_cycle: string | null;
  amount_cents: number | null; currency: string | null;
  custom_amount_cents: number | null; discount_pct: number | null;
  notes: string | null; next_payment_due: string | null;
  last_paid_at: string | null; payment_method: string | null;
  trial_ends_at: string | null; current_period_end: string | null;
  total_billed_cents: number | null; total_paid_cents: number | null; balance_due_cents: number | null;
  tenants: { name: string; slug: string; tenant_number: number | null } | null;
}
interface Plan { id: string; name: string; price_yearly: number; price_monthly: number; currency: string; }

const STATUSES = ["onboarded", "pending", "active", "past_due", "suspended", "cancelled", "expired"];
const STATUS_LABELS: Record<string, string> = {
  onboarded: "Onboarded (awaiting payment)",
  pending: "Pending (payment submitted)",
  active: "Active",
  past_due: "Past Due",
  suspended: "Suspended",
  cancelled: "Cancelled",
  expired: "Expired",
};
const PAYMENT_METHODS = ["__none__", "bkash", "nagad", "bank", "shurjopay", "stripe", "manual", "enm"];

function planPrice(plan: Plan, cycle: string): number {
  if (cycle === "monthly") return plan.price_monthly ?? 0;
  return plan.price_yearly ?? 0;
}

function toDateInput(iso: string | null) {
  if (!iso) return "";
  return iso.split("T")[0];
}

export default function EditSubscriptionPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [sub, setSub] = useState<Sub | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    plan_id: "", status: "onboarded",
    payment_provider: "", billing_cycle: "yearly",
    amount_cents: "", custom_amount_cents: "", currency: "USD",
    discount_pct: "", notes: "",
    next_payment_due: "", last_paid_at: "", payment_method: "",
    current_period_end: "",
  });

  useEffect(() => {
    fetch(`/api/super-admin/subscriptions?id=${id}`)
      .then(r => r.json())
      .then(({ subscription: s, plans: p }) => {
        if (s) {
          setSub(s as Sub);
          setForm({
            plan_id: s.plan_id ?? "",
            status: s.status ?? "onboarded",
            payment_provider: s.payment_provider ?? "",
            billing_cycle: s.billing_cycle ?? "yearly",
            amount_cents: s.amount_cents ? (s.amount_cents / 100).toString() : "",
            custom_amount_cents: s.custom_amount_cents ? (s.custom_amount_cents / 100).toString() : "",
            currency: s.currency ?? "USD",
            discount_pct: s.discount_pct ? s.discount_pct.toString() : "",
            notes: s.notes ?? "",
            next_payment_due: toDateInput(s.next_payment_due),
            last_paid_at: toDateInput(s.last_paid_at),
            payment_method: s.payment_method ?? "",
            current_period_end: toDateInput(s.current_period_end),
          });
        }
        setPlans(p ?? []);
        setLoading(false);
      });
  }, [id]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  function extendDate(field: "next_payment_due" | "current_period_end", days: number) {
    const base = form[field] ? new Date(form[field] + "T00:00:00Z") : new Date();
    base.setDate(base.getDate() + days);
    set(field, base.toISOString().split("T")[0]);
  }

  const cycleLabel = form.billing_cycle === "monthly" ? "/mo" : "/yr";

  async function save() {
    if (!id) return;
    setSaving(true);
    const payload: Record<string, unknown> = {
      plan_id: form.plan_id,
      status: form.status,
      currency: form.currency || "USD",
      billing_cycle: form.billing_cycle,
      payment_provider: form.payment_provider.trim() || null,
      payment_method: form.payment_method === "__none__" ? null : (form.payment_method || null),
      notes: form.notes.trim() || null,
      discount_pct: form.discount_pct ? parseFloat(form.discount_pct) : null,
    };
    payload.amount_cents = form.amount_cents.trim() ? Math.round(parseFloat(form.amount_cents) * 100) : null;
    payload.custom_amount_cents = form.custom_amount_cents.trim() ? Math.round(parseFloat(form.custom_amount_cents) * 100) : null;
    payload.next_payment_due = form.next_payment_due ? form.next_payment_due : null;
    payload.last_paid_at = form.last_paid_at ? new Date(form.last_paid_at).toISOString() : null;
    payload.current_period_end = form.current_period_end ? new Date(form.current_period_end).toISOString() : null;

    const res = await fetch("/api/super-admin/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error ?? "Failed"); return; }
    toast.success("Subscription updated");
    router.push("/super-admin/subscriptions");
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  if (!sub) return <div className="p-6 text-muted-foreground">Subscription not found.</div>;

  const tenant = (Array.isArray(sub.tenants) ? sub.tenants[0] : sub.tenants) as { name: string; slug: string; tenant_number: number | null } | null;
  const tenantLabel = tenant ? `${tenant.name}${tenant.tenant_number ? ` · T${tenant.tenant_number}` : ""} (${tenant.slug})` : "—";

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
          <CreditCard className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Edit Subscription</h1>
          <p className="text-sm text-muted-foreground">{tenantLabel}</p>
        </div>
      </div>

      {/* Plan & Billing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-1.5"><PackageIcon className="w-3.5 h-3.5" /> Plan &amp; Billing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select
                value={form.plan_id || undefined}
                onValueChange={v => {
                  const plan = plans.find(p => p.id === v);
                  if (plan) setForm(f => ({ ...f, plan_id: v, amount_cents: planPrice(plan, f.billing_cycle).toString(), currency: plan.currency }));
                  else set("plan_id", v);
                }}
              >
                <SelectTrigger><SelectValue placeholder={plans.length === 0 ? "Loading plans…" : "Select a plan"} /></SelectTrigger>
                <SelectContent>
                  {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Billing Cycle</Label>
              <Select
                value={form.billing_cycle}
                onValueChange={v => {
                  const plan = plans.find(p => p.id === form.plan_id);
                  setForm(f => ({ ...f, billing_cycle: v, ...(plan && !f.custom_amount_cents ? { amount_cents: planPrice(plan, v).toString() } : {}) }));
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4">
            <div className="space-y-1.5">
              <Label>Plan Price (USD{cycleLabel})</Label>
              <Input type="number" min="0" step="0.01" value={form.amount_cents} onChange={e => set("amount_cents", e.target.value)} placeholder="Auto from plan" />
            </div>
            <div className="space-y-1.5">
              <Label>Custom Amount (USD{cycleLabel})</Label>
              <Input type="number" min="0" step="0.01" value={form.custom_amount_cents} onChange={e => set("custom_amount_cents", e.target.value)} placeholder="Leave blank = plan price" />
              <p className="text-xs text-muted-foreground">Overrides plan price for this site</p>
            </div>
            <div className="space-y-1.5">
              <Label>Discount %</Label>
              <Input type="number" min="0" max="100" step="0.01" value={form.discount_pct} onChange={e => set("discount_pct", e.target.value)} placeholder="e.g. 10" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Payment Info</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Payment Provider</Label>
            <Input value={form.payment_provider} onChange={e => set("payment_provider", e.target.value)} placeholder="stripe, enm, manual…" />
          </div>
          <div className="space-y-1.5">
            <Label>Payment Method</Label>
            <Select value={form.payment_method || "__none__"} onValueChange={v => set("payment_method", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m === "__none__" ? "— not set —" : m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Dates</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Last Paid Date</Label>
            <Input type="date" value={form.last_paid_at} onChange={e => set("last_paid_at", e.target.value)} />
          </div>
          <div />
          <div className="space-y-1.5">
            <Label>Next Payment Due</Label>
            <div className="flex gap-1.5">
              {(form.billing_cycle === "monthly" ? [30, 60, 90] : [365]).map(d => (
                <Button key={d} type="button" variant="outline" size="sm" onClick={() => extendDate("next_payment_due", d)}>
                  <Plus className="w-3 h-3" />{d >= 365 ? "1yr" : `${d}d`}
                </Button>
              ))}
            </div>
            <Input type="date" value={form.next_payment_due} onChange={e => set("next_payment_due", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Period End Date</Label>
            <div className="flex gap-1.5">
              {[30, 90, 365].map(d => (
                <Button key={d} type="button" variant="outline" size="sm" onClick={() => extendDate("current_period_end", d)}>
                  <Plus className="w-3 h-3" />{d >= 365 ? "1yr" : `${d}d`}
                </Button>
              ))}
            </div>
            <Input type="date" value={form.current_period_end} onChange={e => set("current_period_end", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} placeholder="SA-only notes about this subscription…" />
        </CardContent>
      </Card>

      {/* Payments & receipts */}
      <Card>
        <CardContent className="pt-6">
          <PaymentsSection
            subscriptionId={sub.id}
            totalBilledCents={sub.total_billed_cents}
            totalPaidCents={sub.total_paid_cents}
            balanceDueCents={sub.balance_due_cents}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2 pb-6">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save Changes
        </Button>
        <Button variant="secondary" onClick={() => router.push("/super-admin/subscriptions")}>
          <X className="w-4 h-4" /> Cancel
        </Button>
      </div>
    </div>
  );
}
