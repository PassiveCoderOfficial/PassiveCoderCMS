"use client";

import { useState } from "react";
import {
  Calendar, Clock, User, Phone, Mail, MessageSquare,
  Check, X, Loader2, Save, CheckCircle, Plus, Trash2,
  ChevronLeft, ChevronRight, Settings
} from "lucide-react";

interface BookingSettings {
  id?: string;
  enabled: boolean;
  service_name: string;
  slot_duration_mins: number;
  buffer_mins: number;
  advance_days: number;
  min_notice_hours: number;
  confirmation_mode: "auto" | "manual";
  success_message: string;
  notify_email: string | null;
}

interface Availability {
  id?: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_open: boolean;
}

interface BlockedDate {
  id: string;
  blocked_date: string;
  reason: string | null;
}

interface Appointment {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  message: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  admin_note: string | null;
  created_at: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-900/50 text-yellow-300 border-yellow-700/50",
  confirmed: "bg-green-900/50 text-green-300 border-green-700/50",
  cancelled: "bg-red-900/50 text-red-300 border-red-700/50",
  completed: "bg-blue-900/50 text-blue-300 border-blue-700/50",
  no_show: "bg-gray-800 text-gray-400 border-gray-700",
};

function api(method: string, body?: unknown, params?: Record<string, string>) {
  const url = params ? `/api/bookings?${new URLSearchParams(params)}` : "/api/bookings";
  return fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
}

const DEFAULT_AVAILABILITY: Availability[] = DAYS.map((_, i) => ({
  day_of_week: i,
  open_time: "09:00",
  close_time: "17:00",
  is_open: i > 0 && i < 6, // Mon–Fri
}));

