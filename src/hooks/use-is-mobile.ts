"use client";

import { useEffect, useState } from "react";

// Matches the `lg:` Tailwind breakpoint (1024px) the builder already switches
// desktop/mobile layout on. SSR-safe: renders the desktop shell first (false)
// then corrects on mount, avoiding hydration mismatch.
const MOBILE_QUERY = "(max-width: 1023px)";

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isMobile;
}
