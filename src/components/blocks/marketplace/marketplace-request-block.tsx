"use client";

import React, { useEffect, useState } from "react";
import type { MarketplaceRequestBlockProps } from "@/types/cms";
import * as LucideIcons from "lucide-react";
import { Wrench, Loader2, CheckCircle, MapPin, AlertTriangle, Shapes } from "lucide-react";
import { MapPicker } from "@/components/donors/donor-map";

const MAP_DEFAULT_CENTER = { lat: 1.3521, lng: 103.8198 };

interface Subcategory { id: string; name: string; sort_order: number; }
interface Category { id: string; name: string; slug: string; icon: string | null; service_subcategories: Subcategory[]; }

function CategoryIcon({ name, className = "w-5 h-5" }: { name: string | null; className?: string }) {
  const Icon = name ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] : null;
  return Icon ? <Icon className={className} /> : <Shapes className={className} />;
}

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

  if (done) {
    return (
      <section className="py-16 px-4 text-center">
        <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: accent }} />
        <h2 className="text-xl font-semibold">Request posted!</h2>
        <p className="text-gray-500 mt-1">
          {urgency === "urgent" ? "Nearby providers have been notified." : "We'll be in touch shortly."}
        </p>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 max-w-2xl mx-auto">
      {data.title && <h2 className="text-2xl font-bold text-center mb-2">{data.title}</h2>}
      {data.subtitle && <p className="text-gray-500 text-center mb-8">{data.subtitle}</p>}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: accent }} /></div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-1.5 mb-1"><Wrench className="w-4 h-4" /> What do you need help with?</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {categories.map((c) => {
                const active = c.id === categoryId;
                return (
                  <button key={c.id} type="button"
                    onClick={() => { setCategoryId(c.id); setSubcategoryId(""); }}
                    className="flex flex-col items-center gap-1 px-2 py-3 rounded-lg border text-xs text-center"
                    style={active ? { borderColor: accent, backgroundColor: accent, color: "#fff" } : { borderColor: "#e5e7eb" }}>
                    <CategoryIcon name={c.icon} />
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {categoryId && (
            <div>
              <label className="text-sm font-medium mb-1 block">Which service?</label>
              <select required className="w-full border rounded-lg px-3 py-2 text-sm"
                value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)}>
                <option value="">Select a service</option>
                {categories.find((c) => c.id === categoryId)?.service_subcategories.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1 block">How urgent is this?</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setUrgency("regular")}
                className="flex-1 px-3 py-2 rounded-lg border text-sm"
                style={urgency === "regular" ? { borderColor: accent, backgroundColor: accent, color: "#fff" } : { borderColor: "#e5e7eb" }}>
                Regular
              </button>
              <button type="button" onClick={() => setUrgency("urgent")}
                className="flex-1 px-3 py-2 rounded-lg border text-sm flex items-center justify-center gap-1.5"
                style={urgency === "urgent" ? { borderColor: "#dc2626", backgroundColor: "#dc2626", color: "#fff" } : { borderColor: "#e5e7eb" }}>
                <AlertTriangle className="w-3.5 h-3.5" /> Urgent
              </button>
            </div>
            {urgency === "urgent" && (
              <p className="text-xs text-gray-500 mt-1">Nearby providers get notified right away.</p>
            )}
          </div>

          <textarea placeholder="Describe the issue" rows={3} className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input required placeholder="Your name" className="border rounded-lg px-3 py-2 text-sm"
              value={form.customer_name} onChange={(e) => setForm((p) => ({ ...p, customer_name: e.target.value }))} />
            <input required placeholder="Phone number" className="border rounded-lg px-3 py-2 text-sm"
              value={form.customer_phone} onChange={(e) => setForm((p) => ({ ...p, customer_phone: e.target.value }))} />
          </div>
          <input placeholder="Address" className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />

          <div>
            <label className="text-sm font-medium flex items-center gap-1.5 mb-1"><MapPin className="w-4 h-4" /> Pin your location</label>
            <MapPicker value={pin} onChange={setPin} defaultCenter={MAP_DEFAULT_CENTER} defaultZoom={11} height={200} autoGps />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button type="submit" disabled={submitting}
            className="w-full py-2.5 rounded-lg text-white font-medium disabled:opacity-50"
            style={{ backgroundColor: urgency === "urgent" ? "#dc2626" : accent }}>
            {submitting ? "Submitting…" : (data.submitLabel || "Post Request")}
          </button>
        </form>
      )}
    </section>
  );
}
