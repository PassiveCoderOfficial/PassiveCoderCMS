/**
 * Menu look (menus P1, Nov 2026): layouts, presets and style overrides for
 * the new menu renderer (components/blocks/navigation/menu-renderer.tsx).
 *
 * The look belongs to the PLACEMENT, not to the menu (plan 4.1): the same
 * menu can be a bar in the header, a list in the footer and a sidebar on a
 * page. P2 stores a MenuStyle on the header element, footer widget and Menu
 * block; P1 ships the model, the presets, the CSS variables and the renderer,
 * and the Navigation screen's preview uses them.
 *
 * Everything maps to CSS variables and data attributes on the menu's root
 * (styles in app/menus.css), so no per-site CSS is ever written. Pure: no
 * React, no Supabase. Unknown or unsafe values are dropped by
 * normalizeMenuStyle, so a style can be stored as it comes from the editor.
 */

export const MENU_LAYOUTS = ["bar", "vertical", "inline", "accordion", "drawer"] as const;
export type MenuLayout = (typeof MENU_LAYOUTS)[number];

export const MENU_PRESETS = ["plain", "underline", "pill", "boxed", "brand", "caps", "bold", "soft"] as const;
export type MenuPreset = (typeof MENU_PRESETS)[number];

export const ACTIVE_STYLES = ["none", "underline", "pill", "bold", "dot"] as const;
export const HOVER_STYLES = ["none", "color", "background", "underline", "lift"] as const;
export const DROPDOWN_LOOKS = ["card", "flat", "dark"] as const;
export const SHADOWS = ["none", "sm", "md", "lg"] as const;
export const ANIMATIONS = ["fade", "slide", "none"] as const;
export const DRAWER_STYLES = ["side", "full", "dropdown"] as const;
export const ITEM_SIZES = ["sm", "md", "lg"] as const;

export interface MenuDropdownStyle {
  look?: (typeof DROPDOWN_LOOKS)[number];
  /** px, 0-32 */
  radius?: number;
  shadow?: (typeof SHADOWS)[number];
  /** Minimum width in px, 160-480 */
  width?: number;
  bg?: string;
  fg?: string;
  animation?: (typeof ANIMATIONS)[number];
}

export interface MenuPhoneStyle {
  drawer?: (typeof DRAWER_STYLES)[number];
  size?: (typeof ITEM_SIZES)[number];
  dividers?: boolean;
}

export interface MenuStyle {
  preset?: MenuPreset;
  /** px, 11-28 */
  fontSize?: number;
  fontWeight?: 400 | 500 | 600 | 700 | 800;
  /** em, -0.05 to 0.3 */
  letterSpacing?: number;
  uppercase?: boolean;
  /** Space between items, px 0-64 */
  gap?: number;
  /** Item padding, px 0-40 / 0-24 */
  padX?: number;
  padY?: number;
  /** Item corner radius, px 0-999 */
  radius?: number;
  color?: string;
  hoverColor?: string;
  hoverBg?: string;
  activeColor?: string;
  activeBg?: string;
  active?: (typeof ACTIVE_STYLES)[number];
  hover?: (typeof HOVER_STYLES)[number];
  dropdown?: MenuDropdownStyle;
  phone?: MenuPhoneStyle;
}

/** Fully resolved look: preset values with the overrides on top. */
export type ResolvedMenuStyle = Required<Omit<MenuStyle, "preset" | "dropdown" | "phone" | "color" | "hoverColor" | "hoverBg" | "activeColor" | "activeBg">> &
  Pick<MenuStyle, "color" | "hoverColor" | "hoverBg" | "activeColor" | "activeBg"> & {
    preset: MenuPreset;
    dropdown: Required<Pick<MenuDropdownStyle, "look" | "radius" | "shadow" | "width" | "animation">> & Pick<MenuDropdownStyle, "bg" | "fg">;
    phone: Required<MenuPhoneStyle>;
  };

const BASE: ResolvedMenuStyle = {
  preset: "plain",
  fontSize: 14.4, fontWeight: 500, letterSpacing: 0, uppercase: false,
  gap: 4, padX: 14, padY: 8, radius: 8,
  active: "bold", hover: "background",
  dropdown: { look: "card", radius: 16, shadow: "lg", width: 220, animation: "fade" },
  phone: { drawer: "side", size: "md", dividers: false },
};

