// Tracks which tenant is "active" for a logged-in tenant user. Auto-selects
// when there's exactly one membership; otherwise the sites picker screen
// lets the user choose, and the choice is persisted so it survives restarts.

import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRole } from "./role";

const STORAGE_KEY = "selected_tenant_id";

interface SelectedTenantCtx {
  selectedTenantId: string | null;
  setSelectedTenantId: (id: string | null) => void;
  loading: boolean;
}

const Ctx = createContext<SelectedTenantCtx>({
  selectedTenantId: null,
  setSelectedTenantId: () => {},
  loading: true,
});

export const useSelectedTenant = () => useContext(Ctx);

export function SelectedTenantProvider({ children }: { children: React.ReactNode }) {
  const { memberships, loading: roleLoading } = useRole();
  const [selectedTenantId, setSelectedTenantIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load persisted choice once, then validate/auto-select whenever the
  // membership list changes (e.g. after login).
  useEffect(() => {
    if (roleLoading) return;

    let cancelled = false;

    async function resolve() {
      if (memberships.length === 1) {
        if (!cancelled) {
          setSelectedTenantIdState(memberships[0].tenantId);
          setLoading(false);
        }
        // Keep storage in sync even in the single-tenant case.
        AsyncStorage.setItem(STORAGE_KEY, memberships[0].tenantId).catch(() => {});
        return;
      }

      if (memberships.length === 0) {
        if (!cancelled) {
          setSelectedTenantIdState(null);
          setLoading(false);
        }
        return;
      }

      // Multiple memberships — check for a still-valid persisted choice.
      const stored = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
      if (cancelled) return;
      const stillValid = stored && memberships.some((m) => m.tenantId === stored);
      if (stillValid) {
        setSelectedTenantIdState(stored);
      } else {
        setSelectedTenantIdState(null);
        await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
      }
      setLoading(false);
    }

    resolve();
    return () => {
      cancelled = true;
    };
  }, [memberships, roleLoading]);

  function setSelectedTenantId(id: string | null) {
    setSelectedTenantIdState(id);
    if (id) AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
    else AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }

  return (
    <Ctx.Provider value={{ selectedTenantId, setSelectedTenantId, loading: roleLoading || loading }}>
      {children}
    </Ctx.Provider>
  );
}
