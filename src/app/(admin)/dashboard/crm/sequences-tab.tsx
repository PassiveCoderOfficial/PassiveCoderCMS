"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Check, Pencil, Sparkles, X, Mail, MessageCircle, CheckSquare } from "lucide-react";
import { useT } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/locales/en";

type Trigger = "any" | "booking" | "enquiry" | "order" | "experts_enquiry";
type Kind = "email" | "whatsapp_task" | "task";
interface Step { id: string; delay_hours: number; kind: Kind; subject?: string; body?: string; wa_message?: string }
interface Sequence { id: string; name: string; enabled: boolean; trigger: Trigger; steps: Step[] }

const inputCls = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40";
const btnPrimary = "inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50";
const btnGhost = "inline-flex items-center gap-2 border border-border hover:bg-muted text-foreground/80 px-3 py-2 rounded-lg text-sm transition-colors";

const TRIGGER_KEYS: Record<Trigger, TranslationKey> = {
  any: "crm.seqTriggerAny", booking: "crm.seqTriggerBooking", enquiry: "crm.seqTriggerEnquiry", order: "crm.seqTriggerOrder",
  experts_enquiry: "crm.seqTriggerExperts",
};
const KIND_KEYS: Record<Kind, TranslationKey> = {
  email: "crm.seqKindEmail", whatsapp_task: "crm.seqKindWhatsapp", task: "crm.seqKindTask",
};
const KIND_ICON = { email: Mail, whatsapp_task: MessageCircle, task: CheckSquare };

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)} role="switch" aria-checked={on}
      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${on ? "bg-indigo-600" : "bg-muted-foreground/30"}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${on ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

function StepRow({ step, onChange, onRemove }: { step: Step; onChange: (s: Step) => void; onRemove: () => void }) {
  const t = useT();
  const inDays = step.delay_hours >= 24 && step.delay_hours % 24 === 0;
  const [unit, setUnit] = useState<"h" | "d">(inDays ? "d" : "h");
  const amount = unit === "d" ? step.delay_hours / 24 : step.delay_hours;
  return (
    <div className="bg-muted/40 border border-border rounded-xl p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t("crm.seqDelay")}</span>
        <input type="number" min={0} className={`${inputCls} w-20`} value={amount}
          onChange={(e) => onChange({ ...step, delay_hours: Math.max(0, Number(e.target.value) || 0) * (unit === "d" ? 24 : 1) })} />
        <select className={`${inputCls} w-auto`} value={unit}
          onChange={(e) => { const u = e.target.value as "h" | "d"; setUnit(u); onChange({ ...step, delay_hours: amount * (u === "d" ? 24 : 1) }); }}>
          <option value="h">{t("crm.seqHours")}</option>
          <option value="d">{t("crm.seqDays")}</option>
        </select>
        <span className="text-muted-foreground">{t("crm.seqAfterEnrol")}</span>
        <select className={`${inputCls} w-auto`} value={step.kind} onChange={(e) => onChange({ ...step, kind: e.target.value as Kind })}>
          {(Object.keys(KIND_KEYS) as Kind[]).map(k => <option key={k} value={k}>{t(KIND_KEYS[k])}</option>)}
        </select>
        <button onClick={onRemove} className="ml-auto p-2 text-muted-foreground hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
      </div>
      {step.kind === "email" && (
        <>
          <input className={inputCls} placeholder={t("crm.seqSubject")} value={step.subject ?? ""} onChange={(e) => onChange({ ...step, subject: e.target.value })} />
          <textarea className={inputCls} rows={4} placeholder={t("crm.seqBody")} value={step.body ?? ""} onChange={(e) => onChange({ ...step, body: e.target.value })} />
        </>
      )}
      {step.kind === "whatsapp_task" && (
        <>
          <input className={inputCls} placeholder={t("crm.seqTaskTitle")} value={step.subject ?? ""} onChange={(e) => onChange({ ...step, subject: e.target.value })} />
          <textarea className={inputCls} rows={3} placeholder={t("crm.seqWaMessage")} value={step.wa_message ?? ""} onChange={(e) => onChange({ ...step, wa_message: e.target.value })} />
        </>
      )}
      {step.kind === "task" && (
        <input className={inputCls} placeholder={t("crm.seqTaskTitle")} value={step.subject ?? ""} onChange={(e) => onChange({ ...step, subject: e.target.value })} />
      )}
    </div>
  );
}

function Editor({ initial, onSaved, onCancel }: { initial: Sequence | null; onSaved: (s: Sequence) => void; onCancel: () => void }) {
  const t = useT();
  const [s, setS] = useState<Omit<Sequence, "id"> & { id?: string }>(
    initial ?? { name: "", enabled: true, trigger: "any", steps: [{ id: "s1", delay_hours: 0, kind: "email", subject: "", body: "" }] },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true); setError(null);
    const res = await fetch("/api/crm/sequences", {
      method: s.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { setError(d.error ?? "Error"); return; }
    onSaved(d);
  }

  const setStep = (i: number, st: Step) => setS(p => ({ ...p, steps: p.steps.map((x, j) => (j === i ? st : x)) }));

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">{t("crm.seqName")}</label>
          <input className={inputCls} value={s.name} onChange={(e) => setS(p => ({ ...p, name: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">{t("crm.seqTrigger")}</label>
          <select className={inputCls} value={s.trigger} onChange={(e) => setS(p => ({ ...p, trigger: e.target.value as Trigger }))}>
            {(Object.keys(TRIGGER_KEYS) as Trigger[]).map(k => <option key={k} value={k}>{t(TRIGGER_KEYS[k])}</option>)}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <Toggle on={s.enabled} onChange={(v) => setS(p => ({ ...p, enabled: v }))} /> {t("crm.seqEnabled")}
      </label>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">{t("crm.seqSteps")}</h4>
          <span className="text-xs text-muted-foreground">{t("crm.seqVarsHint")}</span>
        </div>
        {s.steps.map((st, i) => (
          <StepRow key={st.id} step={st} onChange={(x) => setStep(i, x)}
            onRemove={() => setS(p => ({ ...p, steps: p.steps.filter((_, j) => j !== i) }))} />
        ))}
        <button onClick={() => setS(p => ({ ...p, steps: [...p.steps, { id: `s${Date.now()}`, delay_hours: 24, kind: "task", subject: "" }] }))}
          className={btnGhost}><Plus className="w-4 h-4" /> {t("crm.seqAddStep")}</button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={saving || !s.name.trim()} className={btnPrimary}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {t("crm.seqSave")}
        </button>
        <button onClick={onCancel} className={btnGhost}><X className="w-4 h-4" /> {t("crm.cancel")}</button>
      </div>
    </div>
  );
}

export function SequencesTab() {
  const t = useT();
  const [list, setList] = useState<Sequence[] | null>(null);
  const [editing, setEditing] = useState<Sequence | "new" | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/crm/sequences").then(r => r.json()).then(d => setList(Array.isArray(d) ? d : [])).catch(() => setList([]));
  }, []);

  async function addStarter() {
    setBusy(true);
    const res = await fetch("/api/crm/sequences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ starter: true }) });
    setBusy(false);
    if (res.ok) { const d = await res.json(); setList(l => [...(l ?? []), d]); }
  }
  async function toggle(s: Sequence, enabled: boolean) {
    setList(l => l?.map(x => (x.id === s.id ? { ...x, enabled } : x)) ?? null);
    await fetch("/api/crm/sequences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id, enabled }) });
  }
  async function remove(s: Sequence) {
    if (!confirm(t("crm.seqDeleteConfirm"))) return;
    await fetch(`/api/crm/sequences?id=${s.id}`, { method: "DELETE" });
    setList(l => l?.filter(x => x.id !== s.id) ?? null);
  }
  function saved(s: Sequence) {
    setList(l => (l?.some(x => x.id === s.id) ? l.map(x => (x.id === s.id ? s : x)) : [...(l ?? []), s]));
    setEditing(null);
  }

  if (!list) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm text-muted-foreground">{t("crm.seqIntro")}</p>

      {editing ? (
        <Editor initial={editing === "new" ? null : editing} onSaved={saved} onCancel={() => setEditing(null)} />
      ) : (
        <>
          {list.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">{t("crm.seqNone")}</p>
              <button onClick={addStarter} disabled={busy} className={btnPrimary}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {t("crm.seqAddStarter")}
              </button>
            </div>
          )}
          {list.map(s => (
            <div key={s.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
              <Toggle on={s.enabled} onChange={(v) => toggle(s, v)} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground truncate">{s.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                  <span>{t(TRIGGER_KEYS[s.trigger] ?? "crm.seqTriggerAny")}</span>
                  <span>·</span>
                  <span>{t("crm.seqStepsCount", { count: s.steps?.length ?? 0 })}</span>
                  {(s.steps ?? []).map(st => { const I = KIND_ICON[st.kind] ?? CheckSquare; return <I key={st.id} className="w-3.5 h-3.5" />; })}
                </div>
              </div>
              <button onClick={() => setEditing(s)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(s)} className="p-2 text-muted-foreground hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          <button onClick={() => setEditing("new")} className={btnGhost}><Plus className="w-4 h-4" /> {t("crm.seqNew")}</button>
        </>
      )}
    </div>
  );
}

interface Run { id: string; status: string; next_run_at: string; crm_sequences?: { name: string } | { name: string }[] | null }

/** Active sequence runs for one contact, with a Stop button (used in the contact panel). */
export function ContactSequenceRuns({ contactId }: { contactId: string }) {
  const t = useT();
  const [runs, setRuns] = useState<Run[]>([]);
  useEffect(() => {
    fetch(`/api/crm/sequences/runs?contact_id=${contactId}`).then(r => r.json())
      .then(d => setRuns(Array.isArray(d) ? d.filter((r: Run) => r.status === "active") : [])).catch(() => undefined);
  }, [contactId]);
  async function stop(id: string) {
    await fetch("/api/crm/sequences/runs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setRuns(rs => rs.filter(r => r.id !== id));
  }
  if (!runs.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-2">
      {runs.map(r => {
        const seq = Array.isArray(r.crm_sequences) ? r.crm_sequences[0] : r.crm_sequences;
        return (
          <div key={r.id} className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-foreground truncate">{t("crm.seqActiveRun", { name: seq?.name ?? "" })}</div>
              <div className="text-xs text-muted-foreground">
                {t("crm.seqNextStep", { when: new Date(r.next_run_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) })}
              </div>
            </div>
            <button onClick={() => stop(r.id)} className={btnGhost}><X className="w-4 h-4" /> {t("crm.seqStop")}</button>
          </div>
        );
      })}
    </div>
  );
}
