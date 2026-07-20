"use client";

import { useState } from "react";
import {
  Store, Plus, X, Loader2, Trash2, Phone, Mail, CheckCircle2, Ban, Clock, Wrench, CalendarDays,
} from "lucide-react";
import { MapPicker } from "@/components/donors/donor-map";

// City-agnostic default map center — Singapore, since My Service SG is the
// first marketplace tenant. Update if/when non-SG marketplace tenants exist.
const MAP_DEFAULT_CENTER = { lat: 1.3521, lng: 103.8198 };

interface Subcategory { id: string; name: string; }
interface Category { id: string; name: string; service_subcategories: Subcategory[]; }
interface Vendor {
  id: string; name: string; contact_name: string | null; phone: string | null; email: string | null;
  address: string | null; lat: number | null; lng: number | null; status: "pending" | "approved" | "suspended";
  commission_rate: number; notes: string | null; created_at: string;
}
interface VendorService { subcategory_id: string; price: number | null; active: boolean; service_subcategories: { id: string; name: string; category_id: string } }

const STATUS_META: Record<Vendor["status"], { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-yellow-900/50 text-yellow-300 border-yellow-700/50" },
  approved: { label: "Approved", cls: "bg-green-900/50 text-green-300 border-green-700/50" },
  suspended: { label: "Suspended", cls: "bg-red-900/50 text-red-300 border-red-700/50" },
};

const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40";
const btnPrimary = "inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50";
const btnGhost = "inline-flex items-center gap-2 border border-gray-700 hover:bg-gray-800 text-gray-300 px-3 py-2 rounded-lg text-sm transition-colors";

