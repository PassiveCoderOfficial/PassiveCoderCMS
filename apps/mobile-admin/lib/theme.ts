// Design tokens for the admin/tenant companion app.
//
// Passive Coder brand orange (matches public/branding/passivecoder-icon.png
// and the app icon/splash gradient — #ff8a3d → #f2610c).
//
// Both palettes are defined here and selected at runtime by useTheme()
// (lib/themeContext.tsx) so every screen can follow the device's light/dark
// setting. Import `useTheme()` in components rather than these raw objects
// where the value must react to a theme change; the raw `colors` export
// stays as the light palette for the few places a static value is needed
// (e.g. app.json-adjacent config, StatusBar defaults before context mounts).

export type ColorScheme = "light" | "dark";

export interface Palette {
  primary700: string;
  primary600: string;
  primary500: string;
  primary100: string;
  primary50: string;

  green600: string;
  green50: string;
  green700: string;

  amber600: string;
  amber50: string;
  amber700: string;

  red600: string;
  red50: string;
  red700: string;

  white: string;
  bg: string;
  bgElevated: string;
  card: string;
  border: string;
  borderStrong: string;
  overlay: string;
  skeleton: string;

  text: string;
  textMuted: string;
  textFaint: string;
  onPrimary: string;
}

export const lightPalette: Palette = {
  primary700: "#c2410c",
  primary600: "#f2610c",
  primary500: "#ff8a3d",
  primary100: "#ffe4cc",
  primary50: "#fff3e8",

  green600: "#16a34a",
  green50: "#dcfce7",
  green700: "#15803d",

  amber600: "#d97706",
  amber50: "#fffbeb",
  amber700: "#b45309",

  red600: "#dc2626",
  red50: "#fef2f2",
  red700: "#b91c1c",

  white: "#ffffff",
  bg: "#f8fafc",           // slate-50
  bgElevated: "#ffffff",
  card: "#ffffff",
  border: "#e2e8f0",       // slate-200
  borderStrong: "#cbd5e1", // slate-300
  overlay: "rgba(15, 23, 42, 0.45)",
  skeleton: "#e8edf3",

  text: "#0f172a",         // slate-900
  textMuted: "#64748b",    // slate-500
  textFaint: "#94a3b8",    // slate-400
  onPrimary: "#ffffff",
};

export const darkPalette: Palette = {
  // Slightly lifted orange — the light-mode #f2610c reads muddy on a dark
  // ground, so the dark scheme leans on the brighter end of the gradient.
  primary700: "#ff9d5c",
  primary600: "#ff8a3d",
  primary500: "#ff7a24",
  primary100: "#4a2510",
  primary50: "#2e1709",

  green600: "#22c55e",
  green50: "#0f2a1a",
  green700: "#4ade80",

  amber600: "#f59e0b",
  amber50: "#2b1f07",
  amber700: "#fbbf24",

  red600: "#ef4444",
  red50: "#2c1315",
  red700: "#f87171",

  white: "#ffffff",
  bg: "#0b1120",
  bgElevated: "#131c2e",
  card: "#131c2e",
  border: "#243044",
  borderStrong: "#33415c",
  overlay: "rgba(0, 0, 0, 0.6)",
  skeleton: "#1c2740",

  text: "#f1f5f9",
  textMuted: "#94a3b8",
  textFaint: "#64748b",
  onPrimary: "#1a0d04",
};

/** Static light palette. Prefer useTheme() inside components. */
export const colors = lightPalette;

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

/** Type scale — keeps headings/labels consistent instead of ad-hoc sizes. */
export const type = {
  display: { fontSize: 28, fontWeight: "800" },
  title: { fontSize: 20, fontWeight: "800" },
  heading: { fontSize: 16, fontWeight: "700" },
  body: { fontSize: 14, fontWeight: "400" },
  bodyStrong: { fontSize: 14, fontWeight: "700" },
  label: { fontSize: 12, fontWeight: "600" },
  caption: { fontSize: 11, fontWeight: "400" },
} as const;

/** Shadow presets. Android needs elevation, iOS needs the shadow* family. */
export const shadow = {
  card: {
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  raised: {
    shadowColor: "#0f172a",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
} as const;
