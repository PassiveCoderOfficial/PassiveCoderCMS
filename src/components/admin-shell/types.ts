import type { LucideIcon } from "lucide-react";

/** Union of every field any surface's nav uses (admin/super-admin/staff/
 *  vendor), so one Sidebar component can render all four without each
 *  surface needing its own renderer. A given surface only ever sets the
 *  fields it needs — the rest are simply undefined. */
export type ShellNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  /** Exact-match active state instead of prefix match (super-admin/staff Overview links). */
  exact?: boolean;
  /** External link — opens in new tab, shows an external-link glyph. */
  external?: boolean;
  /** Quick-add link rendered as a small "+" button beside the item (super-admin pattern). */
  add?: string;
  /** admin-only: hide unless NEXT_PUBLIC_APP_MODE is SaaS. */
  saasOnly?: boolean;
  /** admin-only: hide when running in SaaS mode. */
  standaloneOnly?: boolean;
  /** admin-only: hide unless tenants.enabled_modules[moduleKey] is truthy (SA bypasses). */
  moduleKey?: string;
  children?: ShellNavItem[];
};

export type ShellNavSection = {
  label: string;
  items: ShellNavItem[];
  /** "tools" = dark recessed panel (admin Business Tools block).
   *  "brand" = solid brand-color panel (admin Account block).
   *  undefined = plain section. */
  variant?: "tools" | "brand";
};

/** Visual theme for the whole shell — "light" follows the app's normal
 *  light/dark mode tokens (tenant admin), "dark" is permanently dark
 *  regardless of theme (super-admin/staff consoles, matches their existing
 *  always-dark gray-900 look). */
export type ShellTheme = "light" | "dark";