function NewVendorModal({ onClose, onCreated }: { onClose: () => void; onCreated: (v: Vendor) => void }) {
  const [f, setF] = useState({ name: "", contact_name: "", phone: "", email: "", address: "", commission_rate: "15" });
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!f.name.trim()) { setError("Vendor name required"); return; }
    setSaving(true); setError(null);
    const res = await fetch("/api/marketplace/vendors", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, lat: pin?.lat ?? null, lng: pin?.lng ?? null }),
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
          <h2 className="text-lg font-bold text-white">New vendor</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>
        <input className={inputCls} placeholder="Company name *" value={f.name}
          onChange={(e) => setF(p => ({ ...p, name: e.target.value }))} />
        <input className={inputCls} placeholder="Contact person" value={f.contact_name}
          onChange={(e) => setF(p => ({ ...p, contact_name: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3">
          <input className={inputCls} placeholder="Phone" value={f.phone}
            onChange={(e) => setF(p => ({ ...p, phone: e.target.value }))} />
          <input className={inputCls} placeholder="Email" value={f.email}
            onChange={(e) => setF(p => ({ ...p, email: e.target.value }))} />
        </div>
        <input className={inputCls} placeholder="Address" value={f.address}
          onChange={(e) => setF(p => ({ ...p, address: e.target.value }))} />
        <div>
          <label className="text-xs text-gray-400">Pin the vendor&apos;s location (for nearest-vendor matching)</label>
          <div className="mt-1">
            <MapPicker value={pin} onChange={setPin} defaultCenter={MAP_DEFAULT_CENTER} defaultZoom={11} height={200} />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400">Commission rate (%)</label>
          <input className={inputCls} type="number" min={0} max={100} step="0.5" value={f.commission_rate}
            onChange={(e) => setF(p => ({ ...p, commission_rate: e.target.value }))} />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button onClick={save} disabled={saving} className={`${btnPrimary} w-full justify-center`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add vendor
        </button>
      </div>
    </div>
  );
}

function ServicesModal({ vendor, categories, onClose }: {
  vendor: Vendor; categories: Category[]; onClose: () => void;
}) {
  const [services, setServices] = useState<VendorService[] | null>(null);
  const [loading, setLoading] = useState(true);

  useState(() => {
    fetch(`/api/marketplace/vendors/${vendor.id}/services`).then(r => r.json()).then((d) => { setServices(d); setLoading(false); });
  });

  const byId = new Map((services ?? []).map(s => [s.subcategory_id, s]));

  async function toggle(subcategoryId: string, checked: boolean) {
    if (checked) {
      const res = await fetch(`/api/marketplace/vendors/${vendor.id}/services`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subcategory_id: subcategoryId, active: true }),
      });
      const d = await res.json();
      setServices(l => [...(l ?? []).filter(s => s.subcategory_id !== subcategoryId), d]);
    } else {
      await fetch(`/api/marketplace/vendors/${vendor.id}/services?subcategory_id=${subcategoryId}`, { method: "DELETE" });
      setServices(l => (l ?? []).filter(s => s.subcategory_id !== subcategoryId));
    }
  }

  async function setPrice(subcategoryId: string, price: string) {
    const res = await fetch(`/api/marketplace/vendors/${vendor.id}/services`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subcategory_id: subcategoryId, price, active: true }),
    });
    const d = await res.json();
    setServices(l => [...(l ?? []).filter(s => s.subcategory_id !== subcategoryId), d]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-gray-950 border border-gray-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Wrench className="w-4 h-4 text-indigo-400" /> {vendor.name} — services</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>
        {loading && <div className="text-center py-8 text-gray-500 text-sm">Loading…</div>}
        {!loading && categories.map((cat) => (
          <div key={cat.id} className="space-y-1.5">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{cat.name}</div>
            {cat.service_subcategories.map((sub) => {
              const vs = byId.get(sub.id);
              return (
                <div key={sub.id} className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
                  <input type="checkbox" checked={!!vs} onChange={(e) => toggle(sub.id, e.target.checked)} className="accent-indigo-500" />
                  <span className="text-sm text-gray-200 flex-1">{sub.name}</span>
                  {vs && (
                    <input type="number" min={0} step="0.01" placeholder="Price" defaultValue={vs.price ?? ""}
                      onBlur={(e) => setPrice(sub.id, e.target.value)}
                      className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
        {!loading && categories.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-6">No service categories yet — add some in the Service Catalog page first.</p>
        )}
      </div>
    </div>
  );
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DayHours { day_of_week: number; open_time: string; close_time: string; is_open: boolean }
interface BlockedDate { id: string; blocked_date: string; reason: string | null }
interface BookingSettings { slot_duration_mins: number; buffer_mins: number; advance_days: number; min_notice_hours: number }

function AvailabilityModal({ vendor, onClose }: { vendor: Vendor; onClose: () => void }) {
  const [days, setDays] = useState<DayHours[] | null>(null);
  const [blocked, setBlocked] = useState<BlockedDate[]>([]);
  const [settings, setSettings] = useState<BookingSettings>({ slot_duration_mins: 60, buffer_mins: 15, advance_days: 30, min_notice_hours: 2 });
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [saving, setSaving] = useState(false);

  useState(() => {
    Promise.all([
      fetch(`/api/marketplace/vendors/${vendor.id}/availability`).then(r => r.json()),
      fetch(`/api/marketplace/vendors/${vendor.id}/blocked-dates`).then(r => r.json()),
      fetch(`/api/marketplace/vendors/${vendor.id}/booking-settings`).then(r => r.json()),
    ]).then(([avail, blockedDates, bookingSettings]) => {
      const byDay = new Map((avail as DayHours[]).map((d) => [d.day_of_week, d]));
      setDays(DAY_LABELS.map((_, i) => byDay.get(i) ?? { day_of_week: i, open_time: "09:00", close_time: "18:00", is_open: i >= 1 && i <= 5 }));
      setBlocked(blockedDates);
      setSettings({
        slot_duration_mins: bookingSettings.slot_duration_mins ?? 60,
        buffer_mins: bookingSettings.buffer_mins ?? 15,
        advance_days: bookingSettings.advance_days ?? 30,
        min_notice_hours: bookingSettings.min_notice_hours ?? 2,
      });
    });
  });

  function updateDay(i: number, patch: Partial<DayHours>) {
    setDays((d) => d ? d.map((x, idx) => idx === i ? { ...x, ...patch } : x) : d);
  }

  async function saveHours() {
    if (!days) return;
    setSaving(true);
    await fetch(`/api/marketplace/vendors/${vendor.id}/availability`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ days }),
    });
    await fetch(`/api/marketplace/vendors/${vendor.id}/booking-settings`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings),
    });
    setSaving(false);
  }

  async function addBlockedDate() {
    if (!newBlockedDate) return;
    const res = await fetch(`/api/marketplace/vendors/${vendor.id}/blocked-dates`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ blocked_date: newBlockedDate }),
    });
    if (res.ok) { const d = await res.json(); setBlocked(l => [...l, d]); setNewBlockedDate(""); }
  }

  async function removeBlockedDate(bd: BlockedDate) {
    await fetch(`/api/marketplace/vendors/${vendor.id}/blocked-dates?id=${bd.id}`, { method: "DELETE" });
    setBlocked(l => l.filter(x => x.id !== bd.id));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-gray-950 border border-gray-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><CalendarDays className="w-4 h-4 text-indigo-400" /> {vendor.name} — availability</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>

        {!days ? (
          <div className="text-center py-8 text-gray-500 text-sm">Loading…</div>
        ) : (
          <>
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Weekly hours</div>
              {days.map((d, i) => (
                <div key={d.day_of_week} className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
                  <input type="checkbox" checked={d.is_open} onChange={(e) => updateDay(i, { is_open: e.target.checked })} className="accent-indigo-500" />
                  <span className="text-sm text-gray-200 w-10">{DAY_LABELS[d.day_of_week]}</span>
                  <input type="time" value={d.open_time.slice(0, 5)} disabled={!d.is_open}
                    onChange={(e) => updateDay(i, { open_time: e.target.value })}
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white disabled:opacity-40" />
                  <span className="text-gray-500 text-xs">to</span>
                  <input type="time" value={d.close_time.slice(0, 5)} disabled={!d.is_open}
                    onChange={(e) => updateDay(i, { close_time: e.target.value })}
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white disabled:opacity-40" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400">Slot length (min)</label>
                <input type="number" min={15} step={15} value={settings.slot_duration_mins}
                  onChange={(e) => setSettings(s => ({ ...s, slot_duration_mins: parseInt(e.target.value, 10) || 60 }))}
                  className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-400">Buffer between jobs (min)</label>
                <input type="number" min={0} step={5} value={settings.buffer_mins}
                  onChange={(e) => setSettings(s => ({ ...s, buffer_mins: parseInt(e.target.value, 10) || 0 }))}
                  className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-400">Book up to (days ahead)</label>
                <input type="number" min={1} value={settings.advance_days}
                  onChange={(e) => setSettings(s => ({ ...s, advance_days: parseInt(e.target.value, 10) || 30 }))}
                  className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-400">Min notice (hours)</label>
                <input type="number" min={0} value={settings.min_notice_hours}
                  onChange={(e) => setSettings(s => ({ ...s, min_notice_hours: parseInt(e.target.value, 10) || 0 }))}
                  className={inputCls} />
              </div>
            </div>

            <button onClick={saveHours} disabled={saving} className={`${btnPrimary} w-full justify-center`}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save hours & settings
            </button>

            <div className="space-y-1.5 pt-2 border-t border-gray-800">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Blocked dates (holidays, days off)</div>
              {blocked.map((bd) => (
                <div key={bd.id} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="flex-1">{bd.blocked_date}</span>
                  <button onClick={() => removeBlockedDate(bd)} className="p-1 text-gray-600 hover:text-red-400 rounded"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <input type="date" className={`${inputCls} flex-1 py-1.5 text-xs`} value={newBlockedDate}
                  onChange={(e) => setNewBlockedDate(e.target.value)} />
                <button onClick={addBlockedDate} className="text-xs text-indigo-400 hover:text-indigo-300 px-2">Add</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VendorsClient({ initialVendors, categories }: { initialVendors: Vendor[]; categories: Category[] }) {
  const [vendors, setVendors] = useState(initialVendors);
  const [showNew, setShowNew] = useState(false);
  const [servicesFor, setServicesFor] = useState<Vendor | null>(null);
  const [availabilityFor, setAvailabilityFor] = useState<Vendor | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  async function setStatus(v: Vendor, status: Vendor["status"]) {
    setBusy(v.id);
    const res = await fetch("/api/marketplace/vendors", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: v.id, status }),
    });
    if (res.ok) { const d = await res.json(); setVendors(l => l.map(x => x.id === v.id ? d : x)); }
    setBusy(null);
  }

  async function del(v: Vendor) {
    if (!confirm(`Remove vendor "${v.name}"? Their past bookings stay on record.`)) return;
    const res = await fetch(`/api/marketplace/vendors?id=${v.id}`, { method: "DELETE" });
    if (res.ok) setVendors(l => l.filter(x => x.id !== v.id));
  }

  const shown = vendors.filter(v => filter === "all" || v.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Store className="w-6 h-6 text-indigo-400" /> Vendors
        </h1>
        <button onClick={() => setShowNew(true)} className={btnPrimary}><Plus className="w-4 h-4" /> New vendor</button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "approved", "suspended"] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
              filter === s ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-700 text-gray-400 hover:border-gray-500"
            }`}>{s}</button>
        ))}
      </div>

      <div className="space-y-3">
        {shown.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl text-center py-16 text-gray-500 text-sm">
            No vendors here yet.
          </div>
        )}
        {shown.map((v) => (
          <div key={v.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white">{v.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_META[v.status].cls}`}>{STATUS_META[v.status].label}</span>
                  <span className="text-xs text-gray-500">{v.commission_rate}% commission</span>
                </div>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
                  {v.contact_name && <span>{v.contact_name}</span>}
                  {v.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{v.phone}</span>}
                  {v.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{v.email}</span>}
                </div>
              </div>
              <button onClick={() => del(v)} className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg hover:bg-gray-800 shrink-0"><Trash2 className="w-4 h-4" /></button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setServicesFor(v)} className={btnGhost}><Wrench className="w-3.5 h-3.5" /> Services</button>
              <button onClick={() => setAvailabilityFor(v)} className={btnGhost}><CalendarDays className="w-3.5 h-3.5" /> Availability</button>
              <div className="ml-auto flex items-center gap-1.5">
                {v.status !== "approved" && (
                  <button disabled={busy === v.id} onClick={() => setStatus(v, "approved")}
                    className="inline-flex items-center gap-1.5 text-xs text-green-300 border border-green-700/50 bg-green-900/30 hover:bg-green-900/50 px-2.5 py-1.5 rounded-lg transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                )}
                {v.status === "pending" && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-yellow-300"><Clock className="w-3.5 h-3.5" /> Awaiting review</span>
                )}
                {v.status !== "suspended" && (
                  <button disabled={busy === v.id} onClick={() => setStatus(v, "suspended")}
                    className="inline-flex items-center gap-1.5 text-xs text-red-300 border border-red-700/50 bg-red-900/30 hover:bg-red-900/50 px-2.5 py-1.5 rounded-lg transition-colors">
                    <Ban className="w-3.5 h-3.5" /> Suspend
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showNew && <NewVendorModal onClose={() => setShowNew(false)} onCreated={(v) => setVendors(l => [v, ...l])} />}
      {servicesFor && <ServicesModal vendor={servicesFor} categories={categories} onClose={() => setServicesFor(null)} />}
      {availabilityFor && <AvailabilityModal vendor={availabilityFor} onClose={() => setAvailabilityFor(null)} />}
    </div>
  );
}
