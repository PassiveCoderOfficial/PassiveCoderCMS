/**
 * Header Studio presets: twelve ready headers. Picking one gives a complete
 * config the owner then tweaks. Presets adapt to what the site has (facts):
 * no phone on file means no phone element, a shop gets a cart, a booking
 * site gets the booking button. Contact values are not copied in; elements
 * show the site's live contact details (see model.ts).
 */
import {
  defaultConfig, emptyRow, makeElement, normalizeHeaderConfig,
  type HeaderConfig, type HeaderElement, type HeaderElementType, type MobileBarType,
} from "./model";

/** What the site already has, from Site Identity, contact details and modules. */
export interface SiteFacts {
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  socials?: number;
  /** Online shop (cart makes sense). */
  shop?: boolean;
  /** Booking module in use. */
  booking?: boolean;
}

export interface HeaderPreset {
  id: string;
  /** i18n key suffix: headerStudio.preset.<id> / .<id>Desc */
  build: (f: SiteFacts) => HeaderConfig;
}

const el = (type: HeaderElementType, extra: Partial<HeaderElement> = {}) => makeElement(type, extra);

/** Drops elements the site has nothing for (no phone on file -> no phone element). */
function has(f: SiteFacts, type: HeaderElementType): boolean {
  switch (type) {
    case "phone": return !!f.phone;
    case "whatsapp": return !!(f.whatsapp || f.phone);
    case "email": return !!f.email;
    case "socials": return (f.socials ?? 0) > 0;
    case "cart": return !!f.shop;
    case "booking": return !!f.booking;
    default: return true;
  }
}

const pick = (f: SiteFacts, list: HeaderElement[]) => list.filter((e) => has(f, e.type));

/** The site's main action: booking when it takes bookings, else a contact button. */
function mainAction(f: SiteFacts, variant: HeaderElement["variant"] = "solid"): HeaderElement {
  return f.booking ? el("booking", { variant }) : el("button", { label: "Contact us", url: "/contact", variant });
}

function phoneIcons(f: SiteFacts, extra: MobileBarType[] = []): MobileBarType[] {
  const order: MobileBarType[] = [...extra, ...(f.shop ? ["cart" as const] : []), ...(f.phone ? ["phone" as const] : []), ...(f.whatsapp || f.phone ? ["whatsapp" as const] : [])];
  return [...new Set(order)].slice(0, 2);
}

function base(id: string, patch: (c: HeaderConfig) => void): HeaderConfig {
  const c = defaultConfig();
  c.preset = id;
  patch(c);
  return normalizeHeaderConfig(c);
}

