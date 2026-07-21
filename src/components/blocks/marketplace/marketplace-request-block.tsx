"use client";

import React, { useEffect, useState } from "react";
import type { MarketplaceRequestBlockProps } from "@/types/cms";
import * as LucideIcons from "lucide-react";
import { Wrench, Loader2, CheckCircle, MapPin, AlertTriangle, Shapes, Zap } from "lucide-react";
import { MapPicker } from "@/components/donors/donor-map";
import { cn } from "@/lib/utils";

const MAP_DEFAULT_CENTER = { lat: 1.3521, lng: 103.8198 };
const URGENT_COLOR = "#dc2626";

interface Subcategory { id: string; name: string; sort_order: number; }
interface Category { id: string; name: string; slug: string; icon: string | null; service_subcategories: Subcategory[]; }

function CategoryIcon({ name, className = "w-5 h-5" }: { name: string | null; className?: string }) {
  const Icon = name ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] : null;
  return Icon ? <Icon className={className} /> : <Shapes className={className} />;
}

const inputCls = "w-full border border-border bg-background rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
const chipCls = "flex flex-col items-center gap-1.5 px-3 py-4 rounded-xl border text-xs text-center font-medium transition-all duration-150";

/** "Post a request" — a second, parallel entry point alongside the
 *  pick-a-vendor-and-book-a-slot flow in marketplace-booking-block.tsx.
 *  No vendor is chosen here; urgent requests notify nearby vendors instead
 *  (see src/lib/marketplace/notifyVendors.ts + the escalate-requests cron). */
export function MarketplaceRequestBlock({ block }: { block: MarketplaceRequestBlockProps }) {
  const { data } = block;
  const accent = data.accentColor || "#4f46e5";

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [urgency, setUrgency] = useState<"regular" | "urgent">("regular");
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [form, setForm] = useState({ customer_name: "", customer_phone: "", address: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/marketplace/public")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subcategoryId) { setError("Please choose a service"); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/marketplace/public/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subcategory_id: subcategoryId,
          urgency,
          ...form,
          lat: pin?.lat ?? null,
          lng: pin?.lng ?? null,
        }),
      });
      const d = await res.json();
      if (!res.ok) setError(d.error ?? "Something went wrong — please try again.");
      else setDone(true);
    } catch {
      setError("Something went wrong — please try again.");
    }
    setSubmitting(false);
  }

  const currentAccent = urgency === "urgent" ? URGENT_COLOR : accent;

  if (done) {
    return (
      <section className="py-20 px-4 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: `${currentAccent}1a` }}>
          <CheckCircle className="w-9 h-9" style={{ color: currentAccent }} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Request posted!</h2>
        <p className="text-muted-foreground">
          {urgency === "urgent" ? "Nearby providers have been notified — you'll hear back soon." : "We'll be in touch shortly."}
        </p>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-20 px-4 max-w-2xl mx-auto">
      {data.title && <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">{data.title}</h2>}
      {data.subtitle && <p className="text-muted-foreground text-center mb-8 max-w-md mx-auto">{data.subtitle}</p>}

      {loading ? (
        <div className="flex justify-center py-14"><Loader2 className="w-6 h-6 animate-spin" style={{ color: accent }} /></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-8 shadow-sm">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold mb-2 block">How urgent is this?</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setUrgency("regular")}
                  className={cn("px-3 py-3 rounded-xl border text-sm font-medium transition-all",
                    urgency === "regular" ? "shadow-sm" : "border-border bg-background hover:border-primary/40")}
                  style={urgency === "regular" ? { borderColor: accent, backgroundColor: accent, color: "#fff" } : undefined}>
                  Regular
                </button>
                <button type="button" onClick={() => setUrgency("urgent")}
                  className={cn("px-3 py-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-1.5 transition-all",
                    urgency === "urgent" ? "shadow-sm" : "border-border bg-background hover:border-red-300")}
                  style={urgency === "urgent" ? { borderColor: URGENT_COLOR, backgroundColor: URGENT_COLOR, color: "#fff" } : undefined}>
                  <Zap className="w-3.5 h-3.5" /> Urgent
                </button>
              </div>
              {urgency === "urgent" && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1.5 bg-red-50 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Nearby providers get notified right away, with follow-up waves every 10 minutes until someone responds.
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold flex items-center gap-1.5 mb-2"><Wrench className="w-4 h-4" style={{ color: currentAccent }} /> What do you need help with?</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {categories.map((c) => {
                  const active = c.id === categoryId;
                  return (
                    <button key={c.id} type="button"
                      onClick={() => { setCategoryId(c.id); setSubcategoryId(""); }}
                      className={cn(chipCls, active ? "shadow-sm" : "border-border bg-background hover:border-primary/40 hover:bg-primary/5")}
                      style={active ? { borderColor: currentAccent, backgroundColor: currentAccent, color: "#fff" } : undefined}>
                      <CategoryIcon name={c.icon} />
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {categoryId && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-sm font-semibold mb-2 block">Which service?</label>
                <select required className={inputCls}
                  value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)}>
                  <option value="">Select a service</option>
                  {categories.find((c) => c.id === categoryId)?.service_subcategories.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <textarea placeholder="Describe the issue" rows={3} className={inputCls}
              value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />

            <div className="space-y-3 border-t border-border pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input required placeholder="Your name" className={inputCls}
                  value={form.customer_name} onChange={(e) => setForm((p) => ({ ...p, customer_name: e.target.value }))} />
                <input required placeholder="Phone number" className={inputCls}
                  value={form.customer_phone} onChange={(e) => setForm((p) => ({ ...p, customer_phone: e.target.value }))} />
              </div>
              <input placeholder="Address" className={inputCls}
                value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />

              <div>
                <label className="text-sm font-medium flex items-center gap-1.5 mb-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" /> Pin your location
                </label>
                <div className="rounded-xl overflow-hidden border border-border">
                  <MapPicker value={pin} onChange={setPin} defaultCenter={MAP_DEFAULT_CENTER} defaultZoom={11} height={200} autoGps />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

            <button type="submit" disabled={submitting}
              className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50 shadow-sm hover:shadow-md transition-shadow"
              style={{ backgroundColor: currentAccent }}>
              {submitting ? "Submitting…" : (data.submitLabel || "Post Request")}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
