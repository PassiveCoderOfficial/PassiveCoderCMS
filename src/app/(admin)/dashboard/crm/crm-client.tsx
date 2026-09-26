"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Users, KanbanSquare, CheckSquare, Settings2, Search, Plus, X,
  Loader2, Mail, Phone, MessageCircle, Trash2, Check, ChevronLeft,
  ChevronRight, StickyNote, Clock, GripVertical, Pencil,
  Briefcase, FolderKanban, FileText, Copy, ExternalLink,
} from "lucide-react";
import { useT } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/locales/en";

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
interface LinkedJob { id: string; title: string; status: string; price: number | null; project_id: string | null }
interface LinkedProject { id: string; name: string; status: string }
interface LinkedInvoice { id: string; invoice_number: string; status: string; total: number; currency: string; public_token: string }

type TFn = ReturnType<typeof useT>;

// Module-level constants can't call the t() hook — these take t as a param,
// called inside whichever component needs them (same pattern as
// subscription/page.tsx's statusConfig).
function sourceLabels(t: TFn): Record<string, string> {
  return {
    manual: t("crm.sourceManual"), form: t("crm.sourceForm"), booking: t("crm.sourceBooking"),
    order: t("crm.sourceOrder"), enm: t("crm.sourceEnm"), import: t("crm.sourceImport"), api: t("crm.sourceApi"),
  };
}

