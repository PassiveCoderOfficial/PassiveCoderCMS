// Resolves what kind of user is logged in and, for tenant users, which
// tenants they belong to. Mirrors the priority order used server-side by
// apiTenantId()/getCurrentTenantId(): super_admins > pc_staff > tenant
// membership > owned tenants (fallback for an owner with no membership row).

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./auth";
import { supabase } from "./supabase";
import type { Tenant, TenantMembership, TenantMemberRole } from "./types";

export type ResolvedRole = "super_admin" | "pc_staff" | "tenant" | null;

interface RoleCtx {
  role: ResolvedRole;
  isManager: boolean;
  memberships: TenantMembership[];
  loading: boolean;
}

const Ctx = createContext<RoleCtx>({
  role: null,
  isManager: false,
  memberships: [],
  loading: true,
});

export const useRole = () => useContext(Ctx);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [role, setRole] = useState<ResolvedRole>(null);
  const [isManager, setIsManager] = useState(false);
  const [memberships, setMemberships] = useState<TenantMembership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
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
      if (cancelled) return;
      if (sa) {
        setRole("super_admin");
        setIsManager(false);
        setMemberships([]);
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
      if (cancelled) return;
      if (staff) {
        setRole("pc_staff");
        setIsManager(Boolean(staff.is_manager));
        setMemberships([]);
        setLoading(false);
        return;
      }

      // 3. Tenant membership.
      const { data: rows } = await supabase
        .from("tenant_members")
        .select(
          "tenant_id, role, tenants(id, slug, name, owner_id, plan, status, custom_domain, domain_status, trial_ends_at)"
        )
        .eq("user_id", user.id);
      if (cancelled) return;

      // supabase-js types the joined relation loosely; narrow it by hand.
      type Row = { tenant_id: string; role: TenantMemberRole; tenants: Tenant | Tenant[] | null };
      let built: TenantMembership[] = ((rows ?? []) as Row[])
        .map((r) => {
          const tenant = Array.isArray(r.tenants) ? r.tenants[0] : r.tenants;
          if (!tenant) return null;
          return { tenantId: r.tenant_id, role: r.role, tenant };
        })
        .filter((m): m is TenantMembership => m !== null);

      // 4. Fallback: tenants owned directly with no membership row (shouldn't
      // normally happen — ownership is supposed to be mirrored into
      // tenant_members — but this covers it defensively, same as the web).
      if (built.length === 0) {
        const { data: owned } = await supabase
          .from("tenants")
          .select("id, slug, name, owner_id, plan, status, custom_domain, domain_status, trial_ends_at")
          .eq("owner_id", user.id);
        if (cancelled) return;
        built = (owned ?? []).map((t) => ({ tenantId: t.id, role: "owner" as const, tenant: t as Tenant }));
      }

      setRole(built.length > 0 ? "tenant" : null);
      setIsManager(false);
      setMemberships(built);
      setLoading(false);
    }

    resolve();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Memoised: an object literal here would be a new identity on every render,
  // re-rendering every useRole() consumer and re-firing effects that depend on
  // `memberships` (notably SelectedTenantProvider's resolve()).
  const value = useMemo(
    () => ({ role, isManager, memberships, loading }),
    [role, isManager, memberships, loading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
