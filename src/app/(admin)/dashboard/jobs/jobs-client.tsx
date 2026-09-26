"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Briefcase, Plus, X, Loader2, Trash2, MessageCircle, Phone,
  MapPin, Users, CheckCircle2, PlayCircle, Ban, UserPlus,
  FolderKanban, ArrowLeft, Star, FileText, Copy, Check,
} from "lucide-react";
import { useT } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/locales/en";

interface Staff {
  id: string; name: string; phone: string | null; email: string | null;
  role_title: string | null; active: boolean;
}
type Priority = "low" | "medium" | "high" | "urgent";

interface Job {
  id: string; title: string; description: string | null; address: string | null;
  customer_name: string | null; customer_phone: string | null;
  status: "unassigned" | "assigned" | "in_progress" | "completed" | "cancelled";
  scheduled_date: string | null; scheduled_time: string | null;
  price: number | null; notes: string | null; staff_id: string | null;
  staff?: { id: string; name: string; phone: string | null } | null;
  project_id?: string | null; parent_job_id?: string | null;
  is_milestone?: boolean; priority?: Priority; position?: number;
  created_at: string;
}

interface Project {
  id: string; name: string; description: string | null;
  status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  priority: Priority; start_date: string | null; due_date: string | null;
  budget: number | null; currency: string | null; contact_id: string | null;
  contacts?: { id: string; first_name: string | null; last_name: string | null; company: string | null } | null;
  created_at: string;
}

const STATUS_META: Record<Job["status"], { labelKey: TranslationKey; cls: string }> = {
  unassigned: { labelKey: "jobs.statusUnassigned", cls: "bg-gray-800 text-gray-400 border-gray-700" },
  assigned: { labelKey: "jobs.statusAssigned", cls: "bg-blue-900/50 text-blue-300 border-blue-700/50" },
  in_progress: { labelKey: "jobs.statusInProgress", cls: "bg-yellow-900/50 text-yellow-300 border-yellow-700/50" },
  completed: { labelKey: "jobs.statusCompleted", cls: "bg-green-900/50 text-green-300 border-green-700/50" },
  cancelled: { labelKey: "jobs.statusCancelled", cls: "bg-gray-800 text-gray-500 border-gray-700" },
};
const KANBAN_COLUMNS: Job["status"][] = ["unassigned", "assigned", "in_progress", "completed", "cancelled"];

const PRIORITY_META: Record<Priority, { labelKey: TranslationKey; cls: string }> = {
  low: { labelKey: "jobs.priorityLow", cls: "bg-gray-800 text-gray-400 border-gray-700" },
  medium: { labelKey: "jobs.priorityMedium", cls: "bg-blue-900/50 text-blue-300 border-blue-700/50" },
  high: { labelKey: "jobs.priorityHigh", cls: "bg-orange-900/50 text-orange-300 border-orange-700/50" },
  urgent: { labelKey: "jobs.priorityUrgent", cls: "bg-red-900/50 text-red-300 border-red-700/50" },
};