function contactName(c: { first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null }, t: TFn) {
  const n = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
  return n || c.email || c.phone || t("crm.unnamed");
}
function waLink(num: string | null | undefined) {
  return num ? `https://wa.me/${num.replace(/\D/g, "")}` : null;
}
function money(n: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(n));
  } catch {
    return `${currency} ${Number(n).toFixed(2)}`;
  }
}
function timeAgo(iso: string, t: TFn) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return t("crm.now");
  if (s < 3600) return t("crm.minAgo", { n: Math.floor(s / 60) });
  if (s < 86400) return t("crm.hourAgo", { n: Math.floor(s / 3600) });
  if (s < 2592000) return t("crm.dayAgo", { n: Math.floor(s / 86400) });
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
  const t = useT();
  const [contact, setContact] = useState<Contact | null>(null);
  const [events, setEvents] = useState<ContactEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [jobs, setJobs] = useState<LinkedJob[]>([]);
  const [linkedProjects, setLinkedProjects] = useState<LinkedProject[]>([]);
  const [invoices, setInvoices] = useState<LinkedInvoice[]>([]);
  const [copiedInvoice, setCopiedInvoice] = useState<string | null>(null);
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
      setJobs(d.jobs ?? []); setLinkedProjects(d.projects ?? []); setInvoices(d.invoices ?? []);
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
    if (!confirm(t("crm.deleteContactConfirm"))) return;
    const res = await fetch(`/api/crm/contacts/${contactId}`, { method: "DELETE" });
    if (res.ok) { onDeleted(contactId); onClose(); }
  }

  const wa = waLink(contact?.whatsapp ?? contact?.phone);

  function copyInvoiceLink(inv: LinkedInvoice) {
    navigator.clipboard.writeText(`${window.location.origin}/invoice/${inv.public_token}`);
    setCopiedInvoice(inv.id);
    setTimeout(() => setCopiedInvoice(null), 1500);
  }

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
                <h2 className="text-xl font-bold text-white">{contactName(contact, t)}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t("crm.addedTimeAgo", { source: sourceLabels(t)[contact.source] ?? contact.source, time: timeAgo(contact.created_at, t) })}
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
                <a href={`tel:${contact.phone}`} className={btnGhost}><Phone className="w-4 h-4" /> {t("crm.call")}</a>
              )}
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600/20 border border-green-700/50 text-green-300 hover:bg-green-600/30 px-3 py-2 rounded-lg text-sm transition-colors">
                  <MessageCircle className="w-4 h-4" /> {t("crm.whatsapp")}
                </a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className={btnGhost}><Mail className="w-4 h-4" /> {t("crm.email")}</a>
              )}
            </div>

            {/* Stage selector */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">{t("crm.pipelineStage")}</label>
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
                  <input className={inputCls} placeholder={t("crm.firstName")} value={form.first_name ?? ""} onChange={(e) => setForm(f => ({ ...f, first_name: e.target.value }))} />
                  <input className={inputCls} placeholder={t("crm.lastName")} value={form.last_name ?? ""} onChange={(e) => setForm(f => ({ ...f, last_name: e.target.value }))} />
                </div>
                <input className={inputCls} placeholder={t("crm.emailField")} value={form.email ?? ""} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <input className={inputCls} placeholder={t("crm.phone")} value={form.phone ?? ""} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
                  <input className={inputCls} placeholder={t("crm.whatsappField")} value={form.whatsapp ?? ""} onChange={(e) => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
                </div>
                <input className={inputCls} placeholder={t("crm.company")} value={form.company ?? ""} onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))} />
                <textarea className={inputCls} rows={3} placeholder={t("crm.notes")} value={form.notes ?? ""} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className={btnPrimary}><Check className="w-4 h-4" /> {t("crm.saveChanges")}</button>
                  <button onClick={() => { setEditing(false); setForm(contact); }} className={btnGhost}>{t("crm.cancel")}</button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2 text-sm">
                {contact.email && <div className="flex items-center gap-2 text-gray-300"><Mail className="w-3.5 h-3.5 text-gray-500" />{contact.email}</div>}
                {contact.phone && <div className="flex items-center gap-2 text-gray-300"><Phone className="w-3.5 h-3.5 text-gray-500" />{contact.phone}</div>}
                {contact.company && <div className="text-gray-400">{contact.company}</div>}
                {contact.notes && <div className="text-gray-400 whitespace-pre-wrap pt-1 border-t border-gray-800">{contact.notes}</div>}
                {!contact.email && !contact.phone && !contact.company && !contact.notes && (
                  <div className="text-gray-600">{t("crm.noDetailsYet")}</div>
                )}
              </div>
            )}

            {/* Tasks */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2"><CheckSquare className="w-4 h-4 text-indigo-400" /> {t("crm.followUps")}</h3>
              {tasks.filter(tk => tk.status !== "cancelled").map((tk) => (
                <div key={tk.id} className="flex items-center gap-2 text-sm">
                  <button onClick={() => toggleTask(tk)}
                    className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${tk.status === "done" ? "bg-green-600 border-green-600" : "border-gray-600"}`}>
                    {tk.status === "done" && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <span className={tk.status === "done" ? "line-through text-gray-600" : "text-gray-300"}>{tk.title}</span>
                  <span className={`ml-auto text-xs ${new Date(tk.due_at) < new Date() && tk.status === "open" ? "text-red-400" : "text-gray-500"}`}>
                    {new Date(tk.due_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
              <div className="flex gap-2">
                <input className={inputCls} placeholder={t("crm.followUpPlaceholder")} value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                <input type="datetime-local" className={`${inputCls} w-auto`} value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
                <button onClick={addTask} className={btnGhost}><Plus className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Jobs & projects */}
            {(jobs.length > 0 || linkedProjects.length > 0) && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Briefcase className="w-4 h-4 text-indigo-400" /> {t("crm.workTitle")}</h3>
                {linkedProjects.map((p) => (
                  <Link key={p.id} href="/dashboard/jobs" className="flex items-center gap-2 text-sm text-gray-300 hover:text-white">
                    <FolderKanban className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span className="truncate">{p.name}</span>
                    <span className="ml-auto text-xs text-gray-500 shrink-0">{p.status}</span>
                  </Link>
                ))}
                {jobs.filter(j => !j.project_id).map((j) => (
                  <Link key={j.id} href="/dashboard/jobs" className="flex items-center gap-2 text-sm text-gray-300 hover:text-white">
                    <Briefcase className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span className="truncate">{j.title}</span>
                    <span className="ml-auto text-xs text-gray-500 shrink-0">{j.status}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Invoices */}
            {invoices.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-400" /> {t("crm.invoicesTitle")}</h3>
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="truncate">{inv.invoice_number}</span>
                    <span className="text-xs text-gray-500">{inv.status}</span>
                    <span className="ml-auto text-xs text-gray-400 shrink-0">{money(inv.total, inv.currency)}</span>
                    <button onClick={() => copyInvoiceLink(inv)} className="p-1 text-gray-500 hover:text-white shrink-0">
                      {copiedInvoice === inv.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a href={`/invoice/${inv.public_token}`} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-500 hover:text-white shrink-0"><ExternalLink className="w-3.5 h-3.5" /></a>
                  </div>
                ))}
              </div>
            )}

            {/* Note composer + timeline */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <input className={inputCls} placeholder={t("crm.addNotePlaceholder")} value={note}
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
                      <span className="text-xs text-gray-500">{timeAgo(ev.created_at, t)}</span>
                    </div>
                    {ev.body && <p className="text-xs text-gray-400 mt-1 whitespace-pre-wrap">{ev.body}</p>}
                  </div>
                ))}
                {!events.length && <p className="text-sm text-gray-600 text-center py-4">{t("crm.noActivityYet")}</p>}
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
  const t = useT();
  const [f, setF] = useState({ first_name: "", last_name: "", email: "", phone: "", company: "", stage_id: stages[0]?.id ?? "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!f.email.trim() && !f.phone.trim()) { setError(t("crm.emailOrPhoneRequired")); return; }
    setSaving(true); setError(null);
    const res = await fetch("/api/crm/contacts", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { setError(d.error ?? t("crm.addContactFailed")); return; }
    onCreated(d); onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-gray-950 border border-gray-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{t("crm.newContact")}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className={inputCls} placeholder={t("crm.firstName")} value={f.first_name} onChange={(e) => setF(p => ({ ...p, first_name: e.target.value }))} />
          <input className={inputCls} placeholder={t("crm.lastName")} value={f.last_name} onChange={(e) => setF(p => ({ ...p, last_name: e.target.value }))} />
        </div>
        <input className={inputCls} placeholder={t("crm.emailField")} value={f.email} onChange={(e) => setF(p => ({ ...p, email: e.target.value }))} />
        <input className={inputCls} placeholder={t("crm.phonePlaceholder")} value={f.phone} onChange={(e) => setF(p => ({ ...p, phone: e.target.value }))} />
        <input className={inputCls} placeholder={t("crm.company")} value={f.company} onChange={(e) => setF(p => ({ ...p, company: e.target.value }))} />
        <select className={inputCls} value={f.stage_id} onChange={(e) => setF(p => ({ ...p, stage_id: e.target.value }))}>
          {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button onClick={save} disabled={saving} className={`${btnPrimary} w-full justify-center`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} {t("crm.addContact")}
        </button>
      </div>
    </div>
  );
}

// ── Stages settings tab ──────────────────────────────────────────────────────
function StagesTab({ stages, onChange }: { stages: Stage[]; onChange: (s: Stage[]) => void }) {
  const t = useT();
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
    if (!confirm(t("crm.deleteStageConfirm"))) return;
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
                {s.is_won ? t("crm.won") : t("crm.lost")}
              </span>
            )}
            <button disabled={i === 0} onClick={() => move(i, -1)} className="p-1 text-gray-500 hover:text-white disabled:opacity-30"><ChevronLeft className="w-4 h-4 rotate-90" /></button>
            <button disabled={i === stages.length - 1} onClick={() => move(i, 1)} className="p-1 text-gray-500 hover:text-white disabled:opacity-30"><ChevronRight className="w-4 h-4 rotate-90" /></button>
            <button onClick={() => remove(s.id)} className="p-1 text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input className={inputCls} placeholder={t("crm.newStageName")} value={newName}
          onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <button onClick={add} className={btnPrimary}><Plus className="w-4 h-4" /> {t("crm.add")}</button>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function CrmClient({ initialStages, initialContacts, initialTotal, initialTasks }: {
  initialStages: Stage[]; initialContacts: Contact[]; initialTotal: number; initialTasks: Task[];
}) {
  const t = useT();
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
    { id: "contacts" as const, label: t("crm.tabContacts"), icon: Users },
    { id: "pipeline" as const, label: t("crm.tabPipeline"), icon: KanbanSquare },
    { id: "tasks" as const, label: t("crm.tabFollowUps"), icon: CheckSquare, badge: tasks.filter(tk => tk.status === "open").length },
    { id: "stages" as const, label: t("crm.tabStages"), icon: Settings2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-400" /> {t("crm.title")}
        </h1>
        <button onClick={() => setShowAdd(true)} className={btnPrimary}><Plus className="w-4 h-4" /> {t("crm.newContact")}</button>
      </div>

      <div className="flex gap-1 border-b border-gray-800">
        {TABS.map(tabItem => (
          <button key={tabItem.id} onClick={() => setTab(tabItem.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === tabItem.id ? "border-indigo-500 text-white" : "border-transparent text-gray-400 hover:text-gray-200"
            }`}>
            <tabItem.icon className="w-4 h-4" /> {tabItem.label}
            {"badge" in tabItem && !!tabItem.badge && (
              <span className="bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-full">{tabItem.badge}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "contacts" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-52">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input className={`${inputCls} pl-9`} placeholder={t("crm.searchPlaceholder")}
                value={q} onChange={(e) => onSearch(e.target.value)} />
            </div>
            <select className={`${inputCls} w-auto`} value={stageFilter} onChange={(e) => onStageFilter(e.target.value)}>
              <option value="">{t("crm.allStages")}</option>
              {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-16 text-gray-500 text-sm">
                {t("crm.noContactsYet")}
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {contacts.map((c) => {
                  const wa = waLink(c.whatsapp ?? c.phone);
                  return (
                    <div key={c.id} onClick={() => setOpenContact(c.id)}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-gray-800/60 cursor-pointer transition-colors">
                      <div className="w-9 h-9 rounded-full bg-indigo-600/20 text-indigo-300 flex items-center justify-center text-sm font-semibold shrink-0">
                        {contactName(c, t).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white truncate">{contactName(c, t)}</span>
                          {c.crm_stages && (
                            <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                              style={{ backgroundColor: c.crm_stages.color + "33", color: c.crm_stages.color }}>
                              {c.crm_stages.name}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {[c.email, c.phone, c.company].filter(Boolean).join(" · ") || sourceLabels(t)[c.source]}
                        </div>
                      </div>
                      <span className="text-xs text-gray-600 shrink-0 hidden sm:block">{timeAgo(c.last_activity_at, t)}</span>
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
              <span>{t("crm.contactsCount", { count: total })}</span>
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
                        <div className="text-sm font-medium text-white truncate">{contactName(c, t)}</div>
                        <div className="text-xs text-gray-500 truncate">{c.email ?? c.phone ?? ""}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-600 mt-3">{t("crm.dragHint")}</p>
        </div>
      )}

      {tab === "tasks" && (
        <div className="max-w-2xl space-y-2">
          {tasks.filter(tk => tk.status === "open").length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm">{t("crm.noOpenFollowUps")}</div>
          ) : tasks.filter(tk => tk.status === "open").map((tk) => {
            const overdue = new Date(tk.due_at) < new Date();
            const wa = tk.contacts ? waLink(tk.contacts.whatsapp ?? tk.contacts.phone) : null;
            return (
              <div key={tk.id} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
                <button onClick={() => completeTask(tk)}
                  className="w-5 h-5 rounded-full border border-gray-600 hover:border-green-500 hover:bg-green-500/20 shrink-0 transition-colors" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-white truncate">{tk.title}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {tk.contacts ? contactName(tk.contacts, t) : t("crm.noContact")}
                  </div>
                </div>
                <span className={`text-xs flex items-center gap-1 shrink-0 ${overdue ? "text-red-400" : "text-gray-500"}`}>
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(tk.due_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {tk.contacts?.phone && <a href={`tel:${tk.contacts.phone}`} className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-gray-700"><Phone className="w-4 h-4" /></a>}
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
