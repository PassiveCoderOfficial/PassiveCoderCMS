"use client";

import React, { useEffect, useState } from "react";
import { BedDouble, Bath, Maximize, MapPin, Loader2, CheckCircle2, Building2 } from "lucide-react";
import {
  priceLabel, areaLabel, bedsLabel, titleCase, LISTING_TYPE_LABEL, DISPLAY_CURRENCIES,
  type ReProperty, type AreaUnit,
} from "@/lib/real-estate/format";

// ─── Viewer display preferences (currency + area unit) ──────────────────────
// Per-visitor convenience only, so browser storage is fine; every read/write
// is guarded because storage can be unavailable (private mode, previews).

const PREF_EVENT = "re-prefs-change";

function readPref(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function writePref(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch { /* ignore */ }
  window.dispatchEvent(new Event(PREF_EVENT));
}

export function useDisplayPrefs(defaults?: { currency?: string; unit?: AreaUnit }) {
  const [currency, setCurrency] = useState<string>(defaults?.currency ?? "SAR");
  const [unit, setUnit] = useState<AreaUnit>(defaults?.unit ?? "sqm");

  useEffect(() => {
    const sync = () => {
      const c = readPref("re_currency");
      const u = readPref("re_unit");
      if (c) setCurrency(c);
      if (u === "sqm" || u === "sqft") setUnit(u);
    };
    sync();
    window.addEventListener(PREF_EVENT, sync);
    return () => window.removeEventListener(PREF_EVENT, sync);
  }, []);

  return {
    currency, unit,
    setCurrency: (c: string) => { setCurrency(c); writePref("re_currency", c); },
    setUnit: (u: AreaUnit) => { setUnit(u); writePref("re_unit", u); },
  };
}

export function PrefsToggle({ prefs }: { prefs: ReturnType<typeof useDisplayPrefs> }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="inline-flex rounded-full border bg-card p-0.5">
        {DISPLAY_CURRENCIES.map((c) => (
          <button key={c} type="button" onClick={() => prefs.setCurrency(c)}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors ${prefs.currency === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="inline-flex rounded-full border bg-card p-0.5">
        {(["sqm", "sqft"] as const).map((u) => (
          <button key={u} type="button" onClick={() => prefs.setUnit(u)}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors ${prefs.unit === u ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {u}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Property card ──────────────────────────────────────────────────────────

export type ReCardProperty = Pick<ReProperty,
  "id" | "slug" | "title" | "listing_type" | "property_type" | "status" | "price" | "price_max" | "price_period" |
  "price_on_request" | "currency" | "beds" | "beds_max" | "baths" | "area" | "area_unit" | "city" | "handover" |
  "images" | "featured" | "community" | "developer">;

const STATUS_BADGE: Record<string, string> = { reserved: "Reserved", sold: "Sold", rented: "Rented" };

export function PropertyCard({ p, currency, unit }: { p: ReCardProperty; currency?: string; unit?: AreaUnit }) {
  const img = p.images?.[0];
  const place = [p.community?.name, p.city].filter(Boolean).join(", ");
  const closed = STATUS_BADGE[p.status];
  return (
    <a href={`/properties/${p.slug}`}
      className="group flex flex-col bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={p.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Building2 className="w-10 h-10 text-muted-foreground" /></div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-background/90 backdrop-blur text-foreground">{LISTING_TYPE_LABEL[p.listing_type]}</span>
          {p.featured && !closed && <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary text-primary-foreground">Featured</span>}
          {closed && <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-foreground text-background">{closed}</span>}
        </div>
        {p.developer?.name && (
          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/60 text-white backdrop-blur">by {p.developer.name}</span>
        )}
      </div>
      <div className="flex flex-col flex-1 p-5">
        <p className="text-xl font-bold text-primary">{priceLabel(p, currency)}</p>
        <h3 className="mt-1 font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">{p.title}</h3>
        {place && (
          <p className="mt-1.5 text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{place}</span></p>
        )}
        <div className="mt-auto pt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground border-t mt-4">
          <span className="font-medium text-foreground">{titleCase(p.property_type)}</span>
          {p.beds != null && <span className="flex items-center gap-1"><BedDouble className="w-4 h-4" />{bedsLabel(p.beds, p.beds_max)}</span>}
          {p.baths != null && <span className="flex items-center gap-1"><Bath className="w-4 h-4" />{p.baths}</span>}
          {p.area != null && <span className="flex items-center gap-1"><Maximize className="w-4 h-4" />{areaLabel(p.area, p.area_unit, unit)}</span>}
          {p.listing_type === "offplan" && p.handover && <span className="ml-auto text-xs">Handover {p.handover}</span>}
        </div>
      </div>
    </a>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-card border rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-muted" />
      <div className="p-5 space-y-3"><div className="h-5 w-1/3 bg-muted rounded" /><div className="h-4 w-4/5 bg-muted rounded" /><div className="h-4 w-1/2 bg-muted rounded" /></div>
    </div>
  );
}

// ─── Lead form (used by the lead-form block and property detail page) ──────

export interface LeadFormProps {
  kind: "enquiry" | "brochure" | "valuation" | "viewing" | "consultation";
  propertyId?: string;
  submitLabel?: string;
  successMessage?: string;
  showBudget?: boolean;
  showMessage?: boolean;
  defaultMessage?: string;
  onBrochure?: (url: string | null) => void;
  compact?: boolean;
}

export function LeadForm({ kind, propertyId, submitLabel, successMessage, showBudget, showMessage = true, defaultMessage, onBrochure, compact }: LeadFormProps) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", budget: "", message: defaultMessage ?? "" });
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setState("sending");
    try {
      const res = await fetch("/api/real-estate/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, kind, propertyId, page: typeof window !== "undefined" ? window.location.pathname : null }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Something went wrong"); setState("idle"); return; }
      setState("done");
      if (kind === "brochure") onBrochure?.(d.brochureUrl ?? null);
    } catch {
      setError("Network error — please try again");
      setState("idle");
    }
  };

  if (state === "done") {
    return (
      <div className="text-center py-8 animate-in fade-in">
        <CheckCircle2 className="w-10 h-10 mx-auto text-primary mb-3" />
        <p className="font-semibold">{successMessage || "Thank you — we'll contact you shortly."}</p>
      </div>
    );
  }

  const input = "w-full h-11 px-3.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className={compact ? "space-y-3" : "grid sm:grid-cols-2 gap-3"}>
        <input className={input} placeholder="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className={input} placeholder="WhatsApp number" required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <input className={input} placeholder="Email (optional)" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      {showBudget && (
        <select className={input} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}>
          <option value="">Budget (optional)</option>
          <option>Under SAR 1M</option>
          <option>SAR 1M – 2M</option>
          <option>SAR 2M – 5M</option>
          <option>SAR 5M – 10M</option>
          <option>SAR 10M+</option>
        </select>
      )}
      {showMessage && (
        <textarea className={`${input} h-24 py-2.5 resize-none`} placeholder="How can we help?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button type="submit" disabled={state === "sending"}
        className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
        {state === "sending" && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitLabel || "Send"}
      </button>
      <p className="text-[11px] text-muted-foreground text-center">We reply on WhatsApp, usually within the hour.</p>
    </form>
  );
}

export function logWhatsappClick(propertyId?: string) {
  try {
    navigator.sendBeacon?.("/api/real-estate/public/leads", new Blob([JSON.stringify({ kind: "whatsapp", propertyId, page: window.location.pathname })], { type: "application/json" }));
  } catch { /* ignore */ }
}

export function SectionHeading({ title, subtitle, align = "center" }: { title?: string; subtitle?: string; align?: "center" | "left" }) {
  if (!title && !subtitle) return null;
  return (
    <div className={align === "center" ? "text-center mb-10 max-w-2xl mx-auto" : "mb-8"}>
      {title && <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{title}</h2>}
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
