// Cross-tenant super_admin / pc_staff management — goes through the
// Bearer-authed Next.js backend (super-admin routes are service-role-backed
// server-side, not direct-Supabase like lib/queries/pages.ts/tenant.ts,
// since these read/write across ALL tenants and must not rely on
// tenant-scoped RLS).

import { apiFetch } from "../api";

/** Shape returned by GET /api/super-admin/sites — confirmed by reading
 * src/app/api/super-admin/sites/route.ts's select() column list. */
export interface AdminTenantListItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  custom_domain: string | null;
  domain_status: string;
  created_at: string;
  onboarding_completed: boolean;
  deletion_requested_at: string | null;
  owner_id: string | null;
}

export interface CreateTenantInput {
  name: string;
  slug: string;
  plan?: string;
  owner_user_id?: string;
  template_id?: string;
  template_mode?: "theme" | "full";
  assigned_staff_id?: string;
}

export async function listAllTenants(): Promise<AdminTenantListItem[]> {
  const r = await apiFetch<{ sites?: AdminTenantListItem[]; error?: string }>("/api/super-admin/sites");
  if (!r.ok) throw new Error(r.data?.error ?? "Failed to load sites");
  return r.data.sites ?? [];
}

/** Confirmed against src/app/api/super-admin/sites/route.ts POST handler —
 * body shape { name, slug, plan?, owner_user_id?, template_id?, template_mode?, assigned_staff_id? }. */
export async function createTenant(input: CreateTenantInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  const r = await apiFetch<{ id?: string; error?: string }>("/api/super-admin/sites", {
    method: "POST",
    body: input,
  });
  if (!r.ok) return { ok: false, error: r.data?.error ?? "Failed to create site" };
  return { ok: true, id: r.data.id };
}

/** PATCH /api/super-admin/sites/[id] { status } — added alongside this
 * screen (no prior route changed tenant status directly by id). */
export async function suspendTenant(tenantId: string): Promise<{ ok: boolean; error?: string }> {
  const r = await apiFetch<{ error?: string }>(`/api/super-admin/sites/${tenantId}`, {
    method: "PATCH",
    body: { status: "suspended" },
  });
  if (!r.ok) return { ok: false, error: r.data?.error ?? "Failed to suspend site" };
  return { ok: true };
}

/** See suspendTenant(). */
export async function activateTenant(tenantId: string): Promise<{ ok: boolean; error?: string }> {
  const r = await apiFetch<{ error?: string }>(`/api/super-admin/sites/${tenantId}`, {
    method: "PATCH",
    body: { status: "active" },
  });
  if (!r.ok) return { ok: false, error: r.data?.error ?? "Failed to activate site" };
  return { ok: true };
}

/** Confirmed against src/app/api/super-admin/sites/[id]/assign-agent/route.ts —
 * the route is per-tenant-id (POST /api/super-admin/sites/{tenantId}/assign-agent),
 * NOT a global /assign-agent endpoint, and its body is { agent_id: string | null }
 * (not { staffId } as a naive guess might assume). */
export async function assignAgent(tenantId: string, staffId: string | null): Promise<{ ok: boolean; error?: string }> {
  const r = await apiFetch<{ error?: string }>(`/api/super-admin/sites/${tenantId}/assign-agent`, {
    method: "POST",
    body: { agent_id: staffId },
  });
  if (!r.ok) return { ok: false, error: r.data?.error ?? "Failed to assign agent" };
  return { ok: true };
}
