"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Calendar, Clock, Loader2, CheckCircle } from "lucide-react";
import { DepositBox, type DepositView } from "@/components/booking/deposit-box";

interface Slot { start: string; end: string }

/** Visitor-facing text. English by default; Experts passes EN/AR/BN. */
export const BOOKING_LABELS_EN = {
  needContact: "Please enter your email or phone / WhatsApp number.",
  failed: "Something went wrong — please try again.",
  received: "Your appointment request has been received!",
  emailed: "A confirmation email is on its way to you.",
  willCall: "We will contact you on the number you gave us.",
  manageLater: "Need to change or cancel later?",
  manageLink: "Use your booking link",
  manageInEmail: " (also in your email)",
  noTimes: "No available times on this day — try another date.",
  at: "at",
  name: "Your name",
  email: "Email",
  emailOr: "Email (or phone)",
  phone: "Phone / WhatsApp",
  phoneOr: "Phone / WhatsApp (or email)",
  bothRequired: "Email and phone / WhatsApp are both required.",
  oneRequired: "Give us an email or a phone / WhatsApp number, at least one.",
  messagePh: "Anything we should know?",
  submit: "Book Appointment",
};
export type BookingLabels = typeof BOOKING_LABELS_EN;

export interface BookingWidgetProps {
  /** Slots (GET ?date=) and booking (POST) endpoint. */
  endpoint: string;
  /** Extra query/body fields, e.g. { slug } for an Experts profile. */
  params?: Record<string, string>;
  accent?: string;
  title?: string;
  subtitle?: string;
  daysToShow?: number;
  showMessage?: boolean;
  submitLabel?: string;
  labels?: BookingLabels;
  /** Date formatting locale; undefined = the browser's. */
  locale?: string;
}
function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * The public booking widget: day -> time -> details -> done. One component
 * for the site booking block and Experts profiles; the slot rules live on
 * the server (lib/booking/slots.ts via lib/booking/public-booking.ts).
 */
