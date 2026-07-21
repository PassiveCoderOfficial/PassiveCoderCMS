"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { MarketplaceBookingBlockProps } from "@/types/cms";
import * as LucideIcons from "lucide-react";
import { Wrench, Loader2, CheckCircle, Store, Calendar, Clock, MapPin, Shapes, Check } from "lucide-react";
import { MapPicker } from "@/components/donors/donor-map";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const MAP_DEFAULT_CENTER = { lat: 1.3521, lng: 103.8198 };

interface Subcategory { id: string; name: string; sort_order: number; }
interface Category { id: string; name: string; slug: string; icon: string | null; service_subcategories: Subcategory[]; }
interface VendorOption { subcategory_id: string; price: number | null; vendors: { id: string; name: string; status: string } }
interface Slot { start: string; end: string }

/** Same dynamic Lucide lookup pattern as ServiceIcon in
 *  src/components/blocks/services/services-block.tsx. */
function CategoryIcon({ name, className = "w-5 h-5" }: { name: string | null; className?: string }) {
  const Icon = name ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] : null;
  return Icon ? <Icon className={className} /> : <Shapes className={className} />;
}

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtDay(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short" });
}
function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const inputCls = "w-full border border-border bg-background rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
const chipCls = "flex flex-col items-center gap-1.5 px-3 py-4 rounded-xl border text-xs text-center font-medium transition-all duration-150";

/** Small numbered progress indicator across the booking steps — the flow
 *  has a real sequence (service → provider → time → details), worth
 *  surfacing so it doesn't read as a flat unstructured form. */
function StepDots({ steps, active }: { steps: string[]; active: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 transition-colors",
            i < active ? "bg-primary text-primary-foreground" : i === active ? "bg-primary/15 text-primary border-2 border-primary" : "bg-muted text-muted-foreground"
          )}>
            {i < active ? <Check className="w-3 h-3" /> : i + 1}
          </div>
          <span className={cn("text-xs hidden sm:inline", i <= active ? "text-foreground font-medium" : "text-muted-foreground")}>{label}</span>
          {i < steps.length - 1 && <div className="w-4 sm:w-8 h-px bg-border" />}
        </div>
      ))}
    </div>
  );
}

export function MarketplaceBookingBlock({ block }: { block: MarketplaceBookingBlockProps }) {
  return (
    <Suspense fallback={<div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}>
      <MarketplaceBookingBlockInner block={block} />
    </Suspense>
  );
}

function MarketplaceBookingBlockInner({ block }: { block: MarketplaceBookingBlockProps }) {
  const { data } = block;
  const accent = data.accentColor || "#4f46e5";
  const searchParams = useSearchParams();
  const preselectCategory = searchParams.get("category");

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
      .then((d) => {
        const cats: Category[] = d.categories ?? [];
        setCategories(cats);
        setVendorServices(d.vendorServices ?? []);
        if (preselectCategory) {
          const match = cats.find((c) => c.id === preselectCategory || c.slug === preselectCategory);
          if (match) setCategoryId(match.id);
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <section className="py-20 px-4 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-9 h-9" style={{ color: accent }} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Request received!</h2>
        <p className="text-muted-foreground">We&apos;ll confirm your booking shortly.</p>
      </section>
    );
  }

  const stepIndex = vendorId ? 2 : subcategoryId ? 1 : 0;

  return (
    <section className="py-16 sm:py-20 px-4 max-w-2xl mx-auto">
      {data.title && <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">{data.title}</h2>}
      {data.subtitle && <p className="text-muted-foreground text-center mb-8 max-w-md mx-auto">{data.subtitle}</p>}

      {loading ? (
        <div className="flex justify-center py-14"><Loader2 className="w-6 h-6 animate-spin" style={{ color: accent }} /></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-8 shadow-sm">
          <StepDots steps={["Service", "Provider", "Details"]} active={stepIndex} />

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold flex items-center gap-1.5 mb-2"><Wrench className="w-4 h-4" style={{ color: accent }} /> What do you need help with?</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {categories.map((c) => {
                  const active = c.id === categoryId;
                  return (
                    <button key={c.id} type="button"
                      onClick={() => { setCategoryId(c.id); setSubcategoryId(""); setVendorId(""); }}
                      className={cn(chipCls, active ? "shadow-sm" : "border-border bg-background hover:border-primary/40 hover:bg-primary/5")}
                      style={active ? { borderColor: accent, backgroundColor: accent, color: "#fff" } : undefined}>
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
                  value={subcategoryId} onChange={(e) => { setSubcategoryId(e.target.value); setVendorId(""); }}>
                  <option value="">Select a service</option>
                  {categories.find((c) => c.id === categoryId)?.service_subcategories.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {subcategoryId && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-sm font-semibold flex items-center gap-1.5 mb-2"><Store className="w-4 h-4" style={{ color: accent }} /> Provider</label>
                <select className={inputCls} value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
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
              <div className="animate-in fade-in slide-in-from-top-1 duration-200 space-y-3 border-t border-border pt-5">
                <div>
                  <label className="text-sm font-semibold flex items-center gap-1.5 mb-2"><Calendar className="w-4 h-4" style={{ color: accent }} /> Pick a day</label>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                    {days.map((d) => {
                      const key = iso(d);
                      const active = key === selectedDate;
                      return (
                        <button key={key} type="button" onClick={() => setSelectedDate(key)}
                          className={cn("shrink-0 flex flex-col items-center px-3.5 py-2 rounded-lg border text-xs transition-colors",
                            active ? "shadow-sm" : "border-border bg-background hover:border-primary/40")}
                          style={active ? { backgroundColor: accent, borderColor: accent, color: "#fff" } : undefined}>
                          <span className="opacity-80">{fmtDay(d)}</span><span className="font-semibold">{fmtDate(d)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold flex items-center gap-1.5 mb-2"><Clock className="w-4 h-4" style={{ color: accent }} /> Pick a time</label>
                  {loadingSlots ? (
                    <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" style={{ color: accent }} /></div>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-3 text-center bg-muted/50 rounded-lg">No open times this day — try another date.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {slots.map((s) => {
                        const active = s.start === selectedSlot;
                        return (
                          <button key={s.start} type="button" onClick={() => setSelectedSlot(s.start)}
                            className={cn("px-2 py-2 rounded-lg border text-xs font-medium transition-colors",
                              active ? "shadow-sm" : "border-border bg-background hover:border-primary/40")}
                            style={active ? { backgroundColor: accent, borderColor: accent, color: "#fff" } : undefined}>
                            {s.start}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

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
                  <MapPin className="w-4 h-4" /> Pin your location <span className="text-xs">(optional, helps match nearby providers)</span>
                </label>
                <div className="rounded-xl overflow-hidden border border-border">
                  <MapPicker value={pin} onChange={setPin} defaultCenter={MAP_DEFAULT_CENTER} defaultZoom={11} height={200} autoGps />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

            <button type="submit" disabled={submitting}
              className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50 shadow-sm hover:shadow-md transition-shadow"
              style={{ backgroundColor: accent }}>
              {submitting ? "Submitting…" : (data.submitLabel || "Request Booking")}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
