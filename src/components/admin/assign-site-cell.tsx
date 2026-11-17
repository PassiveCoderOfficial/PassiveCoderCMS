"use client";

import { useState } from "react";
import { Loader2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { assigneeName, type Assignees } from "@/lib/sites/assignees";

/**
 * Per-row "who is responsible for this site" control, for the Staff Portal
 * and Super Admin site lists. Shows the current person; with canEdit (super
 * admins and the Staff Manager) a picker of active staff and super admins,
 * plus Unassign. Saves through /api/super-admin/sites/[id]/assign-agent,
 * which checks the caller and writes the action list.
 */
export function AssignSiteCell({ siteId, value, people, canEdit, selfKey, onChanged }: {
  siteId: string;
  /** "staff:<id>", "admin:<user id>" or "" */
  value: string;
  people: Assignees;
  canEdit: boolean;
  /** The caller's own option, listed first as "Me". */
  selfKey?: string;
  onChanged?: (value: string) => void;
}) {
  const [current, setCurrent] = useState(value);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const name = assigneeName(current, people);

  async function save(next: string) {
    if (next === current) { setOpen(false); return; }
    setSaving(true);
    const [kind, id] = next ? next.split(":") : [null, null];
    const res = await fetch(`/api/super-admin/sites/${siteId}/assign-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: kind === "staff" ? id : null, admin_user_id: kind === "admin" ? id : null }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? "Could not assign");
      return;
    }
    setCurrent(next);
    setOpen(false);
    onChanged?.(next);
    toast.success(next ? `Assigned to ${assigneeName(next, people)}` : "Unassigned");
  }

  const label = name ? <span className="text-xs">{current === selfKey ? `${name} (me)` : name}</span> : <span className="text-xs text-muted-foreground">Unassigned</span>;
  if (!canEdit) return label;

  if (!open) {
    return (
      <div className="flex flex-col items-start gap-0.5">
        {label}
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          <UserCog className="w-3 h-3" /> {name ? "Change" : "Assign"}
        </button>
      </div>
    );
  }

  const self = selfKey ? [...people.staff.map((p) => ({ k: `staff:${p.id}`, n: p.name })), ...people.admins.map((p) => ({ k: `admin:${p.id}`, n: p.name }))].find((o) => o.k === selfKey) : undefined;
  return (
    <div className="flex items-center gap-1.5">
      <select
        autoFocus
        defaultValue={current}
        disabled={saving}
        onChange={(e) => save(e.target.value)}
        aria-label="Responsible person"
        className="h-8 max-w-[180px] rounded-md border bg-background px-1.5 text-xs"
      >
        <option value="">Unassigned</option>
        {self && <option value={self.k}>Me ({self.n})</option>}
        <optgroup label="Staff">
          {people.staff.filter((p) => `staff:${p.id}` !== selfKey).map((p) => <option key={p.id} value={`staff:${p.id}`}>{p.name}</option>)}
        </optgroup>
        <optgroup label="Super admins">
          {people.admins.filter((p) => `admin:${p.id}` !== selfKey).map((p) => <option key={p.id} value={`admin:${p.id}`}>{p.name}</option>)}
        </optgroup>
      </select>
      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /> : (
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:underline">Cancel</button>
      )}
    </div>
  );
}

/** Filter options for a site list: anyone, unassigned, me, then each person. */
export function AssigneeFilter({ value, onChange, people, selfKey }: { value: string; onChange: (v: string) => void; people: Assignees; selfKey?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Responsible person" className="h-9 rounded-lg border bg-background px-2 text-sm">
      <option value="">Anyone responsible</option>
      <option value="none">Unassigned</option>
      {selfKey && <option value={selfKey}>Assigned to me</option>}
      <optgroup label="Staff">
        {people.staff.map((p) => <option key={p.id} value={`staff:${p.id}`}>{p.name}</option>)}
      </optgroup>
      <optgroup label="Super admins">
        {people.admins.map((p) => <option key={p.id} value={`admin:${p.id}`}>{p.name}</option>)}
      </optgroup>
    </select>
  );
}

/** Does a site's assignee key pass the filter value from AssigneeFilter? */
export function matchesAssignee(key: string, filter: string): boolean {
  return !filter || (filter === "none" ? !key : key === filter);
}