function SettingsTab({ settings: initial, onSave }: {
  settings: BookingSettings | null;
  onSave: (s: BookingSettings) => void;
}) {
  const [s, setS] = useState<BookingSettings>(initial ?? {
    enabled: false, service_name: "Appointment",
    slot_duration_mins: 60, buffer_mins: 15, advance_days: 30,
    min_notice_hours: 2, confirmation_mode: "manual",
    success_message: "Your appointment request has been received!",
    notify_email: null,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (k: keyof BookingSettings, v: unknown) => { setS(p => ({ ...p, [k]: v })); setSaved(false); };

  async function save() {
    setSaving(true);
    await api("POST", { _type: "settings", ...s });
    setSaving(false); setSaved(true); onSave(s);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={s.enabled} onChange={e => set("enabled", e.target.checked)} />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
          </label>
          <span className="text-sm text-white font-medium">Booking System {s.enabled ? "Enabled" : "Disabled"}</span>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : "Save Settings"}
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Service Name</label>
            <input value={s.service_name} onChange={e => set("service_name", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Notification Email</label>
            <input value={s.notify_email ?? ""} onChange={e => set("notify_email", e.target.value || null)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Slot Duration (mins)</label>
            <input type="number" value={s.slot_duration_mins} onChange={e => set("slot_duration_mins", Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Buffer Between Slots (mins)</label>
            <input type="number" value={s.buffer_mins} onChange={e => set("buffer_mins", Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Book Up To (days ahead)</label>
            <input type="number" value={s.advance_days} onChange={e => set("advance_days", Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Min Notice (hours before slot)</label>
            <input type="number" value={s.min_notice_hours} onChange={e => set("min_notice_hours", Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Confirmation Mode</label>
          <div className="flex gap-3">
            {(["auto", "manual"] as const).map(mode => (
              <label key={mode} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value={mode} checked={s.confirmation_mode === mode} onChange={() => set("confirmation_mode", mode)} className="w-4 h-4" />
                <span className="text-sm text-gray-300 capitalize">{mode} — {mode === "auto" ? "instantly confirmed" : "admin must approve"}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Success Message</label>
          <textarea rows={2} value={s.success_message} onChange={e => set("success_message", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none" />
        </div>
      </div>
    </div>
  );
}

function AvailabilityTab({ availability: initial, blocked: initialBlocked }: {
  availability: Availability[];
  blocked: BlockedDate[];
}) {
  const merged = DAYS.map((_, i) => initial.find(a => a.day_of_week === i) ?? DEFAULT_AVAILABILITY[i]);
  const [rows, setRows] = useState<Availability[]>(merged);
  const [blocked, setBlocked] = useState(initialBlocked);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");

  const setRow = (i: number, k: keyof Availability, v: unknown) => {
    setRows(prev => prev.map((r, j) => j === i ? { ...r, [k]: v } : r));
    setSaved(false);
  };

  async function saveAvailability() {
    setSaving(true);
    await api("POST", { _type: "availability", rows });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function blockDate() {
    if (!newDate) return;
    const res = await api("POST", { _type: "blocked", blocked_date: newDate, reason: newReason || null });
    const data = await res.json();
    setBlocked(prev => [...prev, data]);
    setNewDate(""); setNewReason("");
  }

  async function unblockDate(id: string) {
    await api("DELETE", undefined, { type: "blocked", id });
    setBlocked(prev => prev.filter(b => b.id !== id));
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-white">Weekly Schedule</h3>
          <button onClick={saveAvailability} disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? "Saved!" : "Save Schedule"}
          </button>
        </div>
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-3">
              <label className="flex items-center gap-2 w-28 cursor-pointer">
                <input type="checkbox" checked={row.is_open} onChange={e => setRow(i, "is_open", e.target.checked)} className="w-4 h-4 rounded" />
                <span className={`text-sm ${row.is_open ? "text-white" : "text-gray-500"}`}>{DAYS[i].slice(0, 3)}</span>
              </label>
              <input type="time" value={row.open_time} onChange={e => setRow(i, "open_time", e.target.value)}
                disabled={!row.is_open}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed" />
              <span className="text-gray-500 text-sm">–</span>
              <input type="time" value={row.close_time} onChange={e => setRow(i, "close_time", e.target.value)}
                disabled={!row.is_open}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed" />
              {!row.is_open && <span className="text-xs text-gray-600">Closed</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="font-medium text-white mb-4">Blocked Dates</h3>
        <div className="flex items-center gap-3 mb-4">
          <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          <input value={newReason} onChange={e => setNewReason(e.target.value)}
            placeholder="Reason (optional)"
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          <button onClick={blockDate} disabled={!newDate}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm px-3 py-2 rounded">
            <Plus className="w-4 h-4" /> Block
          </button>
        </div>
        {blocked.length === 0 ? (
          <p className="text-sm text-gray-500">No blocked dates.</p>
        ) : (
          <div className="space-y-2">
            {blocked.map(b => (
              <div key={b.id} className="flex items-center justify-between py-1.5 border-b border-gray-800">
                <div>
                  <span className="text-sm text-white">{new Date(b.blocked_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                  {b.reason && <span className="text-xs text-gray-400 ml-2">— {b.reason}</span>}
                </div>
                <button onClick={() => unblockDate(b.id)} className="text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AppointmentCard({ appt, onUpdate }: { appt: Appointment; onUpdate: (a: Appointment) => void }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(appt.admin_note ?? "");
  const [saving, setSaving] = useState(false);

  async function updateStatus(status: Appointment["status"]) {
    setSaving(true);
    await api("PATCH", { _type: "appointment", id: appt.id, status });
    setSaving(false);
    onUpdate({ ...appt, status });
  }

  async function saveNote() {
    await api("PATCH", { _type: "appointment", id: appt.id, admin_note: note || null });
    onUpdate({ ...appt, admin_note: note || null });
  }

  const nextStatus: Record<string, string> = {
    pending: "Confirm",
    confirmed: "Mark Complete",
    completed: "",
    cancelled: "",
    no_show: "",
  };

  const nextStatusValue: Record<string, Appointment["status"]> = {
    pending: "confirmed",
    confirmed: "completed",
  };

  return (
    <div className={`border rounded-xl overflow-hidden ${STATUS_COLORS[appt.status]}`}>
      <button onClick={() => setOpen(o => !o)} className="w-full text-left p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-white">{appt.customer_name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[appt.status]}`}>{appt.status}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(appt.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{appt.start_time} – {appt.end_time}</span>
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{appt.customer_email}</span>
              {appt.customer_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{appt.customer_phone}</span>}
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
          {appt.message && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Message from customer</p>
              <p className="text-sm text-white bg-black/20 rounded-lg p-3">{appt.message}</p>
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-1">Admin Note</label>
            <div className="flex gap-2">
              <textarea rows={2} value={note} onChange={e => setNote(e.target.value)}
                className="flex-1 bg-black/20 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none" />
              <button onClick={saveNote} className="text-indigo-400 hover:text-indigo-300 p-1 self-start mt-1"><Save className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {nextStatus[appt.status] && (
              <button onClick={() => updateStatus(nextStatusValue[appt.status])} disabled={saving}
                className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                {nextStatus[appt.status]}
              </button>
            )}
            {appt.status !== "cancelled" && appt.status !== "completed" && (
              <button onClick={() => updateStatus("cancelled")} disabled={saving}
                className="flex items-center gap-1.5 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded">
                <X className="w-3 h-3" /> Cancel
              </button>
            )}
            {appt.status === "confirmed" && (
              <button onClick={() => updateStatus("no_show")} disabled={saving}
                className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded">
                No Show
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentsTab({ appointments: initial }: { appointments: Appointment[] }) {
  const [appointments, setAppointments] = useState(initial);
  const [filter, setFilter] = useState<"all" | Appointment["status"]>("all");

  const filtered = filter === "all" ? appointments : appointments.filter(a => a.status === filter);
  const pending = appointments.filter(a => a.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "confirmed", "completed", "cancelled", "no_show"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${filter === f ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
            {f}{f === "pending" && pending > 0 ? ` (${pending})` : ""}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl">
          <Calendar className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No appointments{filter !== "all" ? ` with status "${filter}"` : ""} yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <AppointmentCard key={a.id} appt={a}
              onUpdate={updated => setAppointments(prev => prev.map(x => x.id === updated.id ? updated : x))} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function BookingsClient({ initialSettings, initialAvailability, initialBlocked, initialAppointments }: {
  initialSettings: BookingSettings | null;
  initialAvailability: Availability[];
  initialBlocked: BlockedDate[];
  initialAppointments: Appointment[];
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [tab, setTab] = useState<"appointments" | "availability" | "settings">("appointments");
  const pending = initialAppointments.filter(a => a.status === "pending").length;

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-400" /> Bookings
        </h1>
        <p className="text-sm text-gray-400 mt-1">Manage appointment settings, availability, and incoming bookings.</p>
      </div>

      <div className="flex gap-1 border-b border-gray-800">
        {(["appointments", "availability", "settings"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${tab === t ? "text-indigo-400 border-b-2 border-indigo-400" : "text-gray-400 hover:text-white"}`}>
            {t}
            {t === "appointments" && pending > 0 && (
              <span className="ml-1.5 bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded-full font-bold">{pending}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "settings" && <SettingsTab settings={settings} onSave={setSettings} />}
      {tab === "availability" && <AvailabilityTab availability={initialAvailability} blocked={initialBlocked} />}
      {tab === "appointments" && <AppointmentsTab appointments={initialAppointments} />}
    </div>
  );
}