/** The eight starting looks. Overrides always win over the preset. */
export const PRESET_STYLES: Record<MenuPreset, Partial<ResolvedMenuStyle>> = {
  plain: {},
  underline: { hover: "underline", active: "underline", radius: 0, gap: 8 },
  pill: { radius: 999, hover: "background", active: "pill", padX: 16, gap: 6 },
  boxed: { radius: 6, hover: "background", active: "pill", padX: 14, padY: 10, gap: 2 },
  brand: { color: "hsl(var(--primary))", hoverColor: "hsl(var(--primary))", activeColor: "hsl(var(--primary))", active: "underline", hover: "color", fontWeight: 600 },
  caps: { uppercase: true, letterSpacing: 0.08, fontSize: 12.5, fontWeight: 600, hover: "color", active: "dot", gap: 12 },
  bold: { fontWeight: 700, fontSize: 15.5, hover: "lift", active: "underline" },
  soft: { radius: 12, hover: "background", active: "pill", fontWeight: 500, padX: 16, padY: 10, dropdown: { look: "flat", radius: 12, shadow: "md", width: 240, animation: "slide" } },
};

const COLOR_RE = /^(#[0-9a-f]{3,8}|(rgb|rgba|hsl|hsla)\(\s*[0-9.,%\s/]+\)|hsl\(var\(--[a-z0-9-]+\)\)|var\(--[a-z0-9-]+\)|transparent|currentcolor|white|black)$/i;

export function safeColor(v: unknown): string | undefined {
  return typeof v === "string" && COLOR_RE.test(v.trim()) ? v.trim() : undefined;
}

function num(v: unknown, min: number, max: number): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : undefined;
}

function pick<T extends readonly string[]>(v: unknown, list: T): T[number] | undefined {
  return typeof v === "string" && (list as readonly string[]).includes(v) ? (v as T[number]) : undefined;
}

/** Drops undefined keys, so a normalized style holds only what was really set. */
function compact<T extends object>(o: T): T {
  for (const k of Object.keys(o) as (keyof T)[]) if (o[k] === undefined) delete o[k];
  return o;
}

/** Cleans a stored or submitted style: only known keys, safe colours, values in range. Null when nothing is set. */
export function normalizeMenuStyle(input: unknown): MenuStyle | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const s = input as Record<string, unknown>;
  const weight = num(s.fontWeight, 400, 800);
  const dd = (s.dropdown && typeof s.dropdown === "object" && !Array.isArray(s.dropdown) ? s.dropdown : {}) as Record<string, unknown>;
  const ph = (s.phone && typeof s.phone === "object" && !Array.isArray(s.phone) ? s.phone : {}) as Record<string, unknown>;
  const dropdown = compact<MenuDropdownStyle>({
    look: pick(dd.look, DROPDOWN_LOOKS),
    radius: num(dd.radius, 0, 32),
    shadow: pick(dd.shadow, SHADOWS),
    width: num(dd.width, 160, 480),
    bg: safeColor(dd.bg),
    fg: safeColor(dd.fg),
    animation: pick(dd.animation, ANIMATIONS),
  });
  const phone = compact<MenuPhoneStyle>({
    drawer: pick(ph.drawer, DRAWER_STYLES),
    size: pick(ph.size, ITEM_SIZES),
    dividers: typeof ph.dividers === "boolean" ? ph.dividers : undefined,
  });
  const out = compact<MenuStyle>({
    preset: pick(s.preset, MENU_PRESETS),
    fontSize: num(s.fontSize, 11, 28),
    fontWeight: weight === undefined ? undefined : (Math.round(weight / 100) * 100) as MenuStyle["fontWeight"],
    letterSpacing: num(s.letterSpacing, -0.05, 0.3),
    uppercase: typeof s.uppercase === "boolean" ? s.uppercase : undefined,
    gap: num(s.gap, 0, 64),
    padX: num(s.padX, 0, 40),
    padY: num(s.padY, 0, 24),
    radius: num(s.radius, 0, 999),
    color: safeColor(s.color),
    hoverColor: safeColor(s.hoverColor),
    hoverBg: safeColor(s.hoverBg),
    activeColor: safeColor(s.activeColor),
    activeBg: safeColor(s.activeBg),
    active: pick(s.active, ACTIVE_STYLES),
    hover: pick(s.hover, HOVER_STYLES),
    dropdown: Object.keys(dropdown).length ? dropdown : undefined,
    phone: Object.keys(phone).length ? phone : undefined,
  });
  return Object.keys(out).length ? out : null;
}

