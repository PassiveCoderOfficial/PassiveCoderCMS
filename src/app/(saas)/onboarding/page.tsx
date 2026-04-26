"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CheckCircle, Circle, Loader2, Search, Globe, ArrowRight,
  Sparkles, ExternalLink, AlertCircle, Star, CreditCard,
  Clock, MessageSquare, Zap, Layout, Eye,
} from "lucide-react";
import { TEMPLATES, TEMPLATE_CATEGORIES, type Template } from "@/lib/templates/templates-data";

// ─── Step bar ─────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 0, label: "Plan" },
  { id: 1, label: "Payment" },
  { id: 2, label: "Your Site" },
  { id: 3, label: "Subdomain" },
  { id: 4, label: "Domain" },
  { id: 5, label: "Template" },
  { id: 6, label: "Launch" },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((step, i) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center gap-1.5">
            <div className={cn(
              "h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all",
              current > step.id ? "bg-primary border-primary text-primary-foreground"
                : current === step.id ? "bg-background border-primary text-primary"
                : "bg-background border-muted-foreground/30 text-muted-foreground"
            )}>
              {current > step.id ? <CheckCircle className="h-3.5 w-3.5" /> : step.id + 1}
            </div>
            <span className={cn("text-[9px] font-medium whitespace-nowrap", current === step.id ? "text-primary" : "text-muted-foreground")}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn("flex-1 h-0.5 mb-4 mx-0.5 transition-colors", current > step.id + 1 ? "bg-primary" : "bg-muted")} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Step 0: Plan selection ───────────────────────────────────────────────────

interface Plan { id: string; name: string; price_yearly: number; storage_gb: number; features: string[] }

const PLAN_HIGHLIGHTS: Record<string, { badge?: string; color: string }> = {
  standard: { color: "border-gray-200" },
  premium: { badge: "Most Popular", color: "border-indigo-500" },
  custom: { color: "border-gray-200" },
};

