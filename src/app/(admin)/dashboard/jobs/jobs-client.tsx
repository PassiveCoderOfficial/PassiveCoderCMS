"use client";

import { useState } from "react";
import {
  Briefcase, Plus, X, Loader2, Trash2, MessageCircle, Phone,
  MapPin, Users, CheckCircle2, PlayCircle, Ban, UserPlus,
} from "lucide-react";

interface Staff {
  id: string; name: string; phone: string | null; email: string | null;
  role_title: string | null; active: boolean;
}
interface Job {
  id: string; title: string; description: string | null; address: string | null;
  customer_name: string | null; customer_phone: string | null;
  status: "unassigned" | "assigned" | "in_progress" | "completed" | "cancelled";
  scheduled_date: string | null; scheduled_time: string | null;
  price: number | null; notes: string | null; staff_id: string | null;
  staff?: { id: string; name: string; phone: string | null } | null;
  created_at: string;
}

const STATUS_META: Record<Job["status"], { label: string; cls: string }> = {
  unassigned: { label: "Unassigned", cls: "bg-gray-800 text-gray-400 border-gray-700" },
  assigned: { label: "Assigned", cls: "bg-blue-900/50 text-blue-300 border-blue-700/50" },
  in_progress: { label: "In progress", cls: "bg-yellow-900/50 text-yellow-300 border-yellow-700/50" },
  completed: { label: "Completed", cls: "bg-green-900/50 text-green-300 border-green-700/50" },
  cancelled: { label: "Cancelled", cls: "bg-gray-800 text-gray-500 border-gray-700" },
};

const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40";
const btnPrimary = "inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50";
const btnGhost = "inline-flex items-center gap-2 border border-gray-700 hover:bg-gray-800 text-gray-300 px-3 py-2 rounded-lg text-sm transition-colors";

/** wa.me deep link with the job brief prefilled — WhatsApp without any API. */
function staffWaLink(job: Job, staffPhone: string) {
  const lines = [
    `New job: ${job.title}`,
    job.scheduled_date ? `When: ${job.scheduled_date}${job.scheduled_time ? ` ${job.scheduled_time.slice(0, 5)}` : ""}` : null,
    job.address ? `Where: ${job.address}` : null,
    job.customer_name ? `Customer: ${job.customer_name}${job.customer_phone ? ` (${job.customer_phone})` : ""}` : null,
    job.description ? `Details: ${job.description}` : null,
  ].filter(Boolean).join("\n");
  return `https://wa.me/${staffPhone.replace(/\D/g, "")}?text=${encodeURIComponent(lines)}`;
}

