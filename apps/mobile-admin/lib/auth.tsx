// Real-Supabase auth context. Modeled on cms/mobile/lib/auth.tsx's
// provider/hook shape, but this app uses supabase-js auth directly instead
// of a custom token/OTP backend.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { registerForPush, unregisterPush } from "./push";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  /** New-account signup — for the onboarding wizard. Mirrors the web
   *  AuthGate's supabase.auth.signUp call, including phone_whatsapp in
   *  user_metadata (WhatsApp is mandatory at signup, same as web). Confirm-
   *  email must be disabled project-side (same requirement web already
   *  has) or this errors instead of returning an active session. */
  signup: (email: string, password: string, whatsapp: string) => Promise<{ ok: boolean; userId?: string; error?: string }>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  loading: true,
  login: async () => ({ ok: false, error: "Not ready" }),
  signup: async () => ({ ok: false, error: "Not ready" }),
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

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    // Fire-and-forget — push registration must never block or fail login.
    registerForPush().catch(() => {});
    return { ok: true };
  }, []);

  const signup = useCallback(async (email: string, password: string, whatsapp: string) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { phone_whatsapp: whatsapp } },
    });
    if (error) return { ok: false, error: error.message };
    if (!data.session) {
      // Confirm-email is on for this Supabase project — same failure mode
      // web's AuthGate documents (it needs confirm-email disabled to get an
      // active session back immediately). Not something the app can work
      // around client-side.
      return { ok: false, error: "Check your email to confirm your account, then log in." };
    }
    registerForPush().catch(() => {});
    return { ok: true, userId: data.user?.id };
  }, []);

  const logout = useCallback(async () => {
    // Best-effort, and must run BEFORE signOut() while the session (and thus
    // the Bearer token apiFetch reads) is still valid.
    await unregisterPush().catch(() => {});
    await supabase.auth.signOut();
  }, []);

  // `user` is derived, so it must be memoised on the session — RoleProvider's
  // effect keys off `user`, and a fresh object each render would re-run the
  // whole role/membership resolution on every unrelated state change.
  const user = useMemo(() => session?.user ?? null, [session]);

  const value = useMemo(
    () => ({ session, user, loading, login, signup, logout }),
    [session, user, loading, login, signup, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
