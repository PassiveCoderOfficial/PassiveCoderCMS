"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Loader2, Check, X, Clock, Plus } from "lucide-react";

interface Sub {
  id: string; tenant_id: string; plan_id: string; status: string;
  payment_provider: string | null; billing_cycle: string | null; amount_cents: number | null; currency: string | null;
  trial_ends_at: string | null; current_period_end: string | null;
  tenants: { name: string; slug: string } | null;
}
interface Plan { id: string; name: string; price_yearly: number; price_monthly: number; price_lifetime: number; currency: string; }

function planPrice(plan: Plan, cycle: string): number {
  if (cycle === "monthly") return plan.price_monthly ?? 0;
  if (cycle === "lifetime") return plan.price_lifetime ?? 0;
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
    plan_id: "", status: "", payment_provider: "", billing_cycle: "yearly",
    amount_cents: "", currency: "USD",
    trial_ends_at: "", current_period_end: "",
  });

  useEffect(() => {
    fetch(`/api/super-admin/subscriptions?id=${id}`)
      .then(r => r.json())
      .then(({ subscription: s, plans: p }) => {
        if (s) {
          setSub(s as Sub);
          setForm({
            plan_id: s.plan_id ?? "",
            status: s.status ?? "trial",
            payment_provider: s.payment_provider ?? "",
            billing_cycle: s.billing_cycle ?? "yearly",
            amount_cents: s.amount_cents ? (s.amount_cents / 100).toString() : "",
            currency: s.currency ?? "USD",
            trial_ends_at: toDateInput(s.trial_ends_at),
            current_period_end: toDateInput(s.current_period_end),
          });
        }
        setPlans(p ?? []);
        setLoading(false);
      });
  }, [id]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  function extendTrial(days: number) {
    const base = form.trial_ends_at
      ? new Date(form.trial_ends_at + "T00:00:00Z")
      : new Date();
    base.setDate(base.getDate() + days);
    set("trial_ends_at", base.toISOString().split("T")[0]);
    if (form.status === "expired" || form.status === "suspended") set("status", "trial");
  }

  async function save() {
    if (!id) return;
    setSaving(true);
    const payload: Record<string, unknown> = {
      plan_id: form.plan_id,
      status: form.status,
      currency: form.currency || "USD",
    };
    if (form.payment_provider.trim()) payload.payment_provider = form.payment_provider.trim();
    else payload.payment_provider = null;
    payload.billing_cycle = form.billing_cycle;
    if (form.amount_cents.trim()) payload.amount_cents = Math.round(parseFloat(form.amount_cents) * 100);
    else payload.amount_cents = null;
    payload.trial_ends_at = form.trial_ends_at ? new Date(form.trial_ends_at).toISOString() : null;
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

  const tenant = (Array.isArray(sub.tenants) ? sub.tenants[0] : sub.tenants) as { name: string; slug: string } | null;

  return (
    <div className="p-6 max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="w-6 h-6 text-green-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Subscription</h1>
          <p className="text-sm text-gray-400">{tenant?.name} ({tenant?.slug})</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
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
              setForm(f => ({ ...f, billing_cycle: cycle, ...(plan ? { amount_cents: planPrice(plan, cycle).toString() } : {}) }));
            }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
              {["monthly","yearly","lifetime"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Status</label>
            <select value={form.status} onChange={e => set("status", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
              {["trial","active","past_due","cancelled","expired","suspended"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Trial extension shortcuts */}
        <div>
          <label className="text-xs text-gray-400 block mb-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Trial End Date
          </label>
          <div className="flex gap-2 mb-2">
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => extendTrial(d)}
                className="flex items-center gap-1 text-xs bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-600/30 text-indigo-400 px-2.5 py-1.5 rounded-lg transition-colors">
                <Plus className="w-3 h-3" />+{d}d
              </button>
            ))}
          </div>
          <input type="date" value={form.trial_ends_at} onChange={e => set("trial_ends_at", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Period End Date</label>
          <input type="date" value={form.current_period_end} onChange={e => set("current_period_end", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Payment Provider</label>
            <input value={form.payment_provider} onChange={e => set("payment_provider", e.target.value)}
              placeholder="stripe, manual…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Amount ($/yr)</label>
            <input type="number" min="0" step="0.01" value={form.amount_cents} onChange={e => set("amount_cents", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          </div>
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
