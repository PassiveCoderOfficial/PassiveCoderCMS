/**
 * "Switch to Studio" (menus P5, Nov 2026): shared types and wording.
 *
 * Decision 2026-11-17: classic headers and footers move to the Studios only by
 * an owner's "Switch to Studio" button, or by staff in batches the platform owner
 * approves. Nothing is ever switched automatically. A switch writes a Studio
 * DRAFT; the classic header/footer data is never touched, and the site keeps
 * showing it until someone presses Publish.
 *
 * Pure: no React, no Supabase.
 */

/** How close a converted Studio draft is to the classic header/footer. */
export type SwitchLevel = "exact" | "minor" | "unsupported";

/**
 * One thing the Studio version does differently (or cannot do). `code` is
 * stable (UI strings: studioSwitch.note.<code>); `detail` is site data
 * (a block type, a label), never wording.
 */
export interface SwitchNote {
  level: "minor" | "unsupported";
  code: NoteCode;
  detail?: string;
}

export const NOTE_CODES = [
  // cannot convert
  "empty", "extraBlocks", "multipleHeaders", "multipleFooters", "noFooterBlock", "unknownShape",
  // header, minor
  "logoIcon", "logoCaption", "gradientBar", "glass", "menuFont", "ctaFont", "ctaTablet",
  "secondLink", "trackOrder", "searchOptions", "stickyMenuRow",
  "topBarMotion", "topBarCase", "topBarLanguages", "topBarSocialsLabel", "zoneFull",
  "containerBlock", "secondMenu", "phoneIcons", "headerBackground",
  // footer, minor
  "footerColumnsMerged", "footerLinksCut", "footerWordmark", "footerBooking",
  "footerGradient", "footerLogoPlate", "footerExperts",
  "footerBottomNote", "footerTapTargets", "footerNewsletter", "footerRetail",
] as const;
export type NoteCode = (typeof NOTE_CODES)[number];

/** English wording (scripts, MCP, staff report). The dashboard uses the i18n keys. */
export const NOTE_TEXT: Record<NoteCode, string> = {
  empty: "The site has no site-wide header/footer (pages carry their own), so there is nothing to convert.",
  extraBlocks: "The header/footer holds page sections the Studio cannot show",
  multipleHeaders: "The header holds more than one header bar",
  multipleFooters: "The footer holds more than one footer block",
  noFooterBlock: "The footer has no classic footer block",
  unknownShape: "This header shape cannot be mapped to the Studio yet",
  logoIcon: "The small icon before a text logo is not shown",
  logoCaption: "The caption beside the logo is not shown",
  gradientBar: "The bar's gradient becomes its first colour",
  glass: "The frosted-glass bar becomes a solid bar",
  menuFont: "Menu font size, weight or spacing use the Studio default",
  ctaFont: "The button's own font size uses the Studio default",
  ctaTablet: "\"Hide the button on tablets\" is not available",
  secondLink: "The second link becomes a plain button",
  trackOrder: "The order tracking icon is not shown",
  searchOptions: "Search scope and category filter use the Studio default",
  stickyMenuRow: "\"Only the menu row stays pinned\" becomes the whole header pinned",
  topBarMotion: "Rotating or scrolling top bar items are shown side by side",
  topBarCase: "Top bar capitals are not kept",
  topBarLanguages: "The top bar's Google Translate language menu becomes a language button",
  topBarSocialsLabel: "The label before the social icons becomes plain text",
  zoneFull: "Some items did not fit (6 per zone)",
  containerBlock: "A block in the header row has no Studio element",
  secondMenu: "A second, different menu in the header is not converted",
  phoneIcons: "Phone bar icons follow the Studio (up to 3)",
  headerBackground: "The header row's background image or gradient is not kept",
  footerColumnsMerged: "More than 5 columns: the last ones share a column",
  footerLinksCut: "A column with more than 12 links becomes a saved menu",
  footerWordmark: "The large brand name across the bottom is not shown",
  footerBooking: "The booking strip becomes a text link",
  footerGradient: "The footer's theme gradient becomes a flat colour",
  footerLogoPlate: "The white plate behind the logo is not shown",
  footerExperts: "The Experts badge is not shown",
  footerBottomNote: "The short note in the bottom row becomes text",
  footerTapTargets: "Large tap targets on phones use the Studio default",
  footerNewsletter: "The newsletter strip becomes a newsletter box in a column",
  footerRetail: "The Retail footer layout becomes ordinary columns",
};

export function noteText(n: SwitchNote): string {
  return n.detail ? `${NOTE_TEXT[n.code]} (${n.detail})` : NOTE_TEXT[n.code];
}

/** Worst level of a list of notes: no notes = exact. */
export function levelOf(notes: SwitchNote[]): SwitchLevel {
  if (notes.some((n) => n.level === "unsupported")) return "unsupported";
  return notes.length ? "minor" : "exact";
}

/**
 * Kept on the Studio document (header_studio.switched / footer_studio
 * .switched) when a draft came from the classic one, so the editor can show
 * the before/after and the staff batch tool knows what it prepared.
 */
export interface SwitchOrigin {
  at: string;
  by: string | null;
  via: "owner" | "staff" | "mcp";
  level: SwitchLevel;
  notes: SwitchNote[];
  /** A saved menu the switch created ("Main menu"), if any. */
  createdMenus?: string[];
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const CODE_SET = new Set<string>(NOTE_CODES);

/** Stored JSON -> a SwitchOrigin, or null when there is none / it is garbage. */
export function normalizeOrigin(raw: unknown): SwitchOrigin | null {
  if (!isObj(raw) || typeof raw.at !== "string" || Number.isNaN(Date.parse(raw.at))) return null;
  const via = raw.via === "staff" || raw.via === "mcp" ? raw.via : "owner";
  const level = raw.level === "exact" || raw.level === "unsupported" ? raw.level : "minor";
  const notes = (Array.isArray(raw.notes) ? raw.notes : []).filter(isObj)
    .filter((n) => typeof n.code === "string" && CODE_SET.has(n.code))
    .map((n) => ({
      level: n.level === "unsupported" ? "unsupported" as const : "minor" as const,
      code: n.code as NoteCode,
      ...(typeof n.detail === "string" && n.detail ? { detail: n.detail.slice(0, 200) } : {}),
    }))
    .slice(0, 40);
  const out: SwitchOrigin = { at: raw.at, by: typeof raw.by === "string" ? raw.by : null, via, level, notes };
  const menus = (Array.isArray(raw.createdMenus) ? raw.createdMenus : []).filter((x): x is string => typeof x === "string").slice(0, 10);
  if (menus.length) out.createdMenus = menus;
  return out;
}
