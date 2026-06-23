"use client";

import { useState, useEffect } from "react";
import { CreditCard, Plus, Trash2, Save, CheckCircle, Loader2, Users, Zap } from "lucide-react";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  price_yearly: number;
  price_monthly: number;
  storage_gb: number;
  visitor_limit_monthly: number;
  overage_cents_per_1k: number;
  features: string[];
  sort_order?: number;
}

const DEFAULT_PLANS: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    price_yearly: 290,
    price_monthly: 49,
    storage_gb: 10,
    visitor_limit_monthly: 5000,
    overage_cents_per_1k: 200,
    features: [
      "DIY website builder",
      "Free .com/.org/.net TLD domain (1 year)",
      "10 GB storage",
      "5,000 visitors/month included",
      "$2 per 1,000 extra visitors",
      "Page builder",
      "SSL certificate",
      "Daily backups",
      "Uptime monitoring",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price_yearly: 449,
    price_monthly: 79,
    storage_gb: 50,
    visitor_limit_monthly: 25000,
    overage_cents_per_1k: 100,
    features: [
      "DIY website builder",
      "Free .com/.org/.net TLD domain (1 year)",
      "50 GB storage",
      "25,000 visitors/month included",
      "$1 per 1,000 extra visitors",
      "Full design & layout support",
      "Configuration assistance",
      "E-Commerce functionality",
      "ExpertNear.Me Pro subscription (free)",
      "SSL certificate",
      "Daily backups",
      "VIP priority support",
    ],
  },
  {
    id: "custom",
    name: "Custom",
    price_yearly: 0,
    price_monthly: 0,
    storage_gb: 100,
    visitor_limit_monthly: 0,
    overage_cents_per_1k: 0,
    features: ["Custom storage", "Custom domains", "Dedicated support", "Custom integrations", "SLA guarantee", "Onboarding assistance"],
  },
];

function PlanCard({ plan, onChange }: { plan: Plan; onChange: (p: Plan) => void }) {
  const [newFeature, setNewFeature] = useState("");

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Plan Name</label>
          <input
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            value={plan.name}
            onChange={e => onChange({ ...plan, name: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Plan ID (slug)</label>
          <input
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-400 text-sm focus:outline-none cursor-not-allowed"
            value={plan.id}
            disabled
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Monthly Price (USD)</label>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">$</span>
            <input
              type="number"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              value={plan.price_monthly ?? 0}
              onChange={e => onChange({ ...plan, price_monthly: Number(e.target.value) })}
            />
            <span className="text-gray-500 text-xs">/mo</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">0 = hide monthly option</p>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Yearly Price (USD)</label>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">$</span>
            <input
              type="number"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              value={plan.price_yearly}
              onChange={e => onChange({ ...plan, price_yearly: Number(e.target.value) })}
            />
            <span className="text-gray-500 text-xs">/yr</span>
          </div>
          {plan.id !== "custom" && plan.price_monthly > 0 && plan.price_yearly > 0 && (
            <p className="text-xs text-green-600 mt-1">
              Save ${(plan.price_monthly * 12 - plan.price_yearly).toFixed(0)}/yr vs monthly
            </p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
            <Users className="w-3 h-3" /> Visitors/Month Included
          </label>
          <input
            type="number"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            value={plan.visitor_limit_monthly ?? 0}
            onChange={e => onChange({ ...plan, visitor_limit_monthly: Number(e.target.value) })}
          />
          <p className="text-xs text-gray-600 mt-1">0 = unlimited</p>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
            <Zap className="w-3 h-3" /> Overage (¢ per 1k visitors)
          </label>
          <input
            type="number"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            value={plan.overage_cents_per_1k ?? 0}
            onChange={e => onChange({ ...plan, overage_cents_per_1k: Number(e.target.value) })}
          />
          <p className="text-xs text-gray-600 mt-1">e.g. 200 = $2/1k visitors</p>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Storage (GB)</label>
          <input
            type="number"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            value={plan.storage_gb}
            onChange={e => onChange({ ...plan, storage_gb: Number(e.target.value) })}
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-2 block">Features</label>
        <div className="space-y-1.5 mb-2">
          {plan.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
              <input
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-indigo-500"
                value={f}
                onChange={e => {
                  const features = [...plan.features];
                  features[i] = e.target.value;
                  onChange({ ...plan, features });
                }}
              />
              <button
                onClick={() => onChange({ ...plan, features: plan.features.filter((_, j) => j !== i) })}
                className="text-gray-600 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
            placeholder="Add feature…"
            value={newFeature}
            onChange={e => setNewFeature(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && newFeature.trim()) {
                onChange({ ...plan, features: [...plan.features, newFeature.trim()] });
                setNewFeature("");
              }
            }}
          />
          <button
            onClick={() => {
              if (!newFeature.trim()) return;
              onChange({ ...plan, features: [...plan.features, newFeature.trim()] });
              setNewFeature("");
            }}
            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-white text-xs transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/super-admin/plans")
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.plans) && d.plans.length > 0) {
          setPlans(d.plans);
        } else {
          setPlans(DEFAULT_PLANS);
        }
      })
      .catch(() => setPlans(DEFAULT_PLANS))
      .finally(() => setLoading(false));
  }, []);

  const updatePlan = (index: number, updated: Plan) => {
    setPlans(prev => prev ? prev.map((p, i) => i === index ? updated : p) : prev);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/super-admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plans }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Save failed");
      }
      toast.success("Plans saved — marketing page updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save plans");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-indigo-400" /> Plans & Pricing
        </h1>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      <p className="text-gray-400 text-sm">
        Configure the plans shown to users during onboarding. Changes take effect immediately on the marketing homepage.
      </p>

      {loading || !plans ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <div key={plan.id}>
              <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">{plan.name}</h3>
              <PlanCard plan={plan} onChange={updated => updatePlan(i, updated)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
