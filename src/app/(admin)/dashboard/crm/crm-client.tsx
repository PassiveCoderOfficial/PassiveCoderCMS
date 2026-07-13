"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Users, KanbanSquare, CheckSquare, Settings2, Search, Plus, X,
  Loader2, Mail, Phone, MessageCircle, Trash2, Check, ChevronLeft,
  ChevronRight, StickyNote, Clock, GripVertical, Pencil,
} from "lucide-react";

interface Stage {
  id: string; name: string; color: string; position: number;
  is_won: boolean; is_lost: boolean;
}
interface Contact {
  id: string; first_name: string | null; last_name: string | null;
  email: string | null; phone: string | null; whatsapp: string | null;
  company: string | null; source: string; stage_id: string | null;
  tags: string[]; notes: string | null; last_activity_at: string;
  created_at: string; consent_email: boolean; consent_whatsapp: boolean;
  crm_stages?: { id: string; name: string; color: string } | null;
}
interface ContactEvent {
  id: string; type: string; title: string; body: string | null;
  meta: Record<string, unknown>; created_at: string;
}
interface Task {
  id: string; contact_id: string | null; title: string; due_at: string;
  status: "open" | "done" | "cancelled"; remind_via: string;
  contacts?: { id: string; first_name: string | null; last_name: string | null; email: string | null; phone: string | null; whatsapp: string | null } | null;
}

const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual", form: "Form", booking: "Booking", order: "Order",
  enm: "ENM", import: "Import", api: "API",
};

function contactName(c: { first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null }) {
  const n = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
  return n || c.email || c.phone || "Unnamed";
}
function waLink(num: string | null | undefined) {
  return num ? `https://wa.me/${num.replace(/\D/g, "")}` : null;
}
function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40";
const btnPrimary = "inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50";
const btnGhost = "inline-flex items-center gap-2 border border-gray-700 hover:bg-gray-800 text-gray-300 px-3 py-2 rounded-lg text-sm transition-colors";

