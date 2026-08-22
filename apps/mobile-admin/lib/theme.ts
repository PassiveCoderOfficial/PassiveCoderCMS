// Design tokens for the admin/tenant companion app.
//
// Passive Coder brand orange (matches public/branding/passivecoder-icon.png
// and the app icon/splash gradient — #ff8a3d → #f2610c).

export const colors = {
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
  bg: "#f8fafc",          // slate-50
  card: "#ffffff",
  border: "#e2e8f0",      // slate-200
  borderStrong: "#cbd5e1",// slate-300

  text: "#0f172a",        // slate-900
  textMuted: "#64748b",   // slate-500
  textFaint: "#94a3b8",   // slate-400
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