function Step0({ onNext }: { onNext: (planId: string) => void }) {
  const params = useSearchParams();
  const defaultPlan = params.get("plan") ?? "standard";
  const [selected, setSelected] = useState(defaultPlan);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/plans").then(r => r.json()).then(d => { setPlans(d.plans ?? []); setLoading(false); });
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Choose your plan</h2>
        <p className="text-muted-foreground mt-1">Start with a 24-hour free trial — no payment needed upfront.</p>
      </div>

      <div className="space-y-3">
        {plans.map(plan => {
          const h = PLAN_HIGHLIGHTS[plan.id] ?? { color: "border-gray-200" };
          const features: string[] = Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features as unknown as string ?? "[]");
          const isCustom = plan.id === "custom";
          return (
            <button
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className={cn(
                "w-full text-left rounded-xl border-2 p-4 transition-all",
                selected === plan.id ? `${h.color} bg-primary/5` : "border-border hover:border-muted-foreground/40"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", selected === plan.id ? "border-primary" : "border-muted-foreground/40")}>
                    {selected === plan.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className="font-bold">{plan.name}</span>
                  {h.badge && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><Star className="w-2.5 h-2.5 fill-current" />{h.badge}</span>}
                </div>
                <span className="font-bold text-sm">
                  {isCustom ? "Custom pricing" : `$${plan.price_yearly}/yr`}
                </span>
              </div>
              <div className="ml-6 flex flex-wrap gap-x-4 gap-y-1">
                {features.slice(0, 3).map(f => (
                  <span key={f} className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />{f}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <Button size="lg" className="w-full" onClick={() => onNext(selected)} disabled={!selected}>
        Continue with {plans.find(p => p.id === selected)?.name ?? selected} <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Step 1: Payment ──────────────────────────────────────────────────────────

type PayMethod = "paddle" | "shurjopay" | "manual" | "trial";

function Step1({
  planId,
  onNext,
}: {
  planId: string;
  onNext: (method: PayMethod) => void;
}) {
  const [method, setMethod] = useState<PayMethod>("trial");
  const isCustom = planId === "custom";

  const OPTIONS: Array<{ id: PayMethod; icon: React.ReactNode; title: string; desc: string; badge?: string; disabled?: boolean }> = [
    {
      id: "trial",
      icon: <Clock className="w-5 h-5 text-amber-500" />,
      title: "Start 24-hour Free Trial",
      desc: "Full access for 24 hours. Pay when you're ready to keep it.",
      badge: "No card needed",
    },
    {
      id: "paddle",
      icon: <CreditCard className="w-5 h-5 text-blue-500" />,
      title: "Pay with Card",
      desc: "Visa, Mastercard, Amex — all major cards. Secure via Paddle.",
      disabled: isCustom,
    },
    {
      id: "shurjopay",
      icon: <span className="text-lg font-bold text-green-600">৳</span>,
      title: "ShurjoPay",
      desc: "bKash, Nagad, Rocket, cards — for Bangladeshi customers.",
      disabled: isCustom,
    },
    {
      id: "manual",
      icon: <MessageSquare className="w-5 h-5 text-purple-500" />,
      title: "Contact Sales",
      desc: isCustom ? "Get a custom quote from our sales team." : "Request invoice or arrange manual payment via our sales team.",
      badge: isCustom ? "Required" : undefined,
    },
  ];

  if (isCustom && method !== "manual" && method !== "trial") {
    // Auto-select manual for custom
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">How would you like to pay?</h2>
        <p className="text-muted-foreground mt-1">
          {isCustom ? "Custom plans require contacting our sales team." : "Try free for 24 hours, or pay now to lock in your plan."}
        </p>
      </div>

      <div className="space-y-2.5">
        {OPTIONS.filter(o => !o.disabled).map(opt => (
          <button
            key={opt.id}
            onClick={() => setMethod(opt.id)}
            className={cn(
              "w-full text-left rounded-xl border-2 p-4 flex items-start gap-3 transition-all",
              method === opt.id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
            )}
          >
            <div className="mt-0.5 w-8 h-8 flex items-center justify-center bg-muted rounded-lg shrink-0">{opt.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{opt.title}</span>
                {opt.badge && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">{opt.badge}</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
            </div>
            <div className={cn("w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center", method === opt.id ? "border-primary" : "border-muted-foreground/40")}>
              {method === opt.id && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
          </button>
        ))}
      </div>

      {method === "trial" && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
          <Zap className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <span>Your site will be fully functional for 24 hours. You'll get a reminder before it expires. No auto-charge.</span>
        </div>
      )}

      {method === "manual" && (
        <div className="rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 p-3 text-xs text-purple-800 dark:text-purple-400 flex items-start gap-2">
          <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
          <span>A support ticket will be created for our sales team. They'll contact you within 1 business day. You'll have a 24-hour trial while you wait.</span>
        </div>
      )}

      <Button size="lg" className="w-full" onClick={() => onNext(method)}>
        {method === "trial" ? "Start Free Trial" : method === "manual" ? "Contact Sales & Start Trial" : "Proceed to Payment"}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Step 2: Site name ────────────────────────────────────────────────────────

function Step2({ onNext }: { onNext: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Name your site</h2>
        <p className="text-muted-foreground mt-1">This is the name visitors will see. You can change it later.</p>
      </div>
      <div className="space-y-2">
        <Label>Site Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Acme Plumbing, My Portfolio, …"
          className="h-11 text-base" autoFocus onKeyDown={e => e.key === "Enter" && name.trim() && onNext(name.trim())} />
      </div>
      <Button size="lg" className="w-full" onClick={() => onNext(name.trim())} disabled={!name.trim()}>
        Continue <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Step 3: Subdomain ────────────────────────────────────────────────────────

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "cmsstudio.io";
function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""); }

function Step3({ siteName, onNext }: { siteName: string; onNext: (slug: string) => void }) {
  const [slug, setSlug] = useState(() => slugify(siteName));
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken" | "error">("idle");
  const [reason, setReason] = useState("");

  const check = useCallback(async (s: string) => {
    if (!s || s.length < 3) { setStatus("idle"); return; }
    setStatus("checking");
    try {
      const res = await fetch(`/api/onboarding/check-subdomain?slug=${encodeURIComponent(s)}`);
      const data = await res.json();
      setStatus(data.available ? "available" : "taken");
      setReason(data.reason ?? "");
    } catch { setStatus("error"); }
  }, []);

  useEffect(() => { const t = setTimeout(() => check(slug), 400); return () => clearTimeout(t); }, [slug, check]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Choose your subdomain</h2>
        <p className="text-muted-foreground mt-1">Your site is instantly live at this address.</p>
      </div>
      <div className="space-y-2">
        <Label>Subdomain</Label>
        <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary">
          <Input value={slug} onChange={e => setSlug(slugify(e.target.value))} className="border-0 focus-visible:ring-0 h-11 text-base" placeholder="your-site" />
          <span className="px-3 text-sm text-muted-foreground bg-muted h-11 flex items-center shrink-0 border-l">.{ROOT}</span>
        </div>
        <div className="flex items-center gap-2 text-sm min-h-5">
          {status === "checking" && <><Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /><span className="text-muted-foreground">Checking…</span></>}
          {status === "available" && <><CheckCircle className="h-3.5 w-3.5 text-green-500" /><span className="text-green-600 font-medium">{slug}.{ROOT} is available!</span></>}
          {status === "taken" && <><AlertCircle className="h-3.5 w-3.5 text-destructive" /><span className="text-destructive">{reason || "Already taken"}</span></>}
        </div>
      </div>
      <Button size="lg" className="w-full" onClick={() => onNext(slug)} disabled={status !== "available"}>
        Use {slug}.{ROOT} <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Step 4: Domain ───────────────────────────────────────────────────────────

type DomainOption = "subdomain" | "search" | "connect";
interface DomainResult { domain: string; available: boolean; price?: number }

function Step4({ slug, onNext }: { slug: string; onNext: (choice: { type: DomainOption; domain?: string }) => void }) {
  const [option, setOption] = useState<DomainOption>("subdomain");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DomainResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [connectDomain, setConnectDomain] = useState("");
  const [selected, setSelected] = useState<DomainResult | null>(null);

  const searchDomains = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/domain/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch { toast.error("Domain search failed"); }
    finally { setSearching(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Set up your domain</h2>
        <p className="text-muted-foreground mt-1">You can always change this later in Settings.</p>
      </div>
      <div className="grid gap-3">
        {([
          { id: "subdomain" as DomainOption, title: `Keep ${slug}.${ROOT}`, desc: "Free · No setup required · Ready instantly", badge: "Recommended" },
          { id: "search" as DomainOption, title: "Search & buy a domain", desc: "From $12/yr · Auto-configured · WHOIS privacy included", badge: null },
          { id: "connect" as DomainOption, title: "Connect your own domain", desc: "You already own a domain · 2-step DNS setup", badge: null },
        ] as const).map(opt => (
          <button key={opt.id} onClick={() => setOption(opt.id)}
            className={cn("text-left rounded-xl border-2 p-4 transition-all", option === opt.id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40")}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">{opt.title}</span>
              {opt.badge && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{opt.badge}</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
          </button>
        ))}
      </div>
      {option === "search" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="yourbrand" className="h-10" onKeyDown={e => e.key === "Enter" && searchDomains()} />
            <Button onClick={searchDomains} disabled={searching} className="shrink-0">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          {results.length > 0 && (
            <div className="border rounded-lg divide-y overflow-hidden">
              {results.map(r => (
                <button key={r.domain} disabled={!r.available} onClick={() => setSelected(r)}
                  className={cn("w-full flex items-center justify-between px-4 py-3 text-sm transition-colors", r.available ? "hover:bg-muted/50 cursor-pointer" : "opacity-40 cursor-not-allowed", selected?.domain === r.domain && "bg-primary/10")}>
                  <div className="flex items-center gap-2">
                    {selected?.domain === r.domain ? <CheckCircle className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                    <span className="font-medium">{r.domain}</span>
                    {!r.available && <span className="text-xs text-muted-foreground">Taken</span>}
                  </div>
                  {r.available && r.price && <span className="text-xs font-semibold text-primary">${(r.price / 100).toFixed(2)}/yr</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {option === "connect" && (
        <div className="space-y-2">
          <Label>Your domain</Label>
          <Input value={connectDomain} onChange={e => setConnectDomain(e.target.value.toLowerCase())} placeholder="acme.com" className="h-10" />
          <p className="text-xs text-muted-foreground">We'll show you exactly how to point it to your site.</p>
        </div>
      )}
      <Button size="lg" className="w-full"
        onClick={() => {
          if (option === "subdomain") onNext({ type: "subdomain" });
          else if (option === "search" && selected) onNext({ type: "search", domain: selected.domain });
          else if (option === "connect" && connectDomain.includes(".")) onNext({ type: "connect", domain: connectDomain });
        }}
        disabled={(option === "search" && !selected) || (option === "connect" && !connectDomain.includes("."))}>
        Continue <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Step 5: Template ─────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string[]> = {
  "Cleaning":                  ["🧹", "✨", "🪣"],
  "HVAC & Plumbing":           ["❄️", "🔧", "💨"],
  "Renovation & Construction": ["🏗️", "🔨", "📐"],
  "Interior Design":           ["🪑", "🎨", "💡"],
  "Restaurant & Cafe":         ["🍽️", "👨‍🍳", "🍷"],
  "Health & Beauty":           ["✂️", "💅", "🌸"],
  "Fitness & Sports":          ["💪", "🏋️", "🥊"],
  "Legal & Finance":           ["⚖️", "📊", "🏛️"],
  "Real Estate":               ["🏠", "🔑", "📍"],
  "Photography":               ["📸", "🎬", "💍"],
  "Education":                 ["📚", "🎓", "💻"],
  "Retail & Shop":             ["🛍️", "🏷️", "📦"],
  "Automotive":                ["🚗", "🔧", "⚙️"],
  "Events":                    ["🎉", "💒", "🎭"],
  "Tech & Agency":             ["💻", "📈", "🎯"],
  "General Business":          ["📋", "🤝", "🌐"],
};

function TemplateMiniCard({ template, selected, mode, onSelect, onModeChange }: {
  template: Template;
  selected: boolean;
  mode: "theme" | "full";
  onSelect: () => void;
  onModeChange: (m: "theme" | "full") => void;
}) {
  const icons = CATEGORY_ICONS[template.category] ?? ["⭐", "✅", "🎯"];
  return (
    <div
      onClick={onSelect}
      className={cn(
        "rounded-xl border-2 overflow-hidden cursor-pointer transition-all",
        selected ? "border-primary shadow-md shadow-primary/20" : "border-border hover:border-muted-foreground/30"
      )}
    >
      {/* Thumbnail */}
      <div
        className="h-24 relative"
        style={{ background: `linear-gradient(135deg, ${template.thumbFrom}, ${template.thumbTo})` }}
      >
        <div className="absolute inset-x-2 top-2 bg-black/20 backdrop-blur-sm rounded-md px-2 py-1 flex items-center gap-1.5">
          <div className="flex gap-0.5">
            <div className="w-1 h-1 rounded-full bg-red-400/70" />
            <div className="w-1 h-1 rounded-full bg-yellow-400/70" />
            <div className="w-1 h-1 rounded-full bg-green-400/70" />
          </div>
          <div className="flex-1 text-[7px] text-white/50 truncate text-center">yourbusiness.com</div>
        </div>
        <div className="absolute inset-x-2 bottom-2 grid grid-cols-3 gap-1">
          {icons.map((ic, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded px-1 py-0.5 text-center">
              <span className="text-[9px]">{ic}</span>
            </div>
          ))}
        </div>
        {template.featured && (
          <div className="absolute top-1.5 right-1.5 bg-orange-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <Star className="w-1.5 h-1.5 fill-current" /> Hot
          </div>
        )}
        {selected && (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-primary drop-shadow-lg" />
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-2.5 bg-card">
        <p className="text-xs font-bold text-foreground truncate">{template.name}</p>
        <p className="text-[10px] text-muted-foreground truncate">{template.category}</p>
        {selected && (
          <div className="mt-2 flex gap-1" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onModeChange("theme")}
              className={cn("flex-1 flex items-center justify-center gap-0.5 text-[9px] font-semibold py-1 rounded-md border transition-all", mode === "theme" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50")}
            >
              <Layout className="w-2.5 h-2.5" /> Theme
            </button>
            <button
              onClick={() => onModeChange("full")}
              className={cn("flex-1 flex items-center justify-center gap-0.5 text-[9px] font-semibold py-1 rounded-md border transition-all", mode === "full" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50")}
            >
              <Sparkles className="w-2.5 h-2.5" /> Full Demo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Step5({ onNext, initialSlug, initialMode }: {
  onNext: (templateSlug: string, mode: "theme" | "full") => void;
  initialSlug?: string;
  initialMode?: "theme" | "full";
}) {
  const params = useSearchParams();
  const urlSlug = params.get("template") ?? initialSlug ?? "";
  const urlMode = (params.get("mode") as "theme" | "full") ?? initialMode ?? "full";

  const [category, setCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string>(urlSlug || TEMPLATES[0].slug);
  const [mode, setMode] = useState<"theme" | "full">(urlMode);

  const filtered = TEMPLATES.filter(t => {
    const matchCat = category === "All" || t.category === category;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()) || t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const selectedTemplate = TEMPLATES.find(t => t.slug === selected);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Pick a template</h2>
        <p className="text-muted-foreground mt-1">Choose a starting point. You can switch theme or import demo content at any time.</p>
      </div>

      {/* Search */}
      <Input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search templates…"
        className="h-9 text-sm"
      />

      {/* Category pills */}
      <div className="flex gap-1.5 flex-wrap">
        {["All", ...TEMPLATE_CATEGORIES.filter(c => c !== "All").slice(0, 8)].map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "px-3 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap border",
              category === cat ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"
            )}
          >
            {cat}
          </button>
        ))}
        {TEMPLATE_CATEGORIES.filter(c => c !== "All").length > 8 && (
          <button onClick={() => setCategory("All")} className="px-3 py-1 rounded-full text-[11px] font-semibold border border-dashed border-border text-muted-foreground hover:border-primary/40 transition-all">
            +{TEMPLATE_CATEGORIES.filter(c => c !== "All").length - 8} more
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
        {/* Blank option */}
        {(category === "All" || !search) && (
          <div
            onClick={() => setSelected("blank")}
            className={cn("rounded-xl border-2 overflow-hidden cursor-pointer transition-all", selected === "blank" ? "border-primary shadow-md" : "border-border hover:border-muted-foreground/30")}
          >
            <div className="h-24 bg-muted flex items-center justify-center">
              {selected === "blank" ? <CheckCircle className="w-8 h-8 text-primary" /> : <span className="text-2xl">⬜</span>}
            </div>
            <div className="p-2.5 bg-card">
              <p className="text-xs font-bold text-foreground">Blank Site</p>
              <p className="text-[10px] text-muted-foreground">Start from scratch</p>
            </div>
          </div>
        )}
        {filtered.map(t => (
          <TemplateMiniCard
            key={t.slug}
            template={t}
            selected={selected === t.slug}
            mode={mode}
            onSelect={() => setSelected(t.slug)}
            onModeChange={setMode}
          />
        ))}
      </div>

      {/* Selected summary */}
      {selectedTemplate && selected !== "blank" && (
        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${selectedTemplate.thumbFrom}, ${selectedTemplate.thumbTo})` }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">{selectedTemplate.name}</p>
            <p className="text-xs text-muted-foreground">{mode === "full" ? "Full demo content" : "Theme only"} · {selectedTemplate.pages} pages</p>
          </div>
          <a
            href={`/templates/${selectedTemplate.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </a>
        </div>
      )}

      <Button size="lg" className="w-full" onClick={() => onNext(selected, mode)}>
        {selected === "blank" ? "Start with blank site" : `Use ${selectedTemplate?.name ?? selected} (${mode === "full" ? "Full Demo" : "Theme Only"})`}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Step 6: Launching ────────────────────────────────────────────────────────

function Step6({
  siteName, slug, domainChoice, planId, payMethod, templateId, templateMode,
}: {
  siteName: string; slug: string;
  domainChoice: { type: DomainOption; domain?: string };
  planId: string; payMethod: PayMethod; templateId: string; templateMode: "theme" | "full";
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"creating" | "done" | "error">("creating");
  const [siteUrl, setSiteUrl] = useState("");
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const res = await fetch("/api/onboarding/create-tenant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteName, slug, userId: user.id, planId, payMethod, templateId, templateMode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        if (domainChoice.type !== "subdomain" && domainChoice.domain) {
          await fetch("/api/domain/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tenantId: data.tenantId, domain: domainChoice.domain, type: domainChoice.type }),
          });
        }

        await fetch("/api/onboarding/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantId: data.tenantId }),
        });

        if (!cancelled) {
          setSiteUrl(`${ROOT.includes("localhost") ? "http" : "https"}://${slug}.${ROOT}`);
          setStatus("done");
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          toast.error(err instanceof Error ? err.message : "Setup failed");
        }
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "creating") return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="h-9 w-9 text-primary animate-pulse" />
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold">Setting up your site…</h2>
        <p className="text-muted-foreground">This takes just a moment.</p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {["Creating workspace", "Configuring database", "Setting up storage", "Applying template"].map((s, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
            <span className="text-muted-foreground">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (status === "error") return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="text-muted-foreground text-sm">We couldn't set up your site. Please try again or contact support.</p>
      <Button onClick={() => window.location.reload()}>Try again</Button>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
        <CheckCircle className="h-10 w-10 text-green-500" />
      </div>
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">🎉 {siteName} is live!</h2>
        <p className="text-muted-foreground">
          {payMethod === "trial"
            ? "Your 24-hour trial has started. You'll get a reminder before it ends."
            : payMethod === "manual"
            ? "Our sales team will reach out within 1 business day. Your trial is active."
            : "Your site is ready. Start building your pages."}
        </p>
      </div>
      {domainChoice.type === "connect" && domainChoice.domain && (
        <div className="rounded-xl border bg-muted/50 p-4 text-left w-full space-y-3">
          <p className="text-sm font-semibold flex items-center gap-2"><Globe className="h-4 w-4" /> DNS Setup Required</p>
          <p className="text-xs text-muted-foreground">Add one of these at your domain registrar:</p>
          <div className="bg-background rounded-lg p-3 font-mono text-xs space-y-1">
            <p className="text-muted-foreground">A record:</p>
            <p>Type: A&nbsp;&nbsp; Name: @&nbsp;&nbsp; Value: 76.76.21.21</p>
          </div>
          <p className="text-[10px] text-muted-foreground">DNS can take up to 48 hours to propagate.</p>
        </div>
      )}
      <div className="flex gap-3 w-full">
        <Button variant="outline" className="flex-1 gap-2" asChild>
          <a href={siteUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /> View Site</a>
        </Button>
        <Button className="flex-1 gap-2" onClick={() => router.push("/dashboard")}>
          Go to Dashboard <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const params = useSearchParams();
  const [step, setStep] = useState(0);
  const [planId, setPlanId] = useState("standard");
  const [payMethod, setPayMethod] = useState<PayMethod>("trial");
  const [siteName, setSiteName] = useState("");
  const [slug, setSlug] = useState("");
  const [domainChoice, setDomainChoice] = useState<{ type: DomainOption; domain?: string }>({ type: "subdomain" });
  const [templateId, setTemplateId] = useState(params.get("template") ?? "blank");
  const [templateMode, setTemplateMode] = useState<"theme" | "full">((params.get("mode") as "theme" | "full") ?? "full");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-tight">Passive Coder</h1>
          <p className="text-sm text-muted-foreground mt-1">Let&apos;s get your site live in minutes</p>
        </div>
        <div className="bg-card border rounded-2xl p-8 shadow-sm">
          <StepBar current={step} />
          {step === 0 && <Step0 onNext={p => { setPlanId(p); setStep(1); }} />}
          {step === 1 && <Step1 planId={planId} onNext={m => { setPayMethod(m); setStep(2); }} />}
          {step === 2 && <Step2 onNext={n => { setSiteName(n); setStep(3); }} />}
          {step === 3 && <Step3 siteName={siteName} onNext={s => { setSlug(s); setStep(4); }} />}
          {step === 4 && <Step4 slug={slug} onNext={d => { setDomainChoice(d); setStep(5); }} />}
          {step === 5 && (
            <Step5
              initialSlug={templateId}
              initialMode={templateMode}
              onNext={(slug, m) => { setTemplateId(slug); setTemplateMode(m); setStep(6); }}
            />
          )}
          {step === 6 && (
            <Step6
              siteName={siteName} slug={slug} domainChoice={domainChoice}
              planId={planId} payMethod={payMethod}
              templateId={templateId} templateMode={templateMode}
            />
          )}
        </div>
        {step > 0 && step < 6 && (
          <button onClick={() => setStep(step - 1)} className="block mx-auto mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}
