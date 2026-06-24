"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Loader2, Check, X, Clock, Plus, DollarSign, FileText, Calendar } from "lucide-react";

interface Sub {
  id: string; tenant_id: string; plan_id: string; status: string;
  payment_provider: string | null; billing_cycle: string | null;
  amount_cents: number | null; currency: string | null;
  custom_amount_cents: number | null; discount_pct: number | null;
  notes: string | null; next_payment_due: string | null;
  last_paid_at: string | null; payment_method: string | null;
  trial_ends_at: string | null; current_period_end: string | null;
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
const PAYMENT_METHODS = ["", "bkash", "nagad", "bank", "shurjopay", "stripe", "manual", "enm"];

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
      payment_method: form.payment_method || null,
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

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-gray-500" /></div>;
  if (!sub) return <div className="p-6 text-gray-400">Subscription not found.</div>;

  const tenant = (Array.isArray(sub.tenants) ? sub.tenants[0] : sub.tenants) as { name: string; slug: string; tenant_number: number | null } | null;
  const tenantLabel = tenant ? `${tenant.name}${tenant.tenant_number ? ` · T${tenant.tenant_number}` : ""} (${tenant.slug})` : "—";

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="w-6 h-6 text-green-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Subscription</h1>
          <p className="text-sm text-gray-400">{tenantLabel}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5">

        {/* Plan + Billing Cycle + Status */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Plan</label>
            <select value={form.plan_id} onChange={e => {
              const plan = plans.find(p => p.id === e.target.value);
              if (plan) setForm(f => ({ ...f, plan_id: e.target.value, amount_cents: planPrice(plan, f.billing_cycle).toString(), currency: plan.currency }));
              else set("plan_id", e.target.value);
            }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
              {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Billing Cycle</label>
            <select value={form.billing_cycle} onChange={e => {
              const cycle = e.target.value;
              const plan = plans.find(p => p.id === form.plan_id);
              setForm(f => ({ ...f, billing_cycle: cycle, ...(plan && !f.custom_amount_cents ? { amount_cents: planPrice(plan, cycle).toString() } : {}) }));
            }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="lifetime">Lifetime</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Status</label>
            <select value={form.status} onChange={e => set("status", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>)}
            </select>
          </div>
        </div>

        {/* Pricing section */}
        <div className="border-t border-gray-800 pt-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Pricing</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Plan Price (USD{cycleLabel})</label>
              <input type="number" min="0" step="0.01" value={form.amount_cents} onChange={e => set("amount_cents", e.target.value)}
                placeholder="Auto from plan"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Custom Amount (USD{cycleLabel})</label>
              <input type="number" min="0" step="0.01" value={form.custom_amount_cents} onChange={e => set("custom_amount_cents", e.target.value)}
                placeholder="Leave blank = plan price"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
              <p className="text-[11px] text-gray-600 mt-1">Overrides plan price for this site</p>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Discount %</label>
              <input type="number" min="0" max="100" step="0.01" value={form.discount_pct} onChange={e => set("discount_pct", e.target.value)}
                placeholder="e.g. 10"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Payment info */}
        <div className="border-t border-gray-800 pt-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> Payment</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Payment Provider</label>
              <input value={form.payment_provider} onChange={e => set("payment_provider", e.target.value)}
                placeholder="stripe, enm, manual…"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Payment Method</label>
              <select value={form.payment_method} onChange={e => set("payment_method", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m || "— not set —"}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Last Paid Date</label>
              <input type="date" value={form.last_paid_at} onChange={e => set("last_paid_at", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Next Payment Due</label>
              <div className="flex gap-1.5 mb-1">
                {form.billing_cycle === "monthly"
                  ? [30, 60, 90].map(d => (
                      <button key={d} onClick={() => extendDate("next_payment_due", d)}
                        className="flex items-center gap-1 text-xs bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-600/30 text-indigo-400 px-2 py-1 rounded-lg transition-colors">
                        <Plus className="w-3 h-3" />{d}d
                      </button>
                    ))
                  : [365].map(d => (
                      <button key={d} onClick={() => extendDate("next_payment_due", d)}
                        className="flex items-center gap-1 text-xs bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-600/30 text-indigo-400 px-2 py-1 rounded-lg transition-colors">
                        <Plus className="w-3 h-3" />1yr
                      </button>
                    ))
                }
              </div>
              <input type="date" value={form.next_payment_due} onChange={e => set("next_payment_due", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Period End Date</label>
              <div className="flex gap-1.5 mb-1">
                {[30, 90, 365].map(d => (
                  <button key={d} onClick={() => extendDate("current_period_end", d)}
                    className="flex items-center gap-1 text-xs bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-600/30 text-indigo-400 px-2 py-1 rounded-lg transition-colors">
                    <Plus className="w-3 h-3" />{d >= 365 ? "1yr" : `${d}d`}
                  </button>
                ))}
              </div>
              <input type="date" value={form.current_period_end} onChange={e => set("current_period_end", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="border-t border-gray-800 pt-4">
          <label className="text-xs text-gray-400 block mb-1 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Internal Notes</label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
            rows={3} placeholder="SA-only notes about this subscription…"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none" />
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Changes
          </button>
          <button onClick={() => router.push("/super-admin/subscriptions")}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg">
            <X className="w-4 h-4" /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
