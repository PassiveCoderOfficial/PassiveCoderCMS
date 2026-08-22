// Real-Supabase auth context. Modeled on cms/mobile/lib/auth.tsx's
// provider/hook shape, but this app uses supabase-js auth directly instead
// of a custom token/OTP backend.

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { registerForPush, unregisterPush } from "./push";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  loading: true,
  login: async () => ({ ok: false, error: "Not ready" }),
  logout: async () => {},
});

export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    // Fire-and-forget — push registration must never block or fail login.
    registerForPush().catch(() => {});
    return { ok: true };
  }

  async function logout() {
    // Best-effort, and must run BEFORE signOut() while the session (and thus
    // the Bearer token apiFetch reads) is still valid.
    await unregisterPush().catch(() => {});
    await supabase.auth.signOut();
  }

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, loading, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}
