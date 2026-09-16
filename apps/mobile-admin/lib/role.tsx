// Resolves what kind of user is logged in and, for tenant users, which
// tenants they belong to. Mirrors the priority order used server-side by
// apiTenantId()/getCurrentTenantId(): super_admins > pc_staff > tenant
// membership > owned tenants (fallback for an owner with no membership row).

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./auth";
import { supabase } from "./supabase";
import type { Tenant, TenantMembership, TenantMemberRole } from "./types";

export type ResolvedRole = "super_admin" | "pc_staff" | "tenant" | null;

interface RoleCtx {
  role: ResolvedRole;
  isManager: boolean;
  memberships: TenantMembership[];
  loading: boolean;
  /** Re-runs resolution without waiting for the `user` object's identity to
   *  change. Needed after onboarding creates a brand-new tenant_members row
   *  server-side — nothing about the auth session itself changes, so the
   *  effect below would never re-fire on its own, and the app would keep
   *  showing "no sites yet" for a tenant that was just created. */
  refresh: () => Promise<void>;
}

const Ctx = createContext<RoleCtx>({
  role: null,
  isManager: false,
  memberships: [],
  loading: true,
  refresh: async () => {},
});

export const useRole = () => useContext(Ctx);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [role, setRole] = useState<ResolvedRole>(null);
  const [isManager, setIsManager] = useState(false);
  const [memberships, setMemberships] = useState<TenantMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const cancelledRef = useRef(false);

  const resolve = useCallback(async () => {
    if (!user) {
      setRole(null);
      setIsManager(false);
      setMemberships([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Super admin.
    const { data: sa } = await supabase
      .from("super_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (cancelledRef.current) return;
    if (sa) {
      // Same real bug as the pc_staff branch below, one level up: a super
      // admin can ALSO genuinely own real tenants directly (confirmed
      // live — an SA account owned 8 real tenant_members rows, all
      // invisible here before this fix, because this branch hard-stopped
      // with memberships:[] the instant SA status was confirmed). The
      // (tenant)/dashboard and (tenant)/sites tabs are reachable
      // regardless of role (see (tenant)/_layout.tsx's own comment: "safe
      // destinations regardless of selection state") — an SA landing on
      // them via the bottom tab bar, not just (admin)/tenants, needs
      // their own sites populated same as anyone else.
      const built = await fetchMemberships(user.id);
      if (cancelledRef.current) return;
      setRole("super_admin");
      setIsManager(false);
      setMemberships(built);
      setLoading(false);
      return;
    }

    // 2. Passive Coder staff.
    const { data: staff } = await supabase
      .from("pc_staff")
      .select("user_id, status, is_manager")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (cancelledRef.current) return;
    if (staff) {
      // A staff member can ALSO own/co-manage real tenant_members rows —
      // web's (admin)/layout.tsx explicitly handles this ("staff who also
      // own a site already have full access to it via hasTenantAccess/
      // memberships"). Mobile used to hard-stop here with memberships:[],
      // which made a staff member's own client sites (or "Passive Coder"
      // itself, which every staffer is an admin member of) completely
      // invisible — the (admin)/tenants cross-tenant list is manager-only,
      // so a non-manager staffer landed there and hit an unrecoverable
      // 401 with nowhere else to go. Fetch memberships for staff too, same
      // query as step 3 below.
      const built = await fetchMemberships(user.id);
      if (cancelledRef.current) return;
      setRole("pc_staff");
      setIsManager(Boolean(staff.is_manager));
      setMemberships(built);
      setLoading(false);
      return;
    }

    // 3. Tenant membership.
    let built = await fetchMemberships(user.id);
    if (cancelledRef.current) return;

    // 4. Fallback: tenants owned directly with no membership row (shouldn't
    // normally happen — ownership is supposed to be mirrored into
    // tenant_members — but this covers it defensively, same as the web).
    if (built.length === 0) {
      const { data: owned } = await supabase
        .from("tenants")
        .select("id, slug, name, owner_id, plan, status, custom_domain, domain_status, trial_ends_at, enabled_modules")
        .eq("owner_id", user.id);
      if (cancelledRef.current) return;
      built = (owned ?? []).map((t) => ({ tenantId: t.id, role: "owner" as const, tenant: t as Tenant }));
    }

    setRole(built.length > 0 ? "tenant" : null);
    setIsManager(false);
    setMemberships(built);
    setLoading(false);
  }, [user]);

  async function fetchMemberships(userId: string): Promise<TenantMembership[]> {
    const { data: rows } = await supabase
      .from("tenant_members")
      .select(
        "tenant_id, role, tenants(id, slug, name, owner_id, plan, status, custom_domain, domain_status, trial_ends_at, enabled_modules)"
      )
      .eq("user_id", userId);

    // supabase-js types the joined relation loosely; narrow it by hand.
    type Row = { tenant_id: string; role: TenantMemberRole; tenants: Tenant | Tenant[] | null };
    return ((rows ?? []) as Row[])
      .map((r) => {
        const tenant = Array.isArray(r.tenants) ? r.tenants[0] : r.tenants;
        if (!tenant) return null;
        return { tenantId: r.tenant_id, role: r.role, tenant };
      })
      .filter((m): m is TenantMembership => m !== null);
  }

  useEffect(() => {
    cancelledRef.current = false;
    resolve();
    return () => {
      cancelledRef.current = true;
    };
  }, [resolve]);

  // Memoised: an object literal here would be a new identity on every render,
  // re-rendering every useRole() consumer and re-firing effects that depend on
  // `memberships` (notably SelectedTenantProvider's resolve()).
  const value = useMemo(
    () => ({ role, isManager, memberships, loading, refresh: resolve }),
    [role, isManager, memberships, loading, resolve],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