// ── Contact detail slide-over ────────────────────────────────────────────────
function ContactPanel({ contactId, stages, onClose, onChanged, onDeleted }: {
  contactId: string; stages: Stage[];
  onClose: () => void;
  onChanged: (c: Contact) => void;
  onDeleted: (id: string) => void;
}) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [events, setEvents] = useState<ContactEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Contact>>({});
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/crm/contacts/${contactId}`);
    if (res.ok) {
      const d = await res.json();
      setContact(d.contact); setEvents(d.events); setTasks(d.tasks);
      setForm(d.contact);
    }
    setLoading(false);
  }, [contactId]);

  useEffect(() => { load(); }, [load]);

  async function saveEdit() {
    const res = await fetch(`/api/crm/contacts/${contactId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: form.first_name, last_name: form.last_name,
        email: form.email, phone: form.phone, whatsapp: form.whatsapp,
        company: form.company, notes: form.notes,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setContact(updated); onChanged(updated); setEditing(false);
    }
  }

  async function changeStage(stageId: string) {
    const res = await fetch(`/api/crm/contacts/${contactId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage_id: stageId || null }),
    });
    if (res.ok) {
      const updated = await res.json();
      setContact(updated); onChanged(updated); load();
    }
  }

  async function addNote() {
    if (!note.trim()) return;
    setSavingNote(true);
    const res = await fetch(`/api/crm/contacts/${contactId}/events`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "note", title: "Note", body: note }),
    });
    if (res.ok) { setNote(""); load(); }
    setSavingNote(false);
  }

  async function addTask() {
    if (!taskTitle.trim() || !taskDue) return;
    const res = await fetch("/api/crm/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact_id: contactId, title: taskTitle, due_at: new Date(taskDue).toISOString() }),
    });
    if (res.ok) { setTaskTitle(""); setTaskDue(""); load(); }
  }

  async function toggleTask(t: Task) {
    await fetch("/api/crm/tasks", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, status: t.status === "open" ? "done" : "open" }),
    });
    load();
  }

  async function del() {
    if (!confirm("Delete this contact and its history?")) return;
    const res = await fetch(`/api/crm/contacts/${contactId}`, { method: "DELETE" });
    if (res.ok) { onDeleted(contactId); onClose(); }
  }

  const wa = waLink(contact?.whatsapp ?? contact?.phone);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg h-full bg-gray-950 border-l border-gray-800 overflow-y-auto">
        {loading || !contact ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
        ) : (
          <div className="p-5 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{contactName(contact)}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {SOURCE_LABELS[contact.source] ?? contact.source} · added {timeAgo(contact.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditing(!editing)} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"><Pencil className="w-4 h-4" /></button>
                <button onClick={del} className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800"><Trash2 className="w-4 h-4" /></button>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"><X className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className={btnGhost}><Phone className="w-4 h-4" /> Call</a>
              )}
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600/20 border border-green-700/50 text-green-300 hover:bg-green-600/30 px-3 py-2 rounded-lg text-sm transition-colors">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className={btnGhost}><Mail className="w-4 h-4" /> Email</a>
              )}
            </div>

            {/* Stage selector */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Pipeline stage</label>
              <div className="flex flex-wrap gap-1.5">
                {stages.map((s) => (
                  <button key={s.id} onClick={() => changeStage(s.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      contact.stage_id === s.id
                        ? "text-white border-transparent"
                        : "text-gray-400 border-gray-700 hover:border-gray-500"
                    }`}
                    style={contact.stage_id === s.id ? { backgroundColor: s.color } : {}}>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Fields */}
            {editing ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input className={inputCls} placeholder="First name" value={form.first_name ?? ""} onChange={(e) => setForm(f => ({ ...f, first_name: e.target.value }))} />
                  <input className={inputCls} placeholder="Last name" value={form.last_name ?? ""} onChange={(e) => setForm(f => ({ ...f, last_name: e.target.value }))} />
                </div>
                <input className={inputCls} placeholder="Email" value={form.email ?? ""} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <input className={inputCls} placeholder="Phone" value={form.phone ?? ""} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
                  <input className={inputCls} placeholder="WhatsApp" value={form.whatsapp ?? ""} onChange={(e) => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
                </div>
                <input className={inputCls} placeholder="Company" value={form.company ?? ""} onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))} />
                <textarea className={inputCls} rows={3} placeholder="Notes" value={form.notes ?? ""} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className={btnPrimary}><Check className="w-4 h-4" /> Save</button>
                  <button onClick={() => { setEditing(false); setForm(contact); }} className={btnGhost}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2 text-sm">
                {contact.email && <div className="flex items-center gap-2 text-gray-300"><Mail className="w-3.5 h-3.5 text-gray-500" />{contact.email}</div>}
                {contact.phone && <div className="flex items-center gap-2 text-gray-300"><Phone className="w-3.5 h-3.5 text-gray-500" />{contact.phone}</div>}
                {contact.company && <div className="text-gray-400">{contact.company}</div>}
                {contact.notes && <div className="text-gray-400 whitespace-pre-wrap pt-1 border-t border-gray-800">{contact.notes}</div>}
                {!contact.email && !contact.phone && !contact.company && !contact.notes && (
                  <div className="text-gray-600">No details yet — click the pencil to edit.</div>
                )}
              </div>
            )}

            {/* Tasks */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2"><CheckSquare className="w-4 h-4 text-indigo-400" /> Follow-ups</h3>
              {tasks.filter(t => t.status !== "cancelled").map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-sm">
                  <button onClick={() => toggleTask(t)}
                    className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${t.status === "done" ? "bg-green-600 border-green-600" : "border-gray-600"}`}>
                    {t.status === "done" && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <span className={t.status === "done" ? "line-through text-gray-600" : "text-gray-300"}>{t.title}</span>
                  <span className={`ml-auto text-xs ${new Date(t.due_at) < new Date() && t.status === "open" ? "text-red-400" : "text-gray-500"}`}>
                    {new Date(t.due_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
              <div className="flex gap-2">
                <input className={inputCls} placeholder="Follow up about…" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                <input type="datetime-local" className={`${inputCls} w-auto`} value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
                <button onClick={addTask} className={btnGhost}><Plus className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Note composer + timeline */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <input className={inputCls} placeholder="Add a note…" value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addNote()} />
                <button onClick={addNote} disabled={savingNote} className={btnPrimary}>
                  {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <StickyNote className="w-4 h-4" />}
                </button>
              </div>
              <div className="space-y-2">
                {events.map((ev) => (
                  <div key={ev.id} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white font-medium">{ev.title}</span>
                      <span className="text-xs text-gray-500">{timeAgo(ev.created_at)}</span>
                    </div>
                    {ev.body && <p className="text-xs text-gray-400 mt-1 whitespace-pre-wrap">{ev.body}</p>}
                  </div>
                ))}
                {!events.length && <p className="text-sm text-gray-600 text-center py-4">No activity yet.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add contact modal ────────────────────────────────────────────────────────
function AddContactModal({ stages, onClose, onCreated }: {
  stages: Stage[]; onClose: () => void; onCreated: (c: Contact) => void;
}) {
  const [f, setF] = useState({ first_name: "", last_name: "", email: "", phone: "", company: "", stage_id: stages[0]?.id ?? "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!f.email.trim() && !f.phone.trim()) { setError("Email or phone required"); return; }
    setSaving(true); setError(null);
    const res = await fetch("/api/crm/contacts", {
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
      <div className="relative w-full max-w-md bg-gray-950 border border-gray-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">New contact</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className={inputCls} placeholder="First name" value={f.first_name} onChange={(e) => setF(p => ({ ...p, first_name: e.target.value }))} />
          <input className={inputCls} placeholder="Last name" value={f.last_name} onChange={(e) => setF(p => ({ ...p, last_name: e.target.value }))} />
        </div>
        <input className={inputCls} placeholder="Email" value={f.email} onChange={(e) => setF(p => ({ ...p, email: e.target.value }))} />
        <input className={inputCls} placeholder="Phone (e.g. 01712…)" value={f.phone} onChange={(e) => setF(p => ({ ...p, phone: e.target.value }))} />
        <input className={inputCls} placeholder="Company" value={f.company} onChange={(e) => setF(p => ({ ...p, company: e.target.value }))} />
        <select className={inputCls} value={f.stage_id} onChange={(e) => setF(p => ({ ...p, stage_id: e.target.value }))}>
          {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button onClick={save} disabled={saving} className={`${btnPrimary} w-full justify-center`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add contact
        </button>
      </div>
    </div>
  );
}

// ── Stages settings tab ──────────────────────────────────────────────────────
function StagesTab({ stages, onChange }: { stages: Stage[]; onChange: (s: Stage[]) => void }) {
  const [newName, setNewName] = useState("");

  async function add() {
    if (!newName.trim()) return;
    const res = await fetch("/api/crm/stages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) { onChange([...stages, await res.json()]); setNewName(""); }
  }
  async function rename(id: string, name: string) {
    onChange(stages.map(s => s.id === id ? { ...s, name } : s));
    await fetch("/api/crm/stages", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name }),
    });
  }
  async function recolor(id: string, color: string) {
    onChange(stages.map(s => s.id === id ? { ...s, color } : s));
    await fetch("/api/crm/stages", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, color }),
    });
  }
  async function remove(id: string) {
    if (!confirm("Delete stage? Contacts keep their data, just lose this stage.")) return;
    await fetch(`/api/crm/stages?id=${id}`, { method: "DELETE" });
    onChange(stages.filter(s => s.id !== id));
  }
  async function move(idx: number, dir: -1 | 1) {
    const next = [...stages];
    const [item] = next.splice(idx, 1);
    next.splice(idx + dir, 0, item);
    onChange(next);
    await fetch("/api/crm/stages", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: next.map((s, i) => ({ id: s.id, position: i })) }),
    });
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
        {stages.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 px-4 py-3">
            <GripVertical className="w-4 h-4 text-gray-600" />
            <input type="color" value={s.color} onChange={(e) => recolor(s.id, e.target.value)}
              className="w-6 h-6 rounded cursor-pointer bg-transparent border-0" />
            <input className="flex-1 bg-transparent text-sm text-white focus:outline-none"
              defaultValue={s.name} onBlur={(e) => e.target.value !== s.name && rename(s.id, e.target.value)} />
            {(s.is_won || s.is_lost) && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_won ? "bg-green-900/50 text-green-300" : "bg-red-900/50 text-red-300"}`}>
                {s.is_won ? "won" : "lost"}
              </span>
            )}
            <button disabled={i === 0} onClick={() => move(i, -1)} className="p-1 text-gray-500 hover:text-white disabled:opacity-30"><ChevronLeft className="w-4 h-4 rotate-90" /></button>
            <button disabled={i === stages.length - 1} onClick={() => move(i, 1)} className="p-1 text-gray-500 hover:text-white disabled:opacity-30"><ChevronRight className="w-4 h-4 rotate-90" /></button>
            <button onClick={() => remove(s.id)} className="p-1 text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input className={inputCls} placeholder="New stage name" value={newName}
          onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <button onClick={add} className={btnPrimary}><Plus className="w-4 h-4" /> Add</button>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function CrmClient({ initialStages, initialContacts, initialTotal, initialTasks }: {
  initialStages: Stage[]; initialContacts: Contact[]; initialTotal: number; initialTasks: Task[];
}) {
  const [tab, setTab] = useState<"contacts" | "pipeline" | "tasks" | "stages">("contacts");
  const [stages, setStages] = useState(initialStages);
  const [contacts, setContacts] = useState(initialContacts);
  const [total, setTotal] = useState(initialTotal);
  const [tasks, setTasks] = useState(initialTasks);
  const [q, setQ] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [openContact, setOpenContact] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchContacts = useCallback(async (query: string, stage: string, pg: number) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (stage) params.set("stage", stage);
    params.set("page", String(pg));
    const res = await fetch(`/api/crm/contacts?${params}`);
    if (res.ok) {
      const d = await res.json();
      setContacts(d.contacts); setTotal(d.total);
    }
    setLoading(false);
  }, []);

  function onSearch(v: string) {
    setQ(v); setPage(0);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchContacts(v, stageFilter, 0), 300);
  }
  function onStageFilter(v: string) {
    setStageFilter(v); setPage(0);
    fetchContacts(q, v, 0);
  }
  function onPage(p: number) {
    setPage(p);
    fetchContacts(q, stageFilter, p);
  }

  function patchLocal(updated: Contact) {
    setContacts(cs => cs.map(c => c.id === updated.id ? updated : c));
  }

  async function refreshTasks() {
    const res = await fetch("/api/crm/tasks?status=open");
    if (res.ok) setTasks(await res.json());
  }

  async function completeTask(t: Task) {
    await fetch("/api/crm/tasks", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, status: "done" }),
    });
    refreshTasks();
  }

  async function dropOnStage(contactId: string, stageId: string) {
    const res = await fetch(`/api/crm/contacts/${contactId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage_id: stageId }),
    });
    if (res.ok) patchLocal(await res.json());
  }

  const totalPages = Math.max(1, Math.ceil(total / 25));

  const TABS = [
    { id: "contacts" as const, label: "Contacts", icon: Users },
    { id: "pipeline" as const, label: "Pipeline", icon: KanbanSquare },
    { id: "tasks" as const, label: "Follow-ups", icon: CheckSquare, badge: tasks.filter(t => t.status === "open").length },
    { id: "stages" as const, label: "Stages", icon: Settings2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-400" /> CRM
        </h1>
        <button onClick={() => setShowAdd(true)} className={btnPrimary}><Plus className="w-4 h-4" /> New contact</button>
      </div>

      <div className="flex gap-1 border-b border-gray-800">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id ? "border-indigo-500 text-white" : "border-transparent text-gray-400 hover:text-gray-200"
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
            {"badge" in t && !!t.badge && (
              <span className="bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-full">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "contacts" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-52">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input className={`${inputCls} pl-9`} placeholder="Search name, email, phone, company…"
                value={q} onChange={(e) => onSearch(e.target.value)} />
            </div>
            <select className={`${inputCls} w-auto`} value={stageFilter} onChange={(e) => onStageFilter(e.target.value)}>
              <option value="">All stages</option>
              {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-16 text-gray-500 text-sm">
                No contacts yet. They appear automatically from form submissions, bookings and orders — or add one manually.
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {contacts.map((c) => {
                  const wa = waLink(c.whatsapp ?? c.phone);
                  return (
                    <div key={c.id} onClick={() => setOpenContact(c.id)}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-gray-800/60 cursor-pointer transition-colors">
                      <div className="w-9 h-9 rounded-full bg-indigo-600/20 text-indigo-300 flex items-center justify-center text-sm font-semibold shrink-0">
                        {contactName(c).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white truncate">{contactName(c)}</span>
                          {c.crm_stages && (
                            <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                              style={{ backgroundColor: c.crm_stages.color + "33", color: c.crm_stages.color }}>
                              {c.crm_stages.name}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {[c.email, c.phone, c.company].filter(Boolean).join(" · ") || SOURCE_LABELS[c.source]}
                        </div>
                      </div>
                      <span className="text-xs text-gray-600 shrink-0 hidden sm:block">{timeAgo(c.last_activity_at)}</span>
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {c.phone && <a href={`tel:${c.phone}`} className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-gray-700"><Phone className="w-4 h-4" /></a>}
                        {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-green-400 rounded-lg hover:bg-gray-700"><MessageCircle className="w-4 h-4" /></a>}
                        {c.email && <a href={`mailto:${c.email}`} className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-gray-700"><Mail className="w-4 h-4" /></a>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>{total} contacts</span>
              <div className="flex items-center gap-2">
                <button disabled={page === 0} onClick={() => onPage(page - 1)} className={`${btnGhost} disabled:opacity-40`}><ChevronLeft className="w-4 h-4" /></button>
                <span>{page + 1} / {totalPages}</span>
                <button disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)} className={`${btnGhost} disabled:opacity-40`}><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "pipeline" && (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {stages.map((s) => {
              const inStage = contacts.filter(c => c.stage_id === s.id);
              return (
                <div key={s.id} className="w-64 shrink-0"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { const id = e.dataTransfer.getData("contactId"); if (id) dropOnStage(id, s.id); }}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-sm font-semibold text-white">{s.name}</span>
                    <span className="text-xs text-gray-500">{inStage.length}</span>
                  </div>
                  <div className="space-y-2 min-h-24 bg-gray-900/50 border border-gray-800 rounded-xl p-2">
                    {inStage.map((c) => (
                      <div key={c.id} draggable
                        onDragStart={(e) => e.dataTransfer.setData("contactId", c.id)}
                        onClick={() => setOpenContact(c.id)}
                        className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 cursor-pointer hover:border-gray-600 transition-colors">
                        <div className="text-sm font-medium text-white truncate">{contactName(c)}</div>
                        <div className="text-xs text-gray-500 truncate">{c.email ?? c.phone ?? ""}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-600 mt-3">Drag cards between stages. Pipeline shows the currently loaded page of contacts.</p>
        </div>
      )}

      {tab === "tasks" && (
        <div className="max-w-2xl space-y-2">
          {tasks.filter(t => t.status === "open").length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm">No open follow-ups. Add them from a contact&apos;s panel.</div>
          ) : tasks.filter(t => t.status === "open").map((t) => {
            const overdue = new Date(t.due_at) < new Date();
            const wa = t.contacts ? waLink(t.contacts.whatsapp ?? t.contacts.phone) : null;
            return (
              <div key={t.id} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
                <button onClick={() => completeTask(t)}
                  className="w-5 h-5 rounded-full border border-gray-600 hover:border-green-500 hover:bg-green-500/20 shrink-0 transition-colors" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-white truncate">{t.title}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {t.contacts ? contactName(t.contacts) : "No contact"}
                  </div>
                </div>
                <span className={`text-xs flex items-center gap-1 shrink-0 ${overdue ? "text-red-400" : "text-gray-500"}`}>
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(t.due_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {t.contacts?.phone && <a href={`tel:${t.contacts.phone}`} className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-gray-700"><Phone className="w-4 h-4" /></a>}
                  {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-green-400 rounded-lg hover:bg-gray-700"><MessageCircle className="w-4 h-4" /></a>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "stages" && <StagesTab stages={stages} onChange={setStages} />}

      {openContact && (
        <ContactPanel
          contactId={openContact}
          stages={stages}
          onClose={() => setOpenContact(null)}
          onChanged={patchLocal}
          onDeleted={(id) => setContacts(cs => cs.filter(c => c.id !== id))}
        />
      )}
      {showAdd && (
        <AddContactModal
          stages={stages}
          onClose={() => setShowAdd(false)}
          onCreated={(c) => { setContacts(cs => [c, ...cs]); setTotal(t => t + 1); }}
        />
      )}
    </div>
  );
}
