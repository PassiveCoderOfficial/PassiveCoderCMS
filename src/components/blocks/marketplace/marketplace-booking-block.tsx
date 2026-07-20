"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { MarketplaceBookingBlockProps } from "@/types/cms";
import * as LucideIcons from "lucide-react";
import { Wrench, Loader2, CheckCircle, Store, Calendar, Clock, MapPin, Shapes } from "lucide-react";
import { MapPicker } from "@/components/donors/donor-map";

const MAP_DEFAULT_CENTER = { lat: 1.3521, lng: 103.8198 };

interface Subcategory { id: string; name: string; sort_order: number; }
interface Category { id: string; name: string; slug: string; icon: string | null; service_subcategories: Subcategory[]; }

/** Same dynamic Lucide lookup pattern as ServiceIcon in
 *  src/components/blocks/services/services-block.tsx. */
function CategoryIcon({ name, className = "w-5 h-5" }: { name: string | null; className?: string }) {
  const Icon = name ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] : null;
  return Icon ? <Icon className={className} /> : <Shapes className={className} />;
}
interface VendorOption { subcategory_id: string; price: number | null; vendors: { id: string; name: string; status: string } }
interface Slot { start: string; end: string }

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtDay(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short" });
}
function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function MarketplaceBookingBlock({ block }: { block: MarketplaceBookingBlockProps }) {
  const { data } = block;
  const accent = data.accentColor || "#4f46e5";

  const [categories, setCategories] = useState<Category[]>([]);
  const [vendorServices, setVendorServices] = useState<VendorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [vendorId, setVendorId] = useState("");

  const days = useMemo(() => {
    const out: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) { const d = new Date(today); d.setDate(today.getDate() + i); out.push(d); }
    return out;
  }, []);
  const [selectedDate, setSelectedDate] = useState<string>(iso(days[0]));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [form, setForm] = useState({ customer_name: "", customer_phone: "", address: "" });
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/marketplace/public")
      .then((r) => r.json())
      .then((d) => { setCategories(d.categories ?? []); setVendorServices(d.vendorServices ?? []); })
      .finally(() => setLoading(false));
  }, []);

  const vendorOptions = vendorServices.filter((v) => v.subcategory_id === subcategoryId);

  const loadSlots = useCallback(async (vId: string, date: string) => {
    if (!vId) { setSlots([]); return; }
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const res = await fetch(`/api/marketplace/public/slots?vendor_id=${vId}&date=${date}`);
      const d = await res.json();
      setSlots(res.ok ? d.slots ?? [] : []);
    } catch {
      setSlots([]);
    }
    setLoadingSlots(false);
  }, []);

  useEffect(() => { loadSlots(vendorId, selectedDate); }, [vendorId, selectedDate, loadSlots]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subcategoryId) { setError("Please choose a service"); return; }
    if (vendorId && !selectedSlot) { setError("Please pick a time"); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/marketplace/public/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subcategory_id: subcategoryId,
          vendor_id: vendorId || null,
          scheduled_date: vendorId ? selectedDate : null,
          scheduled_time: vendorId ? selectedSlot : null,
          ...form,
          lat: pin?.lat ?? null,
          lng: pin?.lng ?? null,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Something went wrong — please try again.");
        if (res.status === 409) loadSlots(vendorId, selectedDate);
      } else {
        setDone(true);
      }
    } catch {
      setError("Something went wrong — please try again.");
    }
    setSubmitting(false);
  }

  if (done) {
    return (
      <section className="py-16 px-4 text-center">
        <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: accent }} />
        <h2 className="text-xl font-semibold">Request received!</h2>
        <p className="text-gray-500 mt-1">We&apos;ll confirm your booking shortly.</p>
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
                    onClick={() => { setCategoryId(c.id); setSubcategoryId(""); setVendorId(""); }}
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
                value={subcategoryId} onChange={(e) => { setSubcategoryId(e.target.value); setVendorId(""); }}>
                <option value="">Select a service</option>
                {categories.find((c) => c.id === categoryId)?.service_subcategories.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {subcategoryId && (
            <div>
              <label className="text-sm font-medium flex items-center gap-1.5 mb-1"><Store className="w-4 h-4" /> Provider</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
                <option value="">Choose a provider to see live availability</option>
                {vendorOptions.map((v) => (
                  <option key={v.vendors.id} value={v.vendors.id}>
                    {v.vendors.name}{v.price != null ? ` — $${Number(v.price).toFixed(2)}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {vendorId && (
            <div>
              <label className="text-sm font-medium flex items-center gap-1.5 mb-1"><Calendar className="w-4 h-4" /> Pick a day</label>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {days.map((d) => {
                  const key = iso(d);
                  const active = key === selectedDate;
                  return (
                    <button key={key} type="button" onClick={() => setSelectedDate(key)}
                      className="shrink-0 flex flex-col items-center px-3 py-2 rounded-lg border text-xs"
                      style={active ? { backgroundColor: accent, borderColor: accent, color: "#fff" } : { borderColor: "#e5e7eb" }}>
                      <span>{fmtDay(d)}</span><span className="font-medium">{fmtDate(d)}</span>
                    </button>
                  );
                })}
              </div>

              <label className="text-sm font-medium flex items-center gap-1.5 mt-3 mb-1"><Clock className="w-4 h-4" /> Pick a time</label>
              {loadingSlots ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" style={{ color: accent }} /></div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">No open times this day — try another date.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((s) => {
                    const active = s.start === selectedSlot;
                    return (
                      <button key={s.start} type="button" onClick={() => setSelectedSlot(s.start)}
                        className="px-2 py-1.5 rounded-lg border text-xs"
                        style={active ? { backgroundColor: accent, borderColor: accent, color: "#fff" } : { borderColor: "#e5e7eb" }}>
                        {s.start}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input required placeholder="Your name" className="border rounded-lg px-3 py-2 text-sm"
              value={form.customer_name} onChange={(e) => setForm((p) => ({ ...p, customer_name: e.target.value }))} />
            <input required placeholder="Phone number" className="border rounded-lg px-3 py-2 text-sm"
              value={form.customer_phone} onChange={(e) => setForm((p) => ({ ...p, customer_phone: e.target.value }))} />
          </div>
          <input placeholder="Address" className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
          <div>
            <label className="text-sm font-medium flex items-center gap-1.5 mb-1"><MapPin className="w-4 h-4" /> Pin your location (optional, helps match nearby providers)</label>
            <MapPicker value={pin} onChange={setPin} defaultCenter={MAP_DEFAULT_CENTER} defaultZoom={11} height={200} autoGps />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button type="submit" disabled={submitting}
            className="w-full py-2.5 rounded-lg text-white font-medium disabled:opacity-50"
            style={{ backgroundColor: accent }}>
            {submitting ? "Submitting…" : (data.submitLabel || "Request Booking")}
          </button>
        </form>
      )}
    </section>
  );
}