function NewJobModal({ staff, onClose, onCreated }: {
  staff: Staff[]; onClose: () => void; onCreated: (j: Job) => void;
}) {
  const [f, setF] = useState({
    title: "", description: "", address: "", customer_name: "", customer_phone: "",
    scheduled_date: "", scheduled_time: "", price: "", staff_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!f.title.trim()) { setError("Title required"); return; }
    setSaving(true); setError(null);
    const res = await fetch("/api/jobs", {
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
          <h2 className="text-lg font-bold text-white">New job</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>
        <input className={inputCls} placeholder="Job title * (e.g. Deep clean — 3 bed flat)" value={f.title}
          onChange={(e) => setF(p => ({ ...p, title: e.target.value }))} />
        <textarea className={inputCls} rows={2} placeholder="Details" value={f.description}
          onChange={(e) => setF(p => ({ ...p, description: e.target.value }))} />
        <input className={inputCls} placeholder="Address" value={f.address}
          onChange={(e) => setF(p => ({ ...p, address: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3">
          <input className={inputCls} placeholder="Customer name" value={f.customer_name}
            onChange={(e) => setF(p => ({ ...p, customer_name: e.target.value }))} />
          <input className={inputCls} placeholder="Customer phone" value={f.customer_phone}
            onChange={(e) => setF(p => ({ ...p, customer_phone: e.target.value }))} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <input className={inputCls} type="date" value={f.scheduled_date}
            onChange={(e) => setF(p => ({ ...p, scheduled_date: e.target.value }))} />
          <input className={inputCls} type="time" value={f.scheduled_time}
            onChange={(e) => setF(p => ({ ...p, scheduled_time: e.target.value }))} />
          <input className={inputCls} type="number" min={0} step="0.01" placeholder="Price" value={f.price}
            onChange={(e) => setF(p => ({ ...p, price: e.target.value }))} />
        </div>
        <select className={inputCls} value={f.staff_id} onChange={(e) => setF(p => ({ ...p, staff_id: e.target.value }))}>
          <option value="">Assign later</option>
          {staff.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name}{s.role_title ? ` — ${s.role_title}` : ""}</option>)}
        </select>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button onClick={save} disabled={saving} className={`${btnPrimary} w-full justify-center`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create job
        </button>
      </div>
    </div>
  );
}

function StaffTab({ staff, setStaff }: { staff: Staff[]; setStaff: (fn: (s: Staff[]) => Staff[]) => void }) {
  const [f, setF] = useState({ name: "", phone: "", role_title: "" });
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!f.name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/staff", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f),
    });
    if (res.ok) { const s = await res.json(); setStaff(l => [...l, s]); setF({ name: "", phone: "", role_title: "" }); }
    setSaving(false);
  }
  async function toggle(s: Staff) {
    await fetch("/api/staff", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, active: !s.active }),
    });
    setStaff(l => l.map(x => x.id === s.id ? { ...x, active: !s.active } : x));
  }
  async function remove(s: Staff) {
    if (!confirm(`Remove ${s.name}? Their jobs stay, just unassigned from them.`)) return;
    await fetch(`/api/staff?id=${s.id}`, { method: "DELETE" });
    setStaff(l => l.filter(x => x.id !== s.id));
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-2">
        <input className={inputCls} placeholder="Name *" value={f.name} onChange={(e) => setF(p => ({ ...p, name: e.target.value }))} />
        <input className={inputCls} placeholder="Phone / WhatsApp" value={f.phone} onChange={(e) => setF(p => ({ ...p, phone: e.target.value }))} />
        <input className={inputCls} placeholder="Role (e.g. Cleaner)" value={f.role_title} onChange={(e) => setF(p => ({ ...p, role_title: e.target.value }))} />
        <button onClick={add} disabled={saving} className={btnPrimary}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        </button>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
        {staff.length === 0 && <div className="text-center py-10 text-gray-500 text-sm">No staff yet — add your team above.</div>}
        {staff.map((s) => (
          <div key={s.id} className="flex items-center gap-3 px-4 py-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${s.active ? "bg-indigo-600/20 text-indigo-300" : "bg-gray-800 text-gray-600"}`}>
              {s.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className={`text-sm font-medium ${s.active ? "text-white" : "text-gray-500 line-through"}`}>{s.name}</div>
              <div className="text-xs text-gray-500">{[s.role_title, s.phone].filter(Boolean).join(" · ") || "—"}</div>
            </div>
            {s.phone && (
              <a href={`https://wa.me/${s.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                className="p-2 text-gray-500 hover:text-green-400 rounded-lg hover:bg-gray-800"><MessageCircle className="w-4 h-4" /></a>
            )}
            <button onClick={() => toggle(s)} className={btnGhost}>{s.active ? "Deactivate" : "Activate"}</button>
            <button onClick={() => remove(s)} className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-gray-800"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function JobsClient({ initialJobs, initialStaff }: {
  initialJobs: Job[]; initialStaff: Staff[];
}) {
  const [tab, setTab] = useState<"jobs" | "staff">("jobs");
  const [jobs, setJobs] = useState(initialJobs);
  const [staff, setStaff] = useState(initialStaff);
  const [filter, setFilter] = useState<string>("active");
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const patchLocal = (j: Job) => setJobs(l => l.map(x => x.id === j.id ? j : x));

  async function patch(j: Job, fields: Record<string, unknown>) {
    setBusy(j.id);
    const res = await fetch("/api/jobs", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: j.id, ...fields }),
    });
    if (res.ok) patchLocal(await res.json());
    setBusy(null);
  }

  async function del(j: Job) {
    if (!confirm(`Delete job "${j.title}"?`)) return;
    const res = await fetch(`/api/jobs?id=${j.id}`, { method: "DELETE" });
    if (res.ok) setJobs(l => l.filter(x => x.id !== j.id));
  }

  const shown = jobs.filter(j => {
    if (filter === "active") return !["completed", "cancelled"].includes(j.status);
    if (filter === "all") return true;
    return j.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-indigo-400" /> Jobs
        </h1>
        <button onClick={() => setShowNew(true)} className={btnPrimary}><Plus className="w-4 h-4" /> New job</button>
      </div>

      <div className="flex gap-1 border-b border-gray-800">
        {([["jobs", "Jobs", Briefcase], ["staff", "Staff", Users]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === id ? "border-indigo-500 text-white" : "border-transparent text-gray-400 hover:text-gray-200"
            }`}>
            <Icon className="w-4 h-4" /> {label}
            {id === "staff" && <span className="text-xs text-gray-500">{staff.filter(s => s.active).length}</span>}
          </button>
        ))}
      </div>

      {tab === "staff" && <StaffTab staff={staff} setStaff={setStaff} />}

      {tab === "jobs" && (
        <>
          <div className="flex gap-2 flex-wrap">
            {["active", "unassigned", "assigned", "in_progress", "completed", "cancelled", "all"].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
                  filter === s ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-700 text-gray-400 hover:border-gray-500"
                }`}>{s.replace("_", " ")}</button>
            ))}
          </div>

          <div className="space-y-3">
            {shown.length === 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl text-center py-16 text-gray-500 text-sm">
                No jobs here. Create one and assign it to your team.
              </div>
            )}
            {shown.map((j) => (
              <div key={j.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{j.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_META[j.status].cls}`}>{STATUS_META[j.status].label}</span>
                      {j.price != null && <span className="text-xs text-gray-400">{Number(j.price).toFixed(2)}</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
                      {j.scheduled_date && <span>{j.scheduled_date}{j.scheduled_time ? ` ${j.scheduled_time.slice(0, 5)}` : ""}</span>}
                      {j.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{j.address}</span>}
                      {j.customer_name && <span>{j.customer_name}</span>}
                    </div>
                  </div>
                  <button onClick={() => del(j)} className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg hover:bg-gray-800 shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    value={j.staff_id ?? ""} disabled={busy === j.id}
                    onChange={(e) => patch(j, { staff_id: e.target.value || null })}>
                    <option value="">Unassigned</option>
                    {staff.filter(s => s.active || s.id === j.staff_id).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>

                  {j.staff?.phone && (
                    <a href={staffWaLink(j, j.staff.phone)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-green-600/20 border border-green-700/50 text-green-300 hover:bg-green-600/30 px-2.5 py-1.5 rounded-lg text-xs transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" /> Send brief
                    </a>
                  )}
                  {j.customer_phone && (
                    <a href={`tel:${j.customer_phone}`}
                      className="inline-flex items-center gap-1.5 border border-gray-700 text-gray-300 hover:bg-gray-800 px-2.5 py-1.5 rounded-lg text-xs transition-colors">
                      <Phone className="w-3.5 h-3.5" /> Customer
                    </a>
                  )}

                  <div className="ml-auto flex items-center gap-1.5">
                    {["assigned", "unassigned"].includes(j.status) && (
                      <button disabled={busy === j.id} onClick={() => patch(j, { status: "in_progress" })}
                        className="inline-flex items-center gap-1.5 text-xs text-yellow-300 border border-yellow-700/50 bg-yellow-900/30 hover:bg-yellow-900/50 px-2.5 py-1.5 rounded-lg transition-colors">
                        <PlayCircle className="w-3.5 h-3.5" /> Start
                      </button>
                    )}
                    {["assigned", "in_progress"].includes(j.status) && (
                      <button disabled={busy === j.id} onClick={() => patch(j, { status: "completed" })}
                        className="inline-flex items-center gap-1.5 text-xs text-green-300 border border-green-700/50 bg-green-900/30 hover:bg-green-900/50 px-2.5 py-1.5 rounded-lg transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                      </button>
                    )}
                    {!["completed", "cancelled"].includes(j.status) && (
                      <button disabled={busy === j.id} onClick={() => patch(j, { status: "cancelled" })}
                        className="inline-flex items-center gap-1.5 text-xs text-gray-400 border border-gray-700 hover:bg-gray-800 px-2.5 py-1.5 rounded-lg transition-colors">
                        <Ban className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showNew && (
        <NewJobModal staff={staff} onClose={() => setShowNew(false)}
          onCreated={(j) => setJobs(l => [j, ...l])} />
      )}
    </div>
  );
}
