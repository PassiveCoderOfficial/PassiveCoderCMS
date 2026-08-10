/**
 * Turns a template's nav items into links that actually go somewhere.
 *
 * The 69 registry templates were authored as one-page designs, so their
 * navItems are hardcoded fragments — "#services", "#about", "#contact" (336 of
 * them). But applying a template now generates real pages (/about, /services,
 * /gallery, /pricing, /reviews, /faq, /contact), so those fragments point at
 * sections that don't exist on whatever page the visitor is currently on.
 * Clicking "Services" from /about does nothing at all.
 *
 * This maps a fragment onto the real page the apply just created, when one
 * exists. Fragments with no matching page are left alone — a genuine
 * same-page anchor on a single-page site is still valid.
 */
import type { NavItem } from "@/types/cms";

/** Fragment names that don't match their page slug one-to-one. */
const FRAGMENT_ALIASES: Record<string, string> = {
  testimonials: "reviews",
  team: "about",
  work: "gallery",
  portfolio: "gallery",
  projects: "gallery",
  process: "services",
  packages: "pricing",
  plans: "pricing",
  menu: "services",
  rooms: "services",
  fleet: "services",
  book: "contact",
  booking: "contact",
  quote: "contact",
  enquiry: "contact",
  "get-quote": "contact",
};

/**
 * @param availableSlugs page slugs that exist for this site/template, e.g.
 *   ["home", "about", "services", "contact"]. Anything not in here is left as
 *   an anchor rather than becoming a link to a 404.
 */
export function resolveNavUrl(url: string, availableSlugs: string[]): string {
  if (!url.startsWith("#")) return url;

  const fragment = url.slice(1).toLowerCase().trim();
  if (!fragment) return url;

  const slugs = new Set(availableSlugs.map((s) => s.toLowerCase()));

  // "home" is the site root, not /home.
  const direct = slugs.has(fragment) ? fragment : FRAGMENT_ALIASES[fragment];
  if (!direct || !slugs.has(direct)) return url;

  return direct === "home" ? "/" : `/${direct}`;
}

/** Applies resolveNavUrl across a menu tree, including sub-menu children. */
export function resolveNavItems(items: NavItem[], availableSlugs: string[]): NavItem[] {
  return items.map((item) => ({
    ...item,
    url: resolveNavUrl(item.url, availableSlugs),
    children: item.children?.length ? resolveNavItems(item.children, availableSlugs) : item.children,
  }));
}

/**
 * Builds a header menu from the pages that actually exist, for cases where a
 * template has no usable navItems at all. Ordered by how sites conventionally
 * present them rather than alphabetically or by creation order.
 */
const PREFERRED_ORDER = ["home", "about", "services", "gallery", "pricing", "reviews", "faq", "contact"];

export function buildNavFromPages(
  pages: { slug: string; title: string }[],
  makeId: () => string,
): NavItem[] {
  const ordered = [...pages].sort((a, b) => {
    const ai = PREFERRED_ORDER.indexOf(a.slug.toLowerCase());
    const bi = PREFERRED_ORDER.indexOf(b.slug.toLowerCase());
    // Unlisted pages keep their relative order, after the known ones.
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return ordered.map((p) => ({
    id: makeId(),
    label: p.title,
    url: p.slug.toLowerCase() === "home" ? "/" : `/${p.slug}`,
    children: [],
  }));
}