const PROJECT_STATUS_META: Record<Project["status"], { labelKey: TranslationKey; cls: string }> = {
  planning: { labelKey: "jobs.projectStatusPlanning", cls: "bg-gray-800 text-gray-400 border-gray-700" },
  active: { labelKey: "jobs.projectStatusActive", cls: "bg-blue-900/50 text-blue-300 border-blue-700/50" },
  on_hold: { labelKey: "jobs.projectStatusOnHold", cls: "bg-yellow-900/50 text-yellow-300 border-yellow-700/50" },
  completed: { labelKey: "jobs.projectStatusCompleted", cls: "bg-green-900/50 text-green-300 border-green-700/50" },
  cancelled: { labelKey: "jobs.projectStatusCancelled", cls: "bg-gray-800 text-gray-500 border-gray-700" },
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
  const t = useT();
  const [f, setF] = useState({
    title: "", description: "", address: "", customer_name: "", customer_phone: "",
    scheduled_date: "", scheduled_time: "", price: "", staff_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!f.title.trim()) { setError(t("jobs.titleRequired")); return; }
    setSaving(true); setError(null);
    const res = await fetch("/api/jobs", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { setError(d.error ?? t("jobs.failed")); return; }
    onCreated(d); onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-gray-950 border border-gray-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{t("jobs.newJobTitle")}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>
        <input className={inputCls} placeholder={t("jobs.jobTitlePlaceholder")} value={f.title}
          onChange={(e) => setF(p => ({ ...p, title: e.target.value }))} />
        <textarea className={inputCls} rows={2} placeholder={t("jobs.detailsPlaceholder")} value={f.description}
          onChange={(e) => setF(p => ({ ...p, description: e.target.value }))} />
        <input className={inputCls} placeholder={t("jobs.addressPlaceholder")} value={f.address}
          onChange={(e) => setF(p => ({ ...p, address: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3">
          <input className={inputCls} placeholder={t("jobs.customerNamePlaceholder")} value={f.customer_name}
            onChange={(e) => setF(p => ({ ...p, customer_name: e.target.value }))} />
          <input className={inputCls} placeholder={t("jobs.customerPhonePlaceholder")} value={f.customer_phone}
            onChange={(e) => setF(p => ({ ...p, customer_phone: e.target.value }))} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <input className={inputCls} type="date" value={f.scheduled_date}
            onChange={(e) => setF(p => ({ ...p, scheduled_date: e.target.value }))} />
          <input className={inputCls} type="time" value={f.scheduled_time}
            onChange={(e) => setF(p => ({ ...p, scheduled_time: e.target.value }))} />
          <input className={inputCls} type="number" min={0} step="0.01" placeholder={t("jobs.pricePlaceholder")} value={f.price}
            onChange={(e) => setF(p => ({ ...p, price: e.target.value }))} />
        </div>
        <select className={inputCls} value={f.staff_id} onChange={(e) => setF(p => ({ ...p, staff_id: e.target.value }))}>
          <option value="">{t("jobs.assignLater")}</option>
          {staff.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name}{s.role_title ? ` — ${s.role_title}` : ""}</option>)}
        </select>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button onClick={save} disabled={saving} className={`${btnPrimary} w-full justify-center`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} {t("jobs.createJob")}
        </button>
      </div>
    </div>
  );
}

function StaffTab({ staff, setStaff }: { staff: Staff[]; setStaff: (fn: (s: Staff[]) => Staff[]) => void }) {
  const t = useT();
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
    if (!confirm(t("jobs.removeConfirm", { name: s.name }))) return;
    await fetch(`/api/staff?id=${s.id}`, { method: "DELETE" });
    setStaff(l => l.filter(x => x.id !== s.id));
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-2">
        <input className={inputCls} placeholder={t("jobs.namePlaceholder")} value={f.name} onChange={(e) => setF(p => ({ ...p, name: e.target.value }))} />
        <input className={inputCls} placeholder={t("jobs.phoneWhatsappPlaceholder")} value={f.phone} onChange={(e) => setF(p => ({ ...p, phone: e.target.value }))} />
        <input className={inputCls} placeholder={t("jobs.rolePlaceholder")} value={f.role_title} onChange={(e) => setF(p => ({ ...p, role_title: e.target.value }))} />
        <button onClick={add} disabled={saving} className={btnPrimary}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        </button>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
        {staff.length === 0 && <div className="text-center py-10 text-gray-500 text-sm">{t("jobs.noStaffYet")}</div>}
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
            <button onClick={() => toggle(s)} className={btnGhost}>{s.active ? t("jobs.deactivate") : t("jobs.activate")}</button>
            <button onClick={() => remove(s)} className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-gray-800"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewProjectModal({ onClose, onCreated }: {
  onClose: () => void; onCreated: (p: Project) => void;
}) {
  const t = useT();
  const [f, setF] = useState({ name: "", description: "", priority: "medium" as Priority, due_date: "", budget: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!f.name.trim()) { setError(t("jobs.projectNameRequired")); return; }
    setSaving(true); setError(null);
    const res = await fetch("/api/projects", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { setError(d.error ?? t("jobs.failed")); return; }
    onCreated(d); onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-gray-950 border border-gray-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{t("jobs.newProjectTitle")}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>
        <input className={inputCls} placeholder={t("jobs.projectNamePlaceholder")} value={f.name}
          onChange={(e) => setF(p => ({ ...p, name: e.target.value }))} />
        <textarea className={inputCls} rows={2} placeholder={t("jobs.projectDescPlaceholder")} value={f.description}
          onChange={(e) => setF(p => ({ ...p, description: e.target.value }))} />
        <div className="grid grid-cols-3 gap-3">
          <select className={inputCls} value={f.priority} onChange={(e) => setF(p => ({ ...p, priority: e.target.value as Priority }))}>
            {(["low", "medium", "high", "urgent"] as const).map(p => <option key={p} value={p}>{t(PRIORITY_META[p].labelKey)}</option>)}
          </select>
          <input className={inputCls} type="date" value={f.due_date}
            onChange={(e) => setF(p => ({ ...p, due_date: e.target.value }))} />
          <input className={inputCls} type="number" min={0} step="0.01" placeholder={t("jobs.budget")} value={f.budget}
            onChange={(e) => setF(p => ({ ...p, budget: e.target.value }))} />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button onClick={save} disabled={saving} className={`${btnPrimary} w-full justify-center`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} {t("jobs.createProject")}
        </button>
      </div>
    </div>
  );
}

function NewTaskModal({ staff, tasks, onClose, onCreated }: {
  staff: Staff[]; tasks: Job[]; onClose: () => void; onCreated: (j: Job) => void;
}) {
  const t = useT();
  const [f, setF] = useState({
    title: "", description: "", priority: "medium" as Priority, is_milestone: false,
    parent_job_id: "", staff_id: "", price: "", scheduled_date: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!f.title.trim()) { setError(t("jobs.titleRequired")); return; }
    setSaving(true); setError(null);
    const res = await fetch("/api/jobs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, parent_job_id: f.parent_job_id || null }),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { setError(d.error ?? t("jobs.failed")); return; }
    onCreated(d); onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-gray-950 border border-gray-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{t("jobs.newTaskTitle")}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>
        <input className={inputCls} placeholder={t("jobs.jobTitlePlaceholder")} value={f.title}
          onChange={(e) => setF(p => ({ ...p, title: e.target.value }))} />
        <textarea className={inputCls} rows={2} placeholder={t("jobs.detailsPlaceholder")} value={f.description}
          onChange={(e) => setF(p => ({ ...p, description: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3">
          <select className={inputCls} value={f.priority} onChange={(e) => setF(p => ({ ...p, priority: e.target.value as Priority }))}>
            {(["low", "medium", "high", "urgent"] as const).map(p => <option key={p} value={p}>{t(PRIORITY_META[p].labelKey)}</option>)}
          </select>
          <select className={inputCls} value={f.parent_job_id} onChange={(e) => setF(p => ({ ...p, parent_job_id: e.target.value }))}>
            <option value="">{t("jobs.noParentTask")}</option>
            {tasks.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <input className={inputCls} type="date" value={f.scheduled_date}
            onChange={(e) => setF(p => ({ ...p, scheduled_date: e.target.value }))} />
          <input className={inputCls} type="number" min={0} step="0.01" placeholder={t("jobs.pricePlaceholder")} value={f.price}
            onChange={(e) => setF(p => ({ ...p, price: e.target.value }))} />
          <select className={inputCls} value={f.staff_id} onChange={(e) => setF(p => ({ ...p, staff_id: e.target.value }))}>
            <option value="">{t("jobs.assignLater")}</option>
            {staff.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={f.is_milestone} onChange={(e) => setF(p => ({ ...p, is_milestone: e.target.checked }))} />
          {t("jobs.markMilestone")}
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button onClick={save} disabled={saving} className={`${btnPrimary} w-full justify-center`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} {t("jobs.addTask")}
        </button>
      </div>
    </div>
  );
}

function ProjectBoard({ projectId, staff, onBack, onProjectDeleted }: {
  projectId: string; staff: Staff[]; onBack: () => void; onProjectDeleted: (id: string) => void;
}) {
  const t = useT();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTask, setShowNewTask] = useState(false);
  const [invoiced, setInvoiced] = useState<Record<string, { number: string; token: string }>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}`);
    if (res.ok) {
      const d = await res.json();
      setProject(d.project); setTasks(d.tasks);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  async function patchTask(j: Job, fields: Record<string, unknown>) {
    const res = await fetch("/api/jobs", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: j.id, ...fields }),
    });
    if (res.ok) { const updated = await res.json(); setTasks(l => l.map(x => x.id === j.id ? updated : x)); }
  }

  async function deleteTask(j: Job) {
    if (!confirm(t("jobs.deleteConfirm", { title: j.title }))) return;
    const res = await fetch(`/api/jobs?id=${j.id}`, { method: "DELETE" });
    if (res.ok) setTasks(l => l.filter(x => x.id !== j.id));
  }

  async function patchProject(fields: Record<string, unknown>) {
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields),
    });
    if (res.ok) setProject(await res.json());
  }

  async function deleteProject() {
    if (!project || !confirm(t("jobs.deleteProjectConfirm", { name: project.name }))) return;
    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    if (res.ok) { onProjectDeleted(projectId); onBack(); }
  }

  async function invoiceTask(j: Job) {
    if (j.price == null) return;
    const res = await fetch("/api/invoices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: j.customer_name || project?.contacts?.company ||
          [project?.contacts?.first_name, project?.contacts?.last_name].filter(Boolean).join(" ") || j.title,
        customer_phone: j.customer_phone,
        currency: project?.currency || undefined,
        items: [{ description: j.title, quantity: 1, unit_price: j.price }],
        notes: t("jobs.invoiceFromTaskNote", { title: j.title }),
      }),
    });
    if (res.ok) {
      const inv = await res.json();
      setInvoiced(prev => ({ ...prev, [j.id]: { number: inv.invoice_number, token: inv.public_token } }));
    } else {
      alert(t("jobs.invoiceFailed"));
    }
  }

  function copyInvoiceLink(token: string, jobId: string) {
    navigator.clipboard.writeText(`${window.location.origin}/invoice/${token}`);
    setCopied(jobId);
    setTimeout(() => setCopied(null), 1500);
  }

  if (loading || !project) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>;
  }

  return (
    <div className="space-y-5">
      <button onClick={onBack} className={btnGhost}><ArrowLeft className="w-4 h-4" /> {t("jobs.backToProjects")}</button>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-white">{project.name}</h2>
            {project.description && <p className="text-sm text-gray-400 mt-0.5">{project.description}</p>}
            {project.contacts && (
              <p className="text-xs text-gray-500 mt-1">
                {project.contacts.company || [project.contacts.first_name, project.contacts.last_name].filter(Boolean).join(" ")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              value={project.status} onChange={(e) => patchProject({ status: e.target.value })}>
              {Object.keys(PROJECT_STATUS_META).map(s => (
                <option key={s} value={s}>{t(PROJECT_STATUS_META[s as Project["status"]].labelKey)}</option>
              ))}
            </select>
            <button onClick={deleteProject} className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-gray-800"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
          {project.due_date && <span>{t("jobs.dueDate")}: {project.due_date}</span>}
          {project.budget != null && <span>{t("jobs.budget")}: {Number(project.budget).toFixed(2)}</span>}
          <span className={`px-2 py-0.5 rounded-full border ${PRIORITY_META[project.priority].cls}`}>{t(PRIORITY_META[project.priority].labelKey)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{t("jobs.tabJobs")}</h3>
        <button onClick={() => setShowNewTask(true)} className={btnPrimary}><Plus className="w-4 h-4" /> {t("jobs.addTask")}</button>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-max">
          {KANBAN_COLUMNS.map((status) => {
            const inColumn = tasks.filter(j => j.status === status);
            return (
              <div key={status} className="w-72 shrink-0"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const jobId = e.dataTransfer.getData("jobId");
                  const job = tasks.find(x => x.id === jobId);
                  if (job && job.status !== status) patchTask(job, { status });
                }}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_META[status].cls}`}>{t(STATUS_META[status].labelKey)}</span>
                  <span className="text-xs text-gray-500">{inColumn.length}</span>
                </div>
                <div className="space-y-2 min-h-24 bg-gray-900/50 border border-gray-800 rounded-xl p-2">
                  {inColumn.map((j) => {
                    const parent = j.parent_job_id ? tasks.find(x => x.id === j.parent_job_id) : null;
                    const inv = invoiced[j.id];
                    return (
                      <div key={j.id} draggable
                        onDragStart={(e) => e.dataTransfer.setData("jobId", j.id)}
                        className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {j.is_milestone && <Star className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                              <span className="text-sm font-medium text-white">{j.title}</span>
                            </div>
                            {parent && <div className="text-xs text-gray-500 truncate">↳ {parent.title}</div>}
                          </div>
                          <button onClick={() => deleteTask(j)} className="text-gray-600 hover:text-red-400 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full border ${PRIORITY_META[j.priority ?? "medium"].cls}`}>{t(PRIORITY_META[j.priority ?? "medium"].labelKey)}</span>
                          {j.price != null && <span className="text-xs text-gray-400">{Number(j.price).toFixed(2)}</span>}
                        </div>
                        <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white"
                          value={j.staff_id ?? ""} onChange={(e) => patchTask(j, { staff_id: e.target.value || null })}>
                          <option value="">{t("jobs.unassignedOption")}</option>
                          {staff.filter(s => s.active || s.id === j.staff_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        {j.status === "completed" && j.price != null && (
                          inv ? (
                            <button onClick={() => copyInvoiceLink(inv.token, j.id)}
                              className="inline-flex items-center gap-1.5 text-xs text-green-300 border border-green-700/50 bg-green-900/30 px-2 py-1 rounded-lg w-full justify-center">
                              {copied === j.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {inv.number}
                            </button>
                          ) : (
                            <button onClick={() => invoiceTask(j)}
                              className="inline-flex items-center gap-1.5 text-xs text-indigo-300 border border-indigo-700/50 bg-indigo-900/30 hover:bg-indigo-900/50 px-2 py-1 rounded-lg w-full justify-center">
                              <FileText className="w-3.5 h-3.5" /> {t("jobs.createInvoice")}
                            </button>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-600 mt-3">{t("jobs.dragHint")}</p>
      </div>

      {showNewTask && (
        <NewTaskModal staff={staff} tasks={tasks} onClose={() => setShowNewTask(false)}
          onCreated={(j) => setTasks(l => [...l, { ...j, project_id: projectId }])} />
      )}
    </div>
  );
}

function ProjectsTab({ projects, setProjects, staff }: {
  projects: Project[]; setProjects: (fn: (p: Project[]) => Project[]) => void; staff: Staff[];
}) {
  const t = useT();
  const [showNew, setShowNew] = useState(false);
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);

  if (openProjectId) {
    return (
      <ProjectBoard projectId={openProjectId} staff={staff}
        onBack={() => setOpenProjectId(null)}
        onProjectDeleted={(id) => setProjects(l => l.filter(p => p.id !== id))} />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{t("jobs.tabProjects")}</h3>
        <button onClick={() => setShowNew(true)} className={btnPrimary}><Plus className="w-4 h-4" /> {t("jobs.newProject")}</button>
      </div>
      {projects.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl text-center py-16 text-gray-500 text-sm">
          {t("jobs.noProjectsYet")}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((p) => (
            <button key={p.id} onClick={() => setOpenProjectId(p.id)}
              className="text-left bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-4 space-y-2 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-white truncate">{p.name}</span>
                <FolderKanban className="w-4 h-4 text-indigo-400 shrink-0" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${PROJECT_STATUS_META[p.status].cls}`}>{t(PROJECT_STATUS_META[p.status].labelKey)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_META[p.priority].cls}`}>{t(PRIORITY_META[p.priority].labelKey)}</span>
              </div>
              {p.contacts && (
                <p className="text-xs text-gray-500 truncate">
                  {p.contacts.company || [p.contacts.first_name, p.contacts.last_name].filter(Boolean).join(" ")}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
      {showNew && (
        <NewProjectModal onClose={() => setShowNew(false)} onCreated={(p) => setProjects(l => [p, ...l])} />
      )}
    </div>
  );
}

const FILTER_KEY: Record<string, TranslationKey> = {
  active: "jobs.filterActive", unassigned: "jobs.filterUnassigned", assigned: "jobs.filterAssigned",
  in_progress: "jobs.filterInProgress", completed: "jobs.filterCompleted", cancelled: "jobs.filterCancelled", all: "jobs.filterAll",
};

export default function JobsClient({ initialJobs, initialStaff, initialProjects }: {
  initialJobs: Job[]; initialStaff: Staff[]; initialProjects: Project[];
}) {
  const t = useT();
  const [tab, setTab] = useState<"jobs" | "projects" | "staff">("jobs");
  const [jobs, setJobs] = useState(initialJobs);
  const [staff, setStaff] = useState(initialStaff);
  const [projects, setProjects] = useState(initialProjects);
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
    if (!confirm(t("jobs.deleteConfirm", { title: j.title }))) return;
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
          <Briefcase className="w-6 h-6 text-indigo-400" /> {t("jobs.title")}
        </h1>
        <button onClick={() => setShowNew(true)} className={btnPrimary}><Plus className="w-4 h-4" /> {t("jobs.newJob")}</button>
      </div>

      <div className="flex gap-1 border-b border-gray-800">
        {([["jobs", t("jobs.tabJobs"), Briefcase], ["projects", t("jobs.tabProjects"), FolderKanban], ["staff", t("jobs.tabStaff"), Users]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === id ? "border-indigo-500 text-white" : "border-transparent text-gray-400 hover:text-gray-200"
            }`}>
            <Icon className="w-4 h-4" /> {label}
            {id === "staff" && <span className="text-xs text-gray-500">{staff.filter(s => s.active).length}</span>}
            {id === "projects" && !!projects.length && <span className="text-xs text-gray-500">{projects.length}</span>}
          </button>
        ))}
      </div>

      {tab === "staff" && <StaffTab staff={staff} setStaff={setStaff} />}
      {tab === "projects" && <ProjectsTab projects={projects} setProjects={setProjects} staff={staff} />}

      {tab === "jobs" && (
        <>
          <div className="flex gap-2 flex-wrap">
            {["active", "unassigned", "assigned", "in_progress", "completed", "cancelled", "all"].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  filter === s ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-700 text-gray-400 hover:border-gray-500"
                }`}>{t(FILTER_KEY[s])}</button>
            ))}
          </div>

          <div className="space-y-3">
            {shown.length === 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl text-center py-16 text-gray-500 text-sm">
                {t("jobs.noJobsHere")}
              </div>
            )}
            {shown.map((j) => (
              <div key={j.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{j.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_META[j.status].cls}`}>{t(STATUS_META[j.status].labelKey)}</span>
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
                    <option value="">{t("jobs.unassignedOption")}</option>
                    {staff.filter(s => s.active || s.id === j.staff_id).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>

                  {j.staff?.phone && (
                    <a href={staffWaLink(j, j.staff.phone)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-green-600/20 border border-green-700/50 text-green-300 hover:bg-green-600/30 px-2.5 py-1.5 rounded-lg text-xs transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" /> {t("jobs.sendBrief")}
                    </a>
                  )}
                  {j.customer_phone && (
                    <a href={`tel:${j.customer_phone}`}
                      className="inline-flex items-center gap-1.5 border border-gray-700 text-gray-300 hover:bg-gray-800 px-2.5 py-1.5 rounded-lg text-xs transition-colors">
                      <Phone className="w-3.5 h-3.5" /> {t("jobs.customer")}
                    </a>
                  )}

                  <div className="ml-auto flex items-center gap-1.5">
                    {["assigned", "unassigned"].includes(j.status) && (
                      <button disabled={busy === j.id} onClick={() => patch(j, { status: "in_progress" })}
                        className="inline-flex items-center gap-1.5 text-xs text-yellow-300 border border-yellow-700/50 bg-yellow-900/30 hover:bg-yellow-900/50 px-2.5 py-1.5 rounded-lg transition-colors">
                        <PlayCircle className="w-3.5 h-3.5" /> {t("jobs.start")}
                      </button>
                    )}
                    {["assigned", "in_progress"].includes(j.status) && (
                      <button disabled={busy === j.id} onClick={() => patch(j, { status: "completed" })}
                        className="inline-flex items-center gap-1.5 text-xs text-green-300 border border-green-700/50 bg-green-900/30 hover:bg-green-900/50 px-2.5 py-1.5 rounded-lg transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {t("jobs.complete")}
                      </button>
                    )}
                    {!["completed", "cancelled"].includes(j.status) && (
                      <button disabled={busy === j.id} onClick={() => patch(j, { status: "cancelled" })}
                        className="inline-flex items-center gap-1.5 text-xs text-gray-400 border border-gray-700 hover:bg-gray-800 px-2.5 py-1.5 rounded-lg transition-colors">
                        <Ban className="w-3.5 h-3.5" /> {t("jobs.cancel")}
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
