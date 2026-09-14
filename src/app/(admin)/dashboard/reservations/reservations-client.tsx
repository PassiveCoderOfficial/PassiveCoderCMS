"use client";

import React, { useState } from "react";
import { CalendarClock, Plus, Users, Phone, Check, X, Clock } from "lucide-react";

interface Branch { id: string; name: string }
interface Reservation {
  id: string; branch_id: string; customer_name: string; customer_phone: string;
  party_size: number; reserved_at: string; status: string; notes: string | null;
}

const inputCls = "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-600/40",
  confirmed: "bg-indigo-500/10 text-indigo-300 border-indigo-600/40",
  completed: "bg-green-500/10 text-green-400 border-green-600/40",
  cancelled: "bg-gray-800 text-gray-500 border-gray-700",
  no_show: "bg-red-500/10 text-red-400 border-red-600/40",
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const datePart = sameDay ? "Today" : d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const timePart = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${datePart}, ${timePart}`;
}

export default function ReservationsClient({ branches, reservations: initial }: { branches: Branch[]; reservations: Reservation[] }) {
  const [reservations, setReservations] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    branch_id: branches[0]?.id ?? "", customer_name: "", customer_phone: "",
    party_size: "2", date: "", time: "", notes: "",
  });

  async function addReservation(e: React.FormEvent) {
    e.preventDefault();
    if (!form.branch_id || !form.customer_name.trim() || !form.customer_phone.trim() || !form.date || !form.time) return;
    setSaving(true);
    const reserved_at = new Date(`${form.date}T${form.time}`).toISOString();
    const res = await fetch("/api/ecommerce/reservations", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        branch_id: form.branch_id, customer_name: form.customer_name, customer_phone: form.customer_phone,
        party_size: Number(form.party_size), reserved_at, notes: form.notes,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setReservations(prev => [...prev, data.reservation].sort((a, b) => a.reserved_at.localeCompare(b.reserved_at)));
      setForm({ branch_id: form.branch_id, customer_name: "", customer_phone: "", party_size: "2", date: "", time: "", notes: "" });
      setShowForm(false);
    } else {
      alert(data.error ?? "Could not create reservation");
    }
  }

  async function setStatus(id: string, status: string) {
    const res = await fetch("/api/ecommerce/reservations", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservation_id: id, status }),
    });
    if (res.ok) {
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    }
  }

  const branchName = (id: string) => branches.find(b => b.id === id)?.name ?? "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CalendarClock className="w-6 h-6 text-indigo-400" /> Reservations
        </h1>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> New reservation
        </button>
      </div>

      {showForm && (
        <form onSubmit={addReservation} className="bg-gray-900 border border-gray-800 rounded-xl p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {branches.length > 1 && (
            <select value={form.branch_id} onChange={(e) => setForm(f => ({ ...f, branch_id: e.target.value }))} className={inputCls}>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <input required placeholder="Customer name" value={form.customer_name}
            onChange={(e) => setForm(f => ({ ...f, customer_name: e.target.value }))} className={inputCls} />
          <input required placeholder="Phone" value={form.customer_phone}
            onChange={(e) => setForm(f => ({ ...f, customer_phone: e.target.value }))} className={inputCls} />
          <input required type="number" min={1} placeholder="Party size" value={form.party_size}
            onChange={(e) => setForm(f => ({ ...f, party_size: e.target.value }))} className={inputCls} />
          <input required type="date" value={form.date}
            onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
          <input required type="time" value={form.time}
            onChange={(e) => setForm(f => ({ ...f, time: e.target.value }))} className={inputCls} />
          <input placeholder="Notes (optional)" value={form.notes}
            onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} className={`${inputCls} sm:col-span-2 lg:col-span-2`} />
          <button type="submit" disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium">
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      )}

      {branches.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No branches yet — add one first in Branches.</p>
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No reservations in the next 30 days.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reservations.map(r => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-sm text-white w-40 shrink-0">
                <Clock className="w-3.5 h-3.5 text-gray-500" /> {formatWhen(r.reserved_at)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{r.customer_name}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {r.customer_phone}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {r.party_size}</span>
                  {branches.length > 1 && <span>{branchName(r.branch_id)}</span>}
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border shrink-0 ${STATUS_STYLE[r.status] ?? ""}`}>
                {r.status.replace("_", " ")}
              </span>
              {(r.status === "pending" || r.status === "confirmed") && (
                <div className="flex gap-1 shrink-0">
                  {r.status === "pending" && (
                    <button onClick={() => setStatus(r.id, "confirmed")} title="Confirm"
                      className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg"><Check className="w-4 h-4" /></button>
                  )}
                  <button onClick={() => setStatus(r.id, "cancelled")} title="Cancel"
                    className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg"><X className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
