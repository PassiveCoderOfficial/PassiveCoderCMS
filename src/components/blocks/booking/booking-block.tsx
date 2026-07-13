"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { BookingBlockProps } from "@/types/cms";
import { Calendar, Clock, Loader2, CheckCircle } from "lucide-react";

interface Slot { start: string; end: string }

function fmtDay(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short" });
}
function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function BookingBlock({ block }: { block: BookingBlockProps }) {
  const { data } = block;
  const accent = data.accentColor || "#4f46e5";

  const days = useMemo(() => {
    const out: Date[] = [];
    const today = new Date();
    for (let i = 0; i < (data.daysToShow || 14); i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      out.push(d);
    }
    return out;
  }, [data.daysToShow]);

  const [selectedDate, setSelectedDate] = useState<string>(iso(days[0]));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSlots = useCallback(async (date: string) => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const res = await fetch(`/api/bookings/public?date=${date}`);
      const d = await res.json();
      setSlots(res.ok ? d.slots ?? [] : []);
    } catch {
      setSlots([]);
    }
    setLoadingSlots(false);
  }, []);

  useEffect(() => { loadSlots(selectedDate); }, [selectedDate, loadSlots]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, start: selectedSlot, ...form }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Something went wrong — please try again.");
        if (res.status === 409) loadSlots(selectedDate);
      } else {
        setDone(d.message ?? "Your appointment request has been received!");
      }
    } catch {
      setError("Something went wrong — please try again.");
    }
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="max-w-xl mx-auto text-center py-12 flex flex-col items-center gap-3">
        <CheckCircle className="w-12 h-12" style={{ color: accent }} />
        <p className="font-semibold text-lg">{done}</p>
        <p className="text-sm text-muted-foreground">A confirmation email is on its way to you.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {(data.title || data.subtitle) && (
        <div className="text-center mb-8">
          {data.title && <h2 className="text-3xl font-bold mb-2">{data.title}</h2>}
          {data.subtitle && <p className="text-muted-foreground">{data.subtitle}</p>}
        </div>
      )}

      {/* Day picker */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {days.map((d) => {
          const v = iso(d);
          const active = v === selectedDate;
          return (
            <button key={v} type="button" onClick={() => setSelectedDate(v)}
              className="flex flex-col items-center px-4 py-2.5 rounded-xl border text-sm shrink-0 transition-colors"
              style={active
                ? { backgroundColor: accent, borderColor: accent, color: "#fff" }
                : { borderColor: "var(--border, #e5e7eb)" }}>
              <span className="text-xs opacity-80">{fmtDay(d)}</span>
              <span className="font-semibold">{fmtDate(d)}</span>
            </button>
          );
        })}
      </div>

      {/* Slots */}
      <div className="mb-6">
        {loadingSlots ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : slots.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">
            No available times on this day — try another date.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map((s) => {
              const active = selectedSlot === s.start;
              return (
                <button key={s.start} type="button" onClick={() => setSelectedSlot(s.start)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors"
                  style={active
                    ? { backgroundColor: accent, borderColor: accent, color: "#fff" }
                    : { borderColor: "var(--border, #e5e7eb)" }}>
                  <Clock className="w-3.5 h-3.5" /> {s.start}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Details form */}
      {selectedSlot && (
        <form onSubmit={submit} className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="w-4 h-4" style={{ color: accent }} />
            {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} at {selectedSlot}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input required placeholder="Your name" value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input required type="email" placeholder="Email" value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          {data.showPhone && (
            <input placeholder="Phone / WhatsApp" value={form.phone}
              onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          )}
          {data.showMessage && (
            <textarea rows={3} placeholder="Anything we should know?" value={form.message}
              onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 text-white px-6 py-3 rounded-lg font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: accent }}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            {data.submitLabel || "Book Appointment"}
          </button>
        </form>
      )}
    </div>
  );
}
