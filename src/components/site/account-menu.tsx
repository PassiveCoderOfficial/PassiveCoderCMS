"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

const LABELS: Record<string, { account: string; login: string; signup: string; orders: string; logout: string }> = {
  en: { account: "My account", login: "Log in", signup: "Create an account", orders: "My orders", logout: "Log out" },
  ar: { account: "حسابي", login: "تسجيل الدخول", signup: "إنشاء حساب", orders: "طلباتي", logout: "تسجيل الخروج" },
};

/**
 * Header account icon with a small menu: "Log in" / "Create an account" for
 * visitors, "My account" / "My orders" / "Log out" once signed in. Opens on
 * hover (desktop) and on click (touch); the session is only checked when the
 * menu first opens, so pages don't pay for it on load.
 */
export function AccountMenu({ lang = "en", color, className }: { lang?: string; color?: string; className?: string }) {
  const t = LABELS[lang] ?? LABELS.en;
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open || signedIn !== null) return;
    let live = true;
    import("@/lib/supabase/client").then(({ createClient }) =>
      createClient().auth.getSession().then(({ data }) => { if (live) setSignedIn(!!data.session); }),
    ).catch(() => { if (live) setSignedIn(false); });
    return () => { live = false; };
  }, [open, signedIn]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  const enter = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setOpen(true); };
  const leave = () => { closeTimer.current = setTimeout(() => setOpen(false), 150); };

  async function logout() {
    const { createClient } = await import("@/lib/supabase/client");
    await createClient().auth.signOut();
    window.location.href = "/";
  }

  const item = "block w-full text-start px-4 py-2.5 text-[0.95rem] text-neutral-800 hover:bg-black/5 transition-colors whitespace-nowrap";
  return (
    <div ref={ref} className={cn("relative", className)} onMouseEnter={enter} onMouseLeave={leave}>
      <button type="button" aria-label={t.account} aria-haspopup="menu" aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded-lg hover:bg-current/10 transition-colors" style={{ color }}>
        <User className="h-5 w-5" />
      </button>
      {open && (
        <div role="menu" className="absolute end-0 top-full mt-1 z-50 min-w-[13rem] rounded-md border border-black/10 bg-white py-1.5 shadow-xl">
          {signedIn ? (
            <>
              <Link role="menuitem" href="/account" className={item} onClick={() => setOpen(false)}>{t.account}</Link>
              <Link role="menuitem" href="/account/orders" className={item} onClick={() => setOpen(false)}>{t.orders}</Link>
              <button role="menuitem" type="button" className={item} onClick={logout}>{t.logout}</button>
            </>
          ) : (
            <>
              <Link role="menuitem" href="/account/login" className={item} onClick={() => setOpen(false)}>{t.login}</Link>
              <Link role="menuitem" href="/account/login?mode=signup" className={item} onClick={() => setOpen(false)}>{t.signup}</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
