"use client";

import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { saveWorldTheme, storedWorldTheme, worldForPath, type World } from "@/lib/theme/worlds";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  /** The admin world this page belongs to (lib/theme/worlds.ts), null everywhere else. */
  world: World | null;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
  world: null,
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(resolved: "light" | "dark", world: World | null) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  // Native controls and scrollbars follow the world. Outside the worlds this
  // stays unset, as it always has (a tenant site pins its own).
  root.style.colorScheme = world ? resolved : "";
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "cms-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname();
  const world = worldForPath(pathname ?? "", typeof window === "undefined" ? "" : window.location.hostname);
  const worldRef = useRef(world);

  const sync = () => {
    const root = document.documentElement;
    if (world) {
      root.dataset.world = world;
      // Arriving from a public site by client navigation: its lock is not ours.
      delete root.dataset.themeLocked;
    } else {
      delete root.dataset.world;
    }

    // A published tenant site that pins its own theme stamps
    // documentElement with data-theme-locked (set by (site)/layout.tsx's
    // inline head script, before this provider ever mounts) — this
    // provider's own system-preference sync must never override that lock.
    // Without this check, a light-locked tenant site briefly rendered
    // correctly on first paint, then this effect ran on mount, checked the
    // visitor's real OS dark-mode preference, and stomped the lock straight
    // back to dark — the exact bug (site)/layout.tsx's own comment already
    // describes fixing once, that came back because this provider is
    // mounted globally in the root layout with no route-group awareness.
    const locked = root.dataset.themeLocked;
    if (locked === "light" || locked === "dark") {
      setThemeState(locked as Theme);
      setResolvedTheme(locked as "light" | "dark");
      setMounted(true);
      return;
    }

    const initial = world ? storedWorldTheme(world) : (localStorage.getItem(storageKey) as Theme | null) ?? defaultTheme;
    setThemeState(initial);
    const resolved = resolveTheme(initial);
    setResolvedTheme(resolved);
    applyTheme(resolved, world);
    setMounted(true);
  };

  // A world is stamped before paint, so moving between worlds by client
  // navigation never shows one frame in the other's colours. Pages outside the
  // worlds keep the passive effect they have always had.
  useLayoutEffect(() => {
    worldRef.current = world;
    if (world) sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world]);
  useEffect(() => {
    if (!world) sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, defaultTheme, storageKey]);

  useEffect(() => {
    if (document.documentElement.dataset.themeLocked) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      setThemeState((prev) => {
        if (prev === "system") {
          const r = getSystemTheme();
          setResolvedTheme(r);
          applyTheme(r, worldRef.current);
        }
        return prev;
      });
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const setTheme = (next: Theme) => {
    const current = worldRef.current;
    if (current) saveWorldTheme(current, next);
    else localStorage.setItem(storageKey, next);
    setThemeState(next);
    const resolved = resolveTheme(next);
    setResolvedTheme(resolved);
    applyTheme(resolved, current);
  };

  // Prevent flash: hide content until theme class is applied
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, world }}>
        <div style={{ visibility: "hidden" }}>{children}</div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, world }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Toasts follow the admin worlds; everywhere else they stay as they were. */
export function ThemedToaster() {
  const { resolvedTheme, world } = useTheme();
  return <Toaster richColors position="bottom-right" theme={world ? resolvedTheme : undefined} />;
}
