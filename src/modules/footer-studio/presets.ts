/**
 * Footer Studio presets: ten ready footers. Picking one gives a complete
 * config the owner then tweaks. Presets adapt to what the site has (facts):
 * no opening hours on file means no hours widget, no address means no map,
 * a shop gets payment badges, no legal pages means no legal links. Contact
 * values, hours and socials are not copied in; widgets show the site's live
 * details (see model.ts).
 */
import {
  defaultFooterConfig, makeColumn, makeLink, makeWidget, normalizeFooterConfig,
  type FooterColumn, type FooterConfig, type FooterLink, type FooterWidget, type FooterWidgetType,
} from "./model";

/** What the site already has, from contact details, business profile, pages and modules. */
export interface FooterFacts {
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  socials?: number;
  /** Business Profile opening hours on file. */
  hours?: boolean;
  /** A map can show (saved map or an address). */
  map?: boolean;
  shop?: boolean;
  booking?: boolean;
  /** Published legal pages ({label, url}), for the bottom bar. */
  legal?: { label: string; url: string }[];
}

export interface FooterPreset {
  id: string;
  /** i18n key suffix: footerStudio.preset.<id> / .<id>Desc */
  build: (f: FooterFacts) => FooterConfig;
}

const w = (type: FooterWidgetType, extra: Partial<FooterWidget> = {}) => makeWidget(type, extra);

function has(f: FooterFacts, type: FooterWidgetType): boolean {
  switch (type) {
    case "contact": return !!(f.phone || f.whatsapp || f.email || f.address);
    case "hours": return !!f.hours;
    case "map": return !!f.map;
    case "socials": return (f.socials ?? 0) > 0;
    case "payments": return !!f.shop;
    default: return true;
  }
}

const pick = (f: FooterFacts, list: FooterWidget[]) => list.filter((x) => has(f, x.type));
/** A column, dropped later when the facts leave it empty. */
const col = (f: FooterFacts, widgets: FooterWidget[], extra: Partial<Omit<FooterColumn, "widgets">> = {}) => makeColumn(pick(f, widgets), extra);

function legalLinks(f: FooterFacts): FooterLink[] {
  return (f.legal ?? []).slice(0, 4).map((l) => makeLink(l.label, l.url));
}

/** Bottom-bar legal links, only when the site has legal pages. */
const legal = (f: FooterFacts, extra: Partial<FooterWidget> = {}) => (f.legal?.length ? [w("links", { links: legalLinks(f), layout: "inline", ...extra })] : []);

function base(id: string, patch: (c: FooterConfig) => void): FooterConfig {
  const c = defaultFooterConfig();
  c.preset = id;
  patch(c);
  c.columns = c.columns.filter((x) => x.widgets.length > 0);
  return normalizeFooterConfig(c);
}

const SHOP_HELP = () => [makeLink("My account", "/account"), makeLink("Cart", "/cart"), makeLink("Shop", "/shop"), makeLink("Contact us", "/contact")];

