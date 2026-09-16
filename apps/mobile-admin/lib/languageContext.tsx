// Language selection, mirrors themeContext.tsx's exact shape (AsyncStorage-
// persisted preference, same provider/hook pattern) so a reader already
// familiar with one recognizes the other immediately. English default,
// Bangla the only other option for now (Wali explicitly dropped Arabic —
// no RTL layout work needed).

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { en, type TranslationKey } from "./locales/en";
import { bn } from "./locales/bn";

export type Language = "en" | "bn";

const DICTS: Record<Language, Record<TranslationKey, string>> = { en, bn };
const PREF_KEY = "language_preference";

interface LanguageCtx {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<LanguageCtx>({
  language: "en",
  setLanguage: () => {},
  t: (key) => en[key],
});

export const useLanguage = () => useContext(Ctx);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    AsyncStorage.getItem(PREF_KEY)
      .then((v) => {
        if (v === "en" || v === "bn") setLanguageState(v);
      })
      .catch(() => {});
  }, []);

  function setLanguage(lang: Language) {
    setLanguageState(lang);
    AsyncStorage.setItem(PREF_KEY, lang).catch(() => {});
  }

  const value = useMemo(() => {
    function t(key: TranslationKey, vars?: Record<string, string | number>): string {
      let str = DICTS[language][key] ?? en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(`{${k}}`, String(v));
        }
      }
      return str;
    }
    return { language, setLanguage, t };
  }, [language]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
