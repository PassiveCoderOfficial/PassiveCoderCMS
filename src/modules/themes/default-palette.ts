/**
 * Neutral palette/typography used when a site or template has none of its own.
 *
 * Previously each surface (preview resolver, browser-item adapter, colors
 * editor via the registry's CLEAN_PRO default) carried its own copy of these
 * hex values, so "the default look" quietly differed depending on which screen
 * you were on. One definition, used everywhere.
 */
import type { TemplatePalette, TemplateTypography } from "./template-types";

export const DEFAULT_PALETTE: TemplatePalette = {
  primary: "#4f46e5",
  primaryFg: "#ffffff",
  secondary: "#1e293b",
  accent: "#818cf8",
  background: "#ffffff",
  foreground: "#0f172a",
  muted: "#f1f5f9",
  mutedFg: "#64748b",
  card: "#ffffff",
  border: "#e2e8f0",
  ring: "#4f46e5",
  borderRadius: "0.5rem",
};

export const DEFAULT_TYPOGRAPHY: TemplateTypography = {
  headingFont: "Inter",
  bodyFont: "Inter",
  headingWeight: "700",
  letterSpacing: "-0.01em",
};
