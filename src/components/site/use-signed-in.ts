"use client";

import { useEffect, useState } from "react";

/**
 * Is the visitor signed in to this site (menus P1: items shown only to
 * guests or only to signed-in customers)? Pages are cached for everyone, so
 * the answer comes from the browser session after the first paint: null
 * until then. The session is read once per page load and shared by every
 * menu on the page, and only when `needed` (a menu that uses the setting),
 * so menus without it never touch auth.
 */
let pending: Promise<boolean> | null = null;

function readSession(): Promise<boolean> {
  pending ??= import("@/lib/supabase/client")
    .then(({ createClient }) => createClient().auth.getSession())
    .then(({ data }) => !!data.session)
    .catch(() => false);
  return pending;
}

export function useSignedIn(needed: boolean): boolean | null {
  // Starts null on the server and in the first browser render alike (no
  // hydration mismatch); a session another menu already read resolves at once.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    if (!needed) return;
    let live = true;
    readSession().then((v) => { if (live) setSignedIn(v); });
    return () => { live = false; };
  }, [needed]);
  return needed ? signedIn : null;
}