/** Preset values with the style's own values on top. No style = the plain look. */
export function resolveMenuStyle(style?: MenuStyle | null): ResolvedMenuStyle {
  const s = normalizeMenuStyle(style) ?? {};
  const preset = s.preset ?? "plain";
  const p = PRESET_STYLES[preset];
  const { dropdown: sd, phone: sp, ...rest } = s;
  return {
    ...BASE,
    ...p,
    ...rest,
    preset,
    dropdown: { ...BASE.dropdown, ...(p.dropdown ?? {}), ...(sd ?? {}) },
    phone: { ...BASE.phone, ...(p.phone ?? {}), ...(sp ?? {}) },
  } as ResolvedMenuStyle;
}

const SHADOW_CSS: Record<(typeof SHADOWS)[number], string> = {
  none: "none",
  sm: "0 2px 6px -2px rgb(0 0 0 / 0.12)",
  md: "0 8px 20px -6px rgb(0 0 0 / 0.18)",
  lg: "var(--shadow-lg, 0 18px 40px -12px rgb(0 0 0 / 0.25))",
};

/**
 * CSS variables and data attributes for the menu root. Colours left unset
 * are not written, so the menu inherits the colour of where it sits.
 */
export function menuStyleVars(style?: MenuStyle | null): { style: Record<string, string>; attrs: Record<string, string> } {
  const r = resolveMenuStyle(style);
  const v: Record<string, string> = {
    "--pcm-fs": `${r.fontSize / 16}rem`,
    "--pcm-fw": String(r.fontWeight),
    "--pcm-ls": `${r.letterSpacing}em`,
    "--pcm-tt": r.uppercase ? "uppercase" : "none",
    "--pcm-gap": `${r.gap}px`,
    "--pcm-px": `${r.padX}px`,
    "--pcm-py": `${r.padY}px`,
    "--pcm-radius": `${r.radius}px`,
    "--pcm-dd-radius": `${r.dropdown.radius}px`,
    "--pcm-dd-shadow": SHADOW_CSS[r.dropdown.shadow],
    "--pcm-dd-width": `${r.dropdown.width}px`,
  };
  if (r.color) v["--pcm-color"] = r.color;
  if (r.hoverColor) v["--pcm-hover-color"] = r.hoverColor;
  if (r.hoverBg) v["--pcm-hover-bg"] = r.hoverBg;
  if (r.activeColor) v["--pcm-active-color"] = r.activeColor;
  if (r.activeBg) v["--pcm-active-bg"] = r.activeBg;
  if (r.dropdown.bg) v["--pcm-dd-bg"] = r.dropdown.bg;
  if (r.dropdown.fg) v["--pcm-dd-fg"] = r.dropdown.fg;
  const attrs: Record<string, string> = {
    "data-pcm-hover": r.hover,
    "data-pcm-active": r.active,
    "data-pcm-dd": r.dropdown.look,
    "data-pcm-anim": r.dropdown.animation,
    "data-pcm-size": r.phone.size,
  };
  if (r.phone.dividers) attrs["data-pcm-dividers"] = "";
  if (r.dropdown.bg || r.dropdown.fg) attrs["data-pcm-dd-custom"] = "";
  return { style: v, attrs };
}

/** Is `url` the page at `pathname`? Exact, or a sub-path (/services/x under /services); /about is not active on /about-us. */
export function isActivePath(url: string, pathname: string | null | undefined): boolean {
  if (!pathname || !url || url === "#" || /^[a-z]+:/i.test(url)) return false;
  const path = url.split(/[?#]/)[0] || "";
  if (!path.startsWith("/")) return false;
  const clean = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
  const a = clean(path);
  const b = clean(pathname);
  if (a === "/") return b === "/";
  return b === a || b.startsWith(a + "/");
}
