"use client";

import { useCallback, useEffect, useState } from "react";
import { Calendar, Clock, CheckCircle, Loader2, XCircle, CalendarClock, Wallet } from "lucide-react";
import { DepositBox, type DepositView } from "./deposit-box";

/**
 * The customer's booking page (/book/manage/[token]): what they booked,
 * cancel, pick another time, and report the deposit payment. All through
 * api/bookings/manage with the private token from their confirmation.
 */
type Data = {
  booking: { date: string; start_time: string; end_time: string; customer_name: string; status: string; deposit_status: string; payment_reference: string | null; visit_label?: string | null };
  serviceName: string; canChange: boolean; deposit: DepositView | null; slots: { start: string; end: string }[];
};

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function ManageBooking({ token }: { token: string }) {
  const [d, setD] = useState<Data | null | undefined>(undefined);
  const [mode, setMode] = useState<"view" | "reschedule">("view");
  const [date, setDate] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback((forDate?: string) => {
    fetch(`/api/bookings/manage?token=${token}${forDate ? `&date=${forDate}` : ""}`).then((r) => (r.ok ? r.json() : null)).then(setD).catch(() => setD(null));
  }, [token]);
  useEffect(() => { load(); }, [load]);

  async function act(body: Record<string, unknown>) {
    setBusy(true); setMsg(null);
    const r = await fetch("/api/bookings/manage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, ...body }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setMsg(j.error ?? "Something went wrong"); return false; }
    setMode("view"); load();
    return true;
  }

  if (d === undefined) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!d) return <div className="mx-auto max-w-md py-20 text-center text-muted-foreground">This booking link is not valid.</div>;
  const b = d.booking;
  // Website chat requests keep the site's own word ("site visit").
  const word = b.visit_label || "booking";
  const when = new Date(b.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const days = Array.from({ length: 14 }, (_, i) => { const x = new Date(); x.setDate(x.getDate() + i); return x; });

  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 py-12">
      <div className="rounded-2xl border bg-card p-6">
        <p className="text-sm text-muted-foreground">{d.serviceName}</p>
        <h1 className="mt-1 text-2xl font-bold">Hi {b.customer_name.split(" ")[0]}, here is your {word}</h1>
        <div className="mt-4 space-y-1.5 text-sm">
          <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> {when}</p>
          <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> {b.start_time} to {b.end_time}</p>
          <p className="flex items-center gap-2">
            {b.status === "cancelled" ? <XCircle className="h-4 w-4 text-red-600" /> : <CheckCircle className="h-4 w-4 text-emerald-600" />}
            {b.status === "confirmed" ? "Confirmed" : b.status === "pending" ? "Waiting for confirmation" : b.status === "cancelled" ? "Cancelled" : b.status}
          </p>
        </div>
        {msg && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</p>}
        {d.canChange && mode === "view" && (
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => { setMode("reschedule"); const f = iso(days[0]); setDate(f); load(f); }} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><CalendarClock className="h-4 w-4" /> Pick another time</button>
            <button type="button" disabled={busy} onClick={() => { if (confirm(`Cancel this ${word}?`)) void act({ action: "cancel" }); }} className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"><XCircle className="h-4 w-4" /> Cancel {word}</button>
          </div>
        )}
        {!d.canChange && b.status !== "cancelled" && <p className="mt-4 text-xs text-muted-foreground">Changes are no longer possible online for this {word}. Please contact us.</p>}
      </div>

      {mode === "reschedule" && (
        <div className="rounded-2xl border bg-card p-6">
          <p className="font-semibold">Pick another time</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {days.map((x) => { const v = iso(x); const on = v === date; return (
              <button key={v} type="button" onClick={() => { setDate(v); load(v); }} className={`flex shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-sm ${on ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                <span className="text-xs opacity-80">{x.toLocaleDateString(undefined, { weekday: "short" })}</span>
                <span className="font-semibold">{x.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
              </button>
            ); })}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {d.slots.length ? d.slots.map((s) => (
              <button key={s.start} type="button" disabled={busy} onClick={() => void act({ action: "reschedule", date, start: s.start })} className="rounded-lg border px-2 py-2 text-sm hover:bg-muted disabled:opacity-50">{s.start}</button>
            )) : <p className="col-span-full text-sm text-muted-foreground">No free times on this day.</p>}
          </div>
          <button type="button" onClick={() => setMode("view")} className="mt-3 text-sm text-muted-foreground underline">Keep my current time</button>
        </div>
      )}

      {d.deposit && b.status !== "cancelled" && (
        <div className="rounded-2xl border bg-card p-6">
          <p className="flex items-center gap-2 font-semibold"><Wallet className="h-4 w-4" /> Deposit</p>
          <DepositBox deposit={d.deposit} status={b.deposit_status} reference={b.payment_reference} onReport={(reference) => act({ action: "payment", reference })} />
        </div>
      )}
    </div>
  );
}