export const HEADER_PRESETS: HeaderPreset[] = [
  {
    id: "classic",
    build: (f) => base("classic", (c) => {
      c.rows.main.zones.left = [el("logo")];
      c.rows.main.zones.right = pick(f, [el("menu"), el("cart"), mainAction(f)]);
      c.mobile.icons = phoneIcons(f);
    }),
  },
  {
    id: "centered",
    build: (f) => base("centered", (c) => {
      c.rows.main.size = "lg";
      c.rows.main.zones.left = pick(f, [el("socials")]);
      c.rows.main.zones.center = [el("logo", { height: 48 })];
      c.rows.main.zones.right = pick(f, [el("cart"), mainAction(f, "outline")]);
      c.rows.menu = { ...emptyRow(true), border: true };
      c.rows.menu.zones.center = [el("menu")];
      c.rows.main.border = true;
      c.mobile.layout = "logo-center";
      c.mobile.icons = phoneIcons(f);
    }),
  },
  {
    id: "split",
    build: (f) => base("split", (c) => {
      c.rows.main.size = "lg";
      c.rows.main.zones.left = [el("menu", { menuPart: "first" })];
      c.rows.main.zones.center = [el("logo", { height: 44 })];
      c.rows.main.zones.right = pick(f, [el("menu", { menuPart: "second" }), el("cart")]);
      c.mobile.layout = "logo-center";
      c.mobile.icons = phoneIcons(f);
    }),
  },
  {
    id: "topbar",
    build: (f) => base("topbar", (c) => {
      c.rows.top = { ...emptyRow(true, "dark"), size: "sm" };
      c.rows.top.zones.left = pick(f, [el("phone", { showLabel: true }), el("email", { showLabel: true })]);
      c.rows.top.zones.right = pick(f, [el("socials")]);
      c.rows.main.zones.left = [el("logo")];
      c.rows.main.zones.right = pick(f, [el("menu"), el("cart"), mainAction(f)]);
      c.style.shadow = true;
      c.mobile.icons = phoneIcons(f);
    }),
  },
  {
    id: "transparent",
    build: (f) => base("transparent", (c) => {
      c.rows.main.size = "lg";
      c.rows.main.zones.left = [el("logo")];
      c.rows.main.zones.center = [el("menu")];
      c.rows.main.zones.right = pick(f, [el("cart"), mainAction(f, "outline")]);
      c.behaviour.transparent = "home";
      c.mobile.icons = phoneIcons(f);
    }),
  },
  {
    id: "floating",
    build: (f) => base("floating", (c) => {
      c.style.container = "floating";
      c.style.shadow = true;
      c.rows.main.zones.left = [el("logo")];
      c.rows.main.zones.center = [el("menu")];
      c.rows.main.zones.right = pick(f, [el("cart"), mainAction(f, "gradient")]);
      c.mobile.icons = phoneIcons(f);
    }),
  },
  {
    id: "minimal",
    build: (f) => base("minimal", (c) => {
      c.rows.main.size = "sm";
      c.rows.main.zones.left = [el("logo", { height: 28 })];
      c.rows.main.zones.right = pick(f, [el("menu"), el("cart")]);
      c.mobile.drawer = "full";
      c.mobile.icons = phoneIcons(f).slice(0, 1);
    }),
  },
  {
    id: "two-row",
    build: (f) => base("two-row", (c) => {
      c.rows.main.size = "lg";
      c.rows.main.zones.left = [el("logo", { height: 44 })];
      c.rows.main.zones.right = pick(f, [el("phone", { showLabel: true }), el("whatsapp"), mainAction(f)]);
      c.rows.menu = emptyRow(true, "primary");
      c.rows.menu.zones.left = [el("menu")];
      c.rows.menu.zones.right = pick(f, [el("search"), el("cart")]);
      c.style.uppercase = true;
      c.mobile.icons = phoneIcons(f);
    }),
  },
  {
    id: "shop",
    build: () => base("shop", (c) => {
      c.rows.top = { ...emptyRow(true, "primary"), size: "sm" };
      c.rows.top.zones.center = [el("text", { label: "Free delivery on orders over 50" })];
      c.rows.main.zones.left = [el("logo")];
      c.rows.main.zones.center = [el("search", { searchStyle: "box" })];
      c.rows.main.zones.right = [el("account"), el("cart")];
      c.rows.menu = { ...emptyRow(true), border: true, size: "sm" };
      c.rows.menu.zones.center = [el("menu")];
      c.mobile.icons = ["search", "cart"];
    }),
  },
  {
    id: "corporate",
    build: (f) => base("corporate", (c) => {
      c.rows.top = { ...emptyRow(true, "muted"), size: "sm" };
      c.rows.top.zones.left = [el("text", { label: "Mon to Sat, 9am to 6pm" })];
      c.rows.top.zones.right = pick(f, [el("email", { showLabel: true }), el("divider"), el("phone", { showLabel: true })]);
      c.rows.main.zones.left = [el("logo")];
      c.rows.main.zones.right = pick(f, [el("menu"), mainAction(f)]);
      c.rows.main.border = true;
      c.mobile.icons = phoneIcons(f);
    }),
  },
  {
    id: "boxed",
    build: (f) => base("boxed", (c) => {
      c.style.container = "boxed";
      c.style.shadow = true;
      c.rows.main.zones.left = [el("logo")];
      c.rows.main.zones.center = [el("menu")];
      c.rows.main.zones.right = pick(f, [el("phone"), el("cart"), mainAction(f)]);
      c.mobile.drawer = "dropdown";
      c.mobile.icons = phoneIcons(f);
    }),
  },
  {
    id: "statement",
    build: (f) => base("statement", (c) => {
      c.rows.top = { ...emptyRow(true, "dark"), size: "sm" };
      c.rows.top.zones.center = [el("text", { label: "Free consultation this month", url: "/contact" })];
      c.rows.main.size = "lg";
      c.rows.main.zones.left = pick(f, [el("socials")]);
      c.rows.main.zones.center = [el("logo", { height: 52 })];
      c.rows.main.zones.right = pick(f, [el("search"), el("cart"), mainAction(f)]);
      c.rows.menu = { ...emptyRow(true), border: true };
      c.rows.menu.zones.center = [el("menu")];
      c.style.uppercase = true;
      c.mobile.layout = "logo-center";
      c.mobile.drawer = "full";
      c.mobile.icons = phoneIcons(f, ["search"]);
    }),
  },
];

export const PRESET_IDS = HEADER_PRESETS.map((p) => p.id);

export function buildPreset(id: string, facts: SiteFacts = {}): HeaderConfig | null {
  const p = HEADER_PRESETS.find((x) => x.id === id);
  return p ? p.build(facts) : null;
}
