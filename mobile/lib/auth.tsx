import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, setToken } from "./api";
import { registerForPush, unregisterPush } from "./push";

export interface Me {
  id: string;
  name: string;
  phone: string;
  blood_group: string;
  photo_url: string | null;
  is_admin?: boolean;
}

interface AuthCtx {
  me: Me | null | undefined;          // undefined = still loading
  refresh: () => Promise<void>;
  login: (phone: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (v: { name: string; phone: string; password: string; blood_group: string }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  me: undefined,
  refresh: async () => {},
  login: async () => ({ ok: false }),
  signup: async () => ({ ok: false }),
  logout: async () => {},
});

export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null | undefined>(undefined);

  const refresh = useCallback(async () => {
    const r = await api<{ donor: Me | null }>("/api/donors/auth/me", "GET");
    setMe(r.ok ? r.data.donor ?? null : null);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Keep this install's push token pointed at the current account.
  useEffect(() => {
    if (me) registerForPush().catch(() => {});
  }, [me]);

  const login = useCallback(async (phone: string, password: string) => {
    const r = await api<{ token?: string; error?: string }>(
      "/api/donors/auth/login", "POST", { phone, password });
    if (!r.ok) return { ok: false, error: r.data.error ?? "Login failed" };
    if (r.data.token) await setToken(r.data.token);
    await refresh();
    return { ok: true };
  }, [refresh]);

  const signup = useCallback(async (v: { name: string; phone: string; password: string; blood_group: string }) => {
    const r = await api<{ token?: string; error?: string }>(
      "/api/donors/auth/signup", "POST", v);
    if (!r.ok) return { ok: false, error: r.data.error ?? "Signup failed" };
    if (r.data.token) await setToken(r.data.token);
    await refresh();
    return { ok: true };
  }, [refresh]);

  const logout = useCallback(async () => {
    await unregisterPush().catch(() => {});
    await api("/api/donors/auth/logout", "POST", {});
    await setToken(null);
    setMe(null);
  }, []);

  return (
    <Ctx.Provider value={{ me, refresh, login, signup, logout }}>
      {children}
    </Ctx.Provider>
  );
}