export function BookingWidget({ endpoint, params, accent: accentProp, title, subtitle, daysToShow, showMessage, submitLabel, labels, locale }: BookingWidgetProps) {
  const L = labels ?? BOOKING_LABELS_EN;
  // No colour set: use the site's brand colour (was a hardcoded purple on every site).
  const accent = accentProp || "hsl(var(--primary))";
  const fmtDay = (d: Date) => d.toLocaleDateString(locale, { weekday: "short" });
  const fmtDate = (d: Date) => d.toLocaleDateString(locale, { month: "short", day: "numeric" });
  const paramKey = JSON.stringify(params ?? {});

  const days = useMemo(() => {
    const out: Date[] = [];
    const today = new Date();
    for (let i = 0; i < (daysToShow || 14); i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      out.push(d);
    }
    return out;
  }, [daysToShow]);

  const [selectedDate, setSelectedDate] = useState<string>(iso(days[0]));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true); // true until the first fetch, so the auto-pick below waits for it
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ message: string; emailed: boolean; manageUrl?: string; token?: string; deposit?: DepositView | null; depositStatus?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Site setting: "either" = email or phone, "both" = both required.
  const [contactReq, setContactReq] = useState<"either" | "both">("either");

  // Only the latest request may update the list: picking a day while the
  // previous day's (slower) request is still in flight used to let the old
  // answer land last and show "No available times" for a day that had them.
  const latestReq = useRef(0);
  const loadSlots = useCallback(async (date: string) => {
    const req = ++latestReq.current;
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const res = await fetch(`${endpoint}?${new URLSearchParams({ ...JSON.parse(paramKey), date })}`);
      const d = await res.json();
      if (req !== latestReq.current) return;
      setSlots(res.ok ? d.slots ?? [] : []);
      if (d.contactRequirement === "both" || d.contactRequirement === "either") setContactReq(d.contactRequirement);
    } catch {
      if (req !== latestReq.current) return;
      setSlots([]);
    }
    setLoadingSlots(false);
  }, [endpoint, paramKey]);

  // Fetching slots for the picked day is the external sync this effect exists for.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadSlots(selectedDate); }, [selectedDate, loadSlots]);

  // Open on the first day that still has free times (later today is often
  // fully past the notice window, which read as "nothing available").
  const autoPicked = useRef(false);
  useEffect(() => {
    if (autoPicked.current || loadingSlots) return;
    if (slots.length) { autoPicked.current = true; return; }
    const i = days.findIndex((d) => iso(d) === selectedDate);
    // Runs once per empty day after its fetch settles, never in a loop (autoPicked).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (i >= 0 && i < Math.min(days.length - 1, 6)) setSelectedDate(iso(days[i + 1]));
    else autoPicked.current = true;
  }, [slots, loadingSlots, selectedDate, days]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    if (contactReq === "either" && !form.email.trim() && !form.phone.trim()) {
      setError(L.needContact);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...params, date: selectedDate, start: selectedSlot, ...form }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? L.failed);
        if (res.status === 409) loadSlots(selectedDate);
      } else {
        setDone({ message: d.message ?? L.received, emailed: d.emailed !== false, manageUrl: d.manageUrl, token: d.token, deposit: d.deposit ?? null, depositStatus: "due" });
      }
    } catch {
      setError(L.failed);
    }
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="max-w-xl mx-auto text-center py-12 flex flex-col items-center gap-3">
        <CheckCircle className="w-12 h-12" style={{ color: accent }} />
        <p className="font-semibold text-lg">{done.message}</p>
        <p className="text-sm text-muted-foreground">
          {done.emailed ? L.emailed : L.willCall}
        </p>
        {done.deposit && done.token && (
          <div className="w-full rounded-2xl border bg-card p-5 text-left">
            <DepositBox deposit={done.deposit} status={done.depositStatus ?? "due"} reference={null}
              onReport={async (reference) => {
                const r = await fetch("/api/bookings/manage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: done.token, action: "payment", reference }) });
                if (r.ok) setDone((x) => (x ? { ...x, depositStatus: "reported" } : x));
                return r.ok;
              }} />
          </div>
        )}
        {done.manageUrl && (
          <p className="text-xs text-muted-foreground">{L.manageLater} <a href={done.manageUrl} className="underline">{L.manageLink}</a>{done.emailed ? L.manageInEmail : ""}.</p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-8">
          {title && <h2 className="text-3xl font-bold mb-2">{title}</h2>}
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
      )}

      {/* Day picker */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {days.map((d) => {
          const v = iso(d);
          const active = v === selectedDate;
          return (
            <button key={v} type="button" onClick={() => setSelectedDate(v)}
              className="flex flex-col items-center px-4 py-2.5 rounded-xl border bg-card text-sm shrink-0 transition-colors"
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
            {L.noTimes}
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map((s) => {
              const active = selectedSlot === s.start;
              return (
                <button key={s.start} type="button" onClick={() => setSelectedSlot(s.start)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border bg-card text-sm transition-colors"
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
            {new Date(selectedDate + "T00:00:00").toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" })} {L.at} {selectedSlot}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input required placeholder={L.name} value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input required={contactReq === "both"} type="email" placeholder={contactReq === "both" ? L.email : L.emailOr} value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          {/* Always shown: phone can be the only contact the customer gives. */}
          <input required={contactReq === "both"} type="tel" placeholder={contactReq === "both" ? L.phone : L.phoneOr} value={form.phone}
            onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <p className="text-xs text-muted-foreground -mt-1">
            {contactReq === "both" ? L.bothRequired : L.oneRequired}
          </p>
          {showMessage && (
            <textarea rows={3} placeholder={L.messagePh} value={form.message}
              onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 text-white px-6 py-3 rounded-lg font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: accent }}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            {submitLabel || L.submit}
          </button>
        </form>
      )}
    </div>
  );
}
