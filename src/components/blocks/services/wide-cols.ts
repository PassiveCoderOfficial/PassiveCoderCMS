// Grid classes for 5-10 columns on the Services block (2-4 are set per variant).
// Phones get 2, tablets 3-4, desktops the full count. Literal strings so
// Tailwind generates them.
export const WIDE_COLS: Record<number, string> = {
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  7: "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7",
  8: "grid-cols-2 sm:grid-cols-4 lg:grid-cols-8",
  9: "grid-cols-2 sm:grid-cols-4 lg:grid-cols-9",
  10: "grid-cols-2 sm:grid-cols-5 lg:grid-cols-10",
};
