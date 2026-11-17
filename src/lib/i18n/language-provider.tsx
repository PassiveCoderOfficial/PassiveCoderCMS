"use client";

// Admin-panel-only language switcher (tenant-facing public sites are a
// separate concern — content templates, not this system). Mirrors
// theme-provider.tsx's exact shape (localStorage-persisted preference,
// same mount/hydration guard) so the two behave identically to a reader
// already familiar with one.

import React, { createContext, useContext, useEffect, useState } from "react";
import { en, type TranslationKey } from "./locales/en";
import { bn } from "./locales/bn";

export type Language = "en" | "bn";

const DICTS: Record<Language, Record<TranslationKey, string>> = { en, bn };

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  /** Looks up `key` in the current language, falling back to English if
   *  somehow missing (should never happen — bn.ts is typed to require
   *  every en.ts key — but a runtime fallback costs nothing and means a
   *  gap shows as English text, not a raw key string, if it ever occurs).
   *  `vars` does simple {name} interpolation for the handful of strings
   *  that need it (e.g. "Submitted {date}"). */
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => {},
  t: (key) => en[key],
});

export function useLanguage() {
  return useContext(LanguageContext);
}

/** Shorthand some components may prefer — `const t = useT();` then `t("key")`. */
export function useT() {
  return useContext(LanguageContext).t;
}

interface LanguageProviderProps {
  children: React.ReactNode;
  storageKey?: string;
}

export function LanguageProvider({ children, storageKey = "cms-admin-language" }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Language | null;
    if (stored === "en" || stored === "bn") setLanguageState(stored);
    setMounted(true);
  }, [storageKey]);

  function setLanguage(next: Language) {
    localStorage.setItem(storageKey, next);
    setLanguageState(next);
  }

  function t(key: TranslationKey, vars?: Record<string, string | number>): string {
    let str = DICTS[language][key] ?? en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(`{${k}}`, String(v));
      }
    }
    return str;
  }

  // Same flash-prevention pattern as ThemeProvider: hide content until the
  // persisted preference has loaded, so a Bangla-preferring user doesn't
  // see a flash of English on every page load.
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ language, setLanguage, t }}>
        <div style={{ visibility: "hidden" }}>{children}</div>
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
