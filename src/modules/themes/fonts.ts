/**
 * Curated Google Fonts offered in the design settings. Kept to fonts that
 * read well as website type, with a clear role hint for the picker. Anything
 * not in this list (a template's legacy font stack, a CSS var reference) is
 * still honoured, it just isn't loaded from Google.
 */
export const FONT_OPTIONS: { name: string; category: "sans" | "serif" | "display" }[] = [
  { name: "Inter", category: "sans" },
  { name: "Poppins", category: "sans" },
  { name: "Montserrat", category: "sans" },
  { name: "DM Sans", category: "sans" },
  { name: "Manrope", category: "sans" },
  { name: "Plus Jakarta Sans", category: "sans" },
  { name: "Outfit", category: "sans" },
  { name: "Work Sans", category: "sans" },
  { name: "Nunito", category: "sans" },
  { name: "Lato", category: "sans" },
  { name: "Open Sans", category: "sans" },
  { name: "Roboto", category: "sans" },
  { name: "Hind Siliguri", category: "sans" },
  { name: "Raleway", category: "sans" },
  { name: "Source Sans 3", category: "sans" },
  { name: "Playfair Display", category: "serif" },
  { name: "Fraunces", category: "serif" },
  { name: "Lora", category: "serif" },
  { name: "Merriweather", category: "serif" },
  { name: "Cormorant Garamond", category: "serif" },
  { name: "Bodoni Moda", category: "serif" },
  { name: "DM Serif Display", category: "serif" },
  { name: "Space Grotesk", category: "display" },
  { name: "Sora", category: "display" },
  { name: "Bebas Neue", category: "display" },
  { name: "Oswald", category: "display" },
  { name: "Archivo Black", category: "display" },
];

/** Plain family name from a template font value, or null when it's a stack
 *  / CSS var reference (already loaded some other way, e.g. next/font). */
function familyName(f: string | undefined): string | null {
  if (!f || /var\(|,/.test(f)) return null;
  return f.replace(/['"]/g, "").trim() || null;
}

/** Google Fonts stylesheet URL for the given families, or null if none need
 *  loading. Inter is skipped: the root layout already ships it via next/font. */
export function googleFontsHref(fonts: (string | undefined)[]): string | null {
  const families = [...new Set(fonts.map(familyName).filter((f): f is string => !!f && f !== "Inter"))]
    // Only a sane font-name charset reaches the URL — values come from the DB.
    .filter((f) => /^[A-Za-z0-9 ]{2,40}$/.test(f));
  if (!families.length) return null;
  const q = families.map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700;800`).join("&");
  return `https://fonts.googleapis.com/css2?${q}&display=swap`;
}