export const FOOTER_PRESETS: FooterPreset[] = [
  {
    id: "simple",
    build: (f) => base("simple", (c) => {
      c.style = { ...c.style, background: "muted", size: "sm" };
      c.bottom.border = false;
      c.bottom.zones.left = [w("copyright")];
      c.bottom.zones.center = [w("menu", { layout: "inline" })];
      c.bottom.zones.right = pick(f, [w("socials")]);
    }),
  },
  {
    id: "corporate",
    build: (f) => base("corporate", (c) => {
      c.columns = [
        col(f, [w("about", { text: "Trusted by customers for quality work and honest service." })], { span: 2 }),
        col(f, [w("menu")], { title: "Quick links" }),
        col(f, [w("contact")], { title: "Contact us" }),
        col(f, [w("hours")], { title: "Opening hours" }),
      ];
      c.bottom.zones.left = [w("copyright")];
      c.bottom.zones.right = [...legal(f), ...pick(f, [w("socials")])].slice(0, 2);
    }),
  },
  {
    id: "centered",
    build: (f) => base("centered", (c) => {
      c.style = { ...c.style, background: "default", align: "center", topBorder: true, size: "lg" };
      c.mobile.center = true;
      c.columns = [col(f, [w("about", { height: 44 }), w("menu", { layout: "inline" }), w("socials")])];
      c.bottom.zones.center = [w("copyright")];
    }),
  },
  {
    id: "newsletter",
    build: (f) => base("newsletter", (c) => {
      c.style = { ...c.style, size: "lg" };
      c.columns = [
        col(f, [w("about", { height: 52, text: "News, offers and tips from our team, straight to your inbox." }), w("socials")], { span: 2 }),
        col(f, [w("menu")], { title: "Explore" }),
        col(f, [w("newsletter", { title: "Stay in the loop" })], { span: 2 }),
      ];
      c.bottom.zones.left = [w("copyright")];
      c.bottom.zones.right = [...legal(f), w("backToTop")];
    }),
  },
  {
    id: "contact",
    build: (f) => base("contact", (c) => {
      c.style = { ...c.style, background: "dark", uppercase: true };
      c.columns = [
        col(f, [w("about"), w("contact")], { span: 2 }),
        col(f, [w("hours")], { title: "Opening hours" }),
        col(f, [w("menu")], { title: "Pages" }),
        col(f, [w("socials", { title: "Follow us" }), ...(f.booking ? [w("links", { links: [makeLink("Book now", "/book")] })] : [])], { title: "Connect" }),
      ];
      c.bottom.zones.left = [w("copyright")];
      c.bottom.zones.right = [w("backToTop")];
    }),
  },
  {
    id: "map",
    build: (f) => base("map", (c) => {
      c.columns = [
        col(f, [w("about"), w("socials")]),
        col(f, [w("contact"), w("hours", { title: "Opening hours" })], { title: "Visit us" }),
        col(f, [w("map", { mapHeight: 200 })], { span: 2, title: "Find us" }),
      ];
      c.bottom.zones.left = [w("copyright")];
      c.bottom.zones.right = legal(f);
    }),
  },
  {
    id: "shop",
    build: (f) => base("shop", (c) => {
      c.style = { ...c.style, background: "muted" };
      c.columns = [
        col(f, [w("about", { text: "Quality products, delivered to your door." }), w("socials")], { span: 2 }),
        col(f, [w("menu")], { title: "Shop" }),
        col(f, [w("links", { links: SHOP_HELP() })], { title: "Help" }),
        col(f, [w("newsletter", { text: "Get new arrivals and offers first." })], { title: "Newsletter" }),
      ];
      c.bottom.zones.left = [w("copyright")];
      c.bottom.zones.right = f.shop ? [w("payments", { methods: ["visa", "mastercard", "paypal", "cod"] })] : legal(f);
    }),
  },
  {
    id: "directory",
    build: (f) => base("directory", (c) => {
      c.style = { ...c.style, uppercase: true };
      c.columns = [
        col(f, [w("about")]),
        col(f, [w("menu")], { title: "Company" }),
        col(f, [w("links", { links: [makeLink("Contact us", "/contact"), ...legalLinks(f)] })], { title: "Help" }),
        col(f, [w("contact")], { title: "Contact" }),
        col(f, [w("socials"), w("hours")], { title: "Follow us" }),
      ];
      c.bottom.zones.left = [w("copyright")];
      c.bottom.zones.right = [w("backToTop")];
    }),
  },
  {
    id: "light",
    build: (f) => base("light", (c) => {
      c.style = { ...c.style, background: "default", topBorder: true };
      c.columns = [
        col(f, [w("about", { text: "We are here to help. Get in touch any time." })]),
        col(f, [w("menu")], { title: "Menu" }),
        col(f, [w("contact")], { title: "Get in touch" }),
      ];
      c.bottom.zones.center = [w("copyright")];
      c.bottom.zones.right = [w("backToTop")];
    }),
  },
  {
    id: "brand",
    build: (f) => base("brand", (c) => {
      c.style = { ...c.style, background: "primary", align: "center", size: "lg" };
      c.mobile.center = true;
      c.columns = [col(f, [w("about", { height: 56 }), w("contact", { fields: ["phone", "email"] }), w("socials")])];
      c.bottom.zones.left = [w("copyright")];
      c.bottom.zones.center = [w("menu", { layout: "inline" })];
      c.bottom.zones.right = [w("backToTop")];
    }),
  },
];

export const PRESET_IDS = FOOTER_PRESETS.map((p) => p.id);

export function buildFooterPreset(id: string, facts: FooterFacts): FooterConfig | null {
  return FOOTER_PRESETS.find((p) => p.id === id)?.build(facts) ?? null;
}
