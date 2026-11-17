import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The people a site can be assigned to (the one responsible for building it
 * or for its first support): active staff (tenants.assigned_staff_id) and
 * super admins (tenants.assigned_admin_id). One of the two is set, or neither.
 */
export type Assignee = { id: string; name: string };
export type Assignees = { staff: Assignee[]; admins: Assignee[] };

/** Option value used by the assign pickers: "staff:<pc_staff.id>" or "admin:<user id>". */
export function assigneeKey(site: { assigned_staff_id?: string | null; assigned_admin_id?: string | null }): string {
  return site.assigned_staff_id ? `staff:${site.assigned_staff_id}` : site.assigned_admin_id ? `admin:${site.assigned_admin_id}` : "";
}

export function assigneeName(key: string, people: Assignees): string | null {
  if (!key) return null;
  const [kind, id] = key.split(":");
  const hit = (kind === "staff" ? people.staff : people.admins).find((p) => p.id === id);
  return hit?.name ?? (kind === "staff" ? "Former staff" : "Super admin");
}

/** Server side: load both lists with a service-role client. */
export async function loadAssignees(db: SupabaseClient): Promise<Assignees> {
  const [{ data: staff }, { data: sa }] = await Promise.all([
    db.from("pc_staff").select("id, full_name, email").eq("status", "active").order("full_name"),
    db.from("super_admins").select("user_id"),
  ]);
  const ids = ((sa ?? []) as { user_id: string }[]).map((s) => s.user_id);
  const { data: profiles } = ids.length ? await db.from("profiles").select("id, full_name, email").in("id", ids) : { data: [] };
  const label = (n: string | null, e: string | null, fallback: string) => n?.trim() || e || fallback;
  return {
    staff: ((staff ?? []) as { id: string; full_name: string | null; email: string | null }[]).map((s) => ({ id: s.id, name: label(s.full_name, s.email, "Staff") })),
    admins: ((profiles ?? []) as { id: string; full_name: string | null; email: string | null }[]).map((p) => ({ id: p.id, name: label(p.full_name, p.email, "Super admin") })),
  };
}
