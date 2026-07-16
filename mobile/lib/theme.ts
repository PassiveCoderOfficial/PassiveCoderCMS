// Design tokens mirrored from the website so the app reads as the same
// product. Colours here match the Tailwind values used on blood.passivecoder.com.

export const colors = {
  red700: "#b91c1c",
  red600: "#dc2626",
  red500: "#ef4444",
  red50: "#fef2f2",
  red100: "#fee2e2",

  green600: "#16a34a",
  green50: "#dcfce7",
  green700: "#15803d",

  white: "#ffffff",
  bg: "#f9fafb",          // page background (gray-50)
  card: "#ffffff",
  border: "#e5e7eb",      // gray-200
  borderStrong: "#d1d5db",// gray-300

  text: "#111827",        // gray-900
  textMuted: "#6b7280",   // gray-500
  textFaint: "#9ca3af",   // gray-400
} as const;

/** Availability chip colours — identical to lib/donors/availability.ts on web. */
export const availabilityMeta: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  ready:       { label: "Ready",       bg: "#dcfce7", text: "#15803d", dot: "#22c55e" },
  soon:        { label: "Almost ready",bg: "#fef9c3", text: "#a16207", dot: "#eab308" },
  not_ready:   { label: "Not yet",     bg: "#fee2e2", text: "#b91c1c", dot: "#ef4444" },
  unknown:     { label: "Unknown",     bg: "#fef9c3", text: "#a16207", dot: "#eab308" },
  unavailable: { label: "Unavailable", bg: "#e5e7eb", text: "#4b5563", dot: "#9ca3af" },
};

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export const GENDERS = ["male", "female", "other"] as const;
export const RELIGIONS = ["muslim", "hindu", "christian", "buddhist", "other"] as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
