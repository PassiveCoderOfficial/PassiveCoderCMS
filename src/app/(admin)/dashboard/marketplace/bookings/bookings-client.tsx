"use client";

import { useState } from "react";
import {
  Calendar, Plus, X, Loader2, Phone, MapPin, CheckCircle2, PlayCircle, Ban, Store,
} from "lucide-react";

interface Vendor { id: string; name: string; }
interface Subcategory { id: string; name: string; }
interface Category { id: string; name: string; service_subcategories: Subcategory[]; }
interface Booking {
  id: string; customer_name: string | null; customer_phone: string | null; address: string | null;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  scheduled_date: string | null; scheduled_time: string | null;
  price: number | null; commission_amount: number | null; notes: string | null;
  vendor_id: string | null; subcategory_id: string | null;
  vendors?: { id: string; name: string; phone: string | null } | null;
  service_subcategories?: { id: string; name: string } | null;
  created_at: string;
}

const STATUS_META: Record<Booking["status"], { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-gray-800 text-gray-400 border-gray-700" },
  confirmed: { label: "Confirmed", cls: "bg-blue-900/50 text-blue-300 border-blue-700/50" },
  in_progress: { label: "In progress", cls: "bg-yellow-900/50 text-yellow-300 border-yellow-700/50" },
  completed: { label: "Completed", cls: "bg-green-900/50 text-green-300 border-green-700/50" },
  cancelled: { label: "Cancelled", cls: "bg-gray-800 text-gray-500 border-gray-700" },
};

const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40";
const btnPrimary = "inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50";

