// Runtime light/dark palette selection. Follows the device setting by
// default; the user can pin light or dark from Profile, persisted so the
// choice survives a restart.

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { darkPalette, lightPalette, type ColorScheme, type Palette } from "./theme";

export type ThemePreference = "system" | "light" | "dark";

const PREF_KEY = "theme_preference";

interface ThemeCtx {
  palette: Palette;
  scheme: ColorScheme;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

const Ctx = createContext<ThemeCtx>({
  palette: lightPalette,
  scheme: "light",
  preference: "system",
  setPreference: () => {},
});

export const useTheme = () => useContext(Ctx);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    AsyncStorage.getItem(PREF_KEY)
      .then((v) => {
        if (v === "light" || v === "dark" || v === "system") setPreferenceState(v);
      })
      .catch(() => {});
  }, []);

  function setPreference(p: ThemePreference) {
    setPreferenceState(p);
    AsyncStorage.setItem(PREF_KEY, p).catch(() => {});
  }

  const scheme: ColorScheme =
    preference === "system" ? (deviceScheme === "dark" ? "dark" : "light") : preference;

  const value = useMemo(
    () => ({
      palette: scheme === "dark" ? darkPalette : lightPalette,
      scheme,
      preference,
      setPreference,
    }),
    [scheme, preference],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
