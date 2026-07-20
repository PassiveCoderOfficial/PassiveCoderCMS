"use client";

import { useState, useEffect } from "react";
import { CreditCard, Plus, Trash2, Save, CheckCircle, Loader2, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { MODULE_KEYS, MODULE_LABELS, type ModuleKey } from "@/components/admin/sidebar/nav-items";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PlanModuleConfig = { included?: boolean; defaultOn?: boolean };

interface Plan {
  id: string;
  name: string;
  price_yearly: number;
  price_monthly: number;
  storage_gb: number;
  visitor_limit_monthly: number;
  overage_cents_per_1k: number;
  features: string[];
  modules?: Partial<Record<ModuleKey, PlanModuleConfig>>;
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
  const modules = plan.modules ?? {};

  const toggleIncluded = (key: ModuleKey, included: boolean) => {
    const cfg = modules[key] ?? {};
    onChange({ ...plan, modules: { ...modules, [key]: { ...cfg, included, defaultOn: included ? (cfg.defaultOn ?? true) : false } } });
  };
  const toggleDefaultOn = (key: ModuleKey, defaultOn: boolean) => {
    const cfg = modules[key] ?? {};
    onChange({ ...plan, modules: { ...modules, [key]: { ...cfg, defaultOn } } });
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Plan Name</Label>
            <Input value={plan.name} onChange={e => onChange({ ...plan, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Plan ID (slug)</Label>
            <Input value={plan.id} disabled className="cursor-not-allowed" />
          </div>
          <div className="space-y-1.5">
            <Label>Monthly Price (USD)</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                className="flex-1"
                value={plan.price_monthly ?? 0}
                onChange={e => onChange({ ...plan, price_monthly: Number(e.target.value) })}
              />
              <span className="text-muted-foreground text-xs">/mo</span>
            </div>
            <p className="text-xs text-muted-foreground">0 = hide monthly option</p>
          </div>
          <div className="space-y-1.5">
            <Label>Yearly Price (USD)</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                className="flex-1"
                value={plan.price_yearly}
                onChange={e => onChange({ ...plan, price_yearly: Number(e.target.value) })}
              />
              <span className="text-muted-foreground text-xs">/yr</span>
            </div>
            {plan.id !== "custom" && plan.price_monthly > 0 && plan.price_yearly > 0 && (
              <p className="text-xs text-green-600 dark:text-green-500">
                Save ${(plan.price_monthly * 12 - plan.price_yearly).toFixed(0)}/yr vs monthly
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1">
              <Users className="w-3 h-3" /> Visitors/Month Included
            </Label>
            <Input
              type="number"
              value={plan.visitor_limit_monthly ?? 0}
              onChange={e => onChange({ ...plan, visitor_limit_monthly: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">0 = unlimited</p>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1">
              <Zap className="w-3 h-3" /> Overage (¢ per 1k visitors)
            </Label>
            <Input
              type="number"
              value={plan.overage_cents_per_1k ?? 0}
              onChange={e => onChange({ ...plan, overage_cents_per_1k: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">e.g. 200 = $2/1k visitors</p>
          </div>
          <div className="space-y-1.5">
            <Label>Storage (GB)</Label>
            <Input
              type="number"
              value={plan.storage_gb}
              onChange={e => onChange({ ...plan, storage_gb: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Features</Label>
          <div className="space-y-1.5">
            {plan.features.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                <Input
                  className="flex-1 h-8 text-xs"
                  value={f}
                  onChange={e => {
                    const features = [...plan.features];
                    features[i] = e.target.value;
                    onChange({ ...plan, features });
                  }}
                />
                <button
                  onClick={() => onChange({ ...plan, features: plan.features.filter((_, j) => j !== i) })}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              className="flex-1 h-8 text-xs"
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
            <Button
              size="sm"
              className="h-8 text-xs px-2"
              onClick={() => {
                if (!newFeature.trim()) return;
                onChange({ ...plan, features: [...plan.features, newFeature.trim()] });
                setNewFeature("");
              }}
            >
              <Plus className="w-3 h-3" /> Add
            </Button>
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Modules</Label>
          <p className="text-[11px] text-muted-foreground mb-2">Included = tenants on this plan can use it. Default On = enabled automatically (tenants can still turn it off).</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {MODULE_KEYS.map((key) => {
              const cfg = modules[key];
              const included = cfg?.included ?? false;
              return (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={included}
                    onChange={(e) => toggleIncluded(key, e.target.checked)}
                    className="accent-primary"
                  />
                  <span className="flex-1">{MODULE_LABELS[key]}</span>
                  {included && (
                    <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={cfg?.defaultOn ?? false}
                        onChange={(e) => toggleDefaultOn(key, e.target.checked)}
                        className="accent-primary"
                      />
                      Default on
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
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
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-indigo-500" /> Plans & Pricing
        </h1>
        <Button onClick={handleSave} disabled={saving || loading}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <p className="text-muted-foreground text-sm">
        Configure the plans shown to users during onboarding. Changes take effect immediately on the marketing homepage.
      </p>

      {loading || !plans ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <div key={plan.id}>
              <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-semibold">{plan.name}</h3>
              <PlanCard plan={plan} onChange={updated => updatePlan(i, updated)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
