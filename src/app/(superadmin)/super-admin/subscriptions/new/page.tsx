"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Loader2, Check, X } from "lucide-react";

interface Tenant { id: string; name: string; slug: string; }
interface Plan { id: string; name: string; price_yearly: number; currency: string; }

export default function NewSubscriptionPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tenant_id: "",
    plan_id: "",
    status: "trial",
    payment_provider: "",
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

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-gray-500" /></div>;

  return (
    <div className="p-6 max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="w-6 h-6 text-green-400" />
        <h1 className="text-2xl font-bold text-white">New Subscription</h1>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Site *</label>
          <select value={form.tenant_id} onChange={e => set("tenant_id", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
            <option value="">— select site —</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name} ({t.slug})</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Plan *</label>
          <select value={form.plan_id} onChange={e => {
            const plan = plans.find(p => p.id === e.target.value);
            set("plan_id", e.target.value);
            if (plan) setForm(f => ({ ...f, plan_id: e.target.value, amount_cents: plan.price_yearly.toString(), currency: plan.currency }));
          }}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
            <option value="">— select plan —</option>
            {plans.map(p => <option key={p.id} value={p.id}>{p.name} ({p.currency} {p.price_yearly}/yr)</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Status</label>
            <select value={form.status} onChange={e => set("status", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
              {["trial","active","past_due","cancelled","expired"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
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
          <div>
            <label className="text-xs text-gray-400 block mb-1">Currency</label>
            <input value={form.currency} onChange={e => set("currency", e.target.value)}
              placeholder="USD"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Trial Ends</label>
            <input type="date" value={form.trial_ends_at} onChange={e => set("trial_ends_at", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Period End</label>
            <input type="date" value={form.current_period_end} onChange={e => set("current_period_end", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={save} disabled={saving || !form.tenant_id || !form.plan_id}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Create Subscription
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