function NewBookingModal({ vendors, categories, onClose, onCreated }: {
  vendors: Vendor[]; categories: Category[]; onClose: () => void; onCreated: (b: Booking) => void;
}) {
  const [f, setF] = useState({
    customer_name: "", customer_phone: "", address: "", subcategory_id: "", vendor_id: "",
    scheduled_date: "", scheduled_time: "", price: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!f.customer_name.trim() || !f.customer_phone.trim()) { setError("Customer name and phone required"); return; }
    if (!f.subcategory_id) { setError("Service required"); return; }
    setSaving(true); setError(null);
    const res = await fetch("/api/marketplace/bookings", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { setError(d.error ?? "Failed"); return; }
    onCreated(d); onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-gray-950 border border-gray-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">New booking</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className={inputCls} placeholder="Customer name *" value={f.customer_name}
            onChange={(e) => setF(p => ({ ...p, customer_name: e.target.value }))} />
          <input className={inputCls} placeholder="Customer phone *" value={f.customer_phone}
            onChange={(e) => setF(p => ({ ...p, customer_phone: e.target.value }))} />
        </div>
        <input className={inputCls} placeholder="Address" value={f.address}
          onChange={(e) => setF(p => ({ ...p, address: e.target.value }))} />
        <select className={inputCls} value={f.subcategory_id} onChange={(e) => setF(p => ({ ...p, subcategory_id: e.target.value }))}>
          <option value="">Select service *</option>
          {categories.map(c => (
            <optgroup key={c.id} label={c.name}>
              {c.service_subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </optgroup>
          ))}
        </select>
        <select className={inputCls} value={f.vendor_id} onChange={(e) => setF(p => ({ ...p, vendor_id: e.target.value }))}>
          <option value="">Assign later</option>
          {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <div className="grid grid-cols-3 gap-3">
          <input className={inputCls} type="date" value={f.scheduled_date}
            onChange={(e) => setF(p => ({ ...p, scheduled_date: e.target.value }))} />
          <input className={inputCls} type="time" value={f.scheduled_time}
            onChange={(e) => setF(p => ({ ...p, scheduled_time: e.target.value }))} />
          <input className={inputCls} type="number" min={0} step="0.01" placeholder="Price" value={f.price}
            onChange={(e) => setF(p => ({ ...p, price: e.target.value }))} />
        </div>
        <textarea className={inputCls} rows={2} placeholder="Notes" value={f.notes}
          onChange={(e) => setF(p => ({ ...p, notes: e.target.value }))} />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button onClick={save} disabled={saving} className={`${btnPrimary} w-full justify-center`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create booking
        </button>
      </div>
    </div>
  );
}

export default function BookingsClient({ initialBookings, vendors, categories }: {
  initialBookings: Booking[]; vendors: Vendor[]; categories: Category[];
}) {
  const [bookings, setBookings] = useState(initialBookings);
  const [filter, setFilter] = useState<string>("active");
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function patch(b: Booking, fields: Record<string, unknown>) {
    setBusy(b.id);
    const res = await fetch("/api/marketplace/bookings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: b.id, ...fields }),
    });
    if (res.ok) { const d = await res.json(); setBookings(l => l.map(x => x.id === b.id ? d : x)); }
    setBusy(null);
  }

  const shown = bookings.filter(b => {
    if (filter === "active") return !["completed", "cancelled"].includes(b.status);
    if (filter === "all") return true;
    return b.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-400" /> Bookings
        </h1>
        <button onClick={() => setShowNew(true)} className={btnPrimary}><Plus className="w-4 h-4" /> New booking</button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["active", "pending", "confirmed", "in_progress", "completed", "cancelled", "all"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
              filter === s ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-700 text-gray-400 hover:border-gray-500"
            }`}>{s.replace("_", " ")}</button>
        ))}
      </div>

      <div className="space-y-3">
        {shown.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl text-center py-16 text-gray-500 text-sm">
            No bookings here.
          </div>
        )}
        {shown.map((b) => (
          <div key={b.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white">{b.service_subcategories?.name ?? "Service"}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_META[b.status].cls}`}>{STATUS_META[b.status].label}</span>
                  {b.price != null && <span className="text-xs text-gray-400">{Number(b.price).toFixed(2)}{b.commission_amount != null ? ` (${Number(b.commission_amount).toFixed(2)} commission)` : ""}</span>}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
                  {b.scheduled_date && <span>{b.scheduled_date}{b.scheduled_time ? ` ${b.scheduled_time.slice(0, 5)}` : ""}</span>}
                  {b.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.address}</span>}
                  {b.customer_name && <span>{b.customer_name}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                value={b.vendor_id ?? ""} disabled={busy === b.id}
                onChange={(e) => patch(b, { vendor_id: e.target.value || null })}>
                <option value="">Unassigned</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>

              {b.vendors?.phone && (
                <a href={`https://wa.me/${b.vendors.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-green-600/20 border border-green-700/50 text-green-300 hover:bg-green-600/30 px-2.5 py-1.5 rounded-lg text-xs transition-colors">
                  <Store className="w-3.5 h-3.5" /> Message vendor
                </a>
              )}
              {b.customer_phone && (
                <a href={`tel:${b.customer_phone}`}
                  className="inline-flex items-center gap-1.5 border border-gray-700 text-gray-300 hover:bg-gray-800 px-2.5 py-1.5 rounded-lg text-xs transition-colors">
                  <Phone className="w-3.5 h-3.5" /> Customer
                </a>
              )}

              <div className="ml-auto flex items-center gap-1.5">
                {["pending", "confirmed"].includes(b.status) && (
                  <button disabled={busy === b.id} onClick={() => patch(b, { status: "in_progress" })}
                    className="inline-flex items-center gap-1.5 text-xs text-yellow-300 border border-yellow-700/50 bg-yellow-900/30 hover:bg-yellow-900/50 px-2.5 py-1.5 rounded-lg transition-colors">
                    <PlayCircle className="w-3.5 h-3.5" /> Start
                  </button>
                )}
                {["confirmed", "in_progress"].includes(b.status) && (
                  <button disabled={busy === b.id} onClick={() => patch(b, { status: "completed" })}
                    className="inline-flex items-center gap-1.5 text-xs text-green-300 border border-green-700/50 bg-green-900/30 hover:bg-green-900/50 px-2.5 py-1.5 rounded-lg transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                  </button>
                )}
                {!["completed", "cancelled"].includes(b.status) && (
                  <button disabled={busy === b.id} onClick={() => patch(b, { status: "cancelled" })}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-400 border border-gray-700 hover:bg-gray-800 px-2.5 py-1.5 rounded-lg transition-colors">
                    <Ban className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showNew && (
        <NewBookingModal vendors={vendors} categories={categories} onClose={() => setShowNew(false)}
          onCreated={(b) => setBookings(l => [b, ...l])} />
      )}
    </div>
  );
}
