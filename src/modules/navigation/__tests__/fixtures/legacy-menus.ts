/**
 * Menus in every shape saved before the Menu Studio (Nov 2026): plain links,
 * new-tab and language links, highlight pills, dropdowns, inferred and
 * explicit mega menus (strip / highlighted column, column counts), a plain
 * dropdown hiding a third level, icons on mega group headings, and items
 * already expanded from a legacy auto source. None use a studio field.
 */
import type { NavItem } from "@/types/cms";

export const LEGACY_MENUS: Record<string, NavItem[]> = {
  plainLinks: [
    { id: "home", label: "Home", url: "/" },
    { id: "about", label: "About us", url: "/about" },
    { id: "ext", label: "Portal", url: "https://example.com", target: "_blank" },
    { id: "anchor", label: "Contact", url: "#contact" },
    { id: "bn", label: "বাংলা", url: "/bn", lang: "bn" },
    { id: "pill", label: "Gold brand", url: "/gold", highlight: "gold" },
    { id: "iconTop", label: "Has icon", url: "/icon", icon: "Star" },
  ],
  dropdown: [
    {
      id: "services", label: "Services", url: "/services", children: [
        { id: "s1", label: "Painting", url: "/painting" },
        { id: "s2", label: "Plumbing", url: "/plumbing", target: "_blank" },
      ],
    },
    {
      id: "pure", label: "More", url: "#", highlight: "brand", children: [
        { id: "p1", label: "FAQ", url: "/faq" },
      ],
    },
  ],
  inferredMega: [
    {
      id: "shop", label: "Shop", url: "#", children: [
        { id: "g1", label: "Men", url: "/men", icon: "User", children: [
          { id: "g1a", label: "Shirts", url: "/men/shirts" },
          { id: "g1b", label: "Shoes", url: "/men/shoes", target: "_blank" },
        ] },
        { id: "g2", label: "Women", url: "/women", children: [{ id: "g2a", label: "Dresses", url: "/women/dresses" }] },
        { id: "single", label: "Sale", url: "/sale" },
      ],
    },
  ],
  explicitMegaColumn: [
    {
      id: "solutions", label: "Solutions", url: "/solutions", megaMenu: true, megaColumns: 3, megaLinksAs: "column", megaLinksTitle: "More to explore",
      children: [
        { id: "c1", label: "Homes", url: "/homes", children: [{ id: "c1a", label: "Kitchens", url: "/kitchens" }] },
        { id: "c2", label: "Offices", url: "/offices", children: [{ id: "c2a", label: "Fit-out", url: "/fit-out" }] },
        { id: "c3", label: "Pricing", url: "/pricing" },
        { id: "c4", label: "Contact", url: "/contact", target: "_blank" },
      ],
    },
    {
      id: "flatMega", label: "Catalogue", url: "/catalogue", megaMenu: true, megaColumns: 2,
      children: [{ id: "f1", label: "A", url: "/a" }, { id: "f2", label: "B", url: "/b" }],
    },
  ],
  hiddenThirdLevel: [
    {
      id: "plain", label: "Company", url: "/company", megaMenu: false, children: [
        { id: "h1", label: "Team", url: "/team", children: [{ id: "h1a", label: "Hidden", url: "/hidden" }] },
        { id: "h2", label: "Careers", url: "/careers" },
      ],
    },
  ],
  legacyAutoSource: [
    {
      id: "auto", label: "Our services", url: "/services", childSource: "services", childLimit: 6, children: [
        { id: "nav-abc", label: "Roofing", url: "/services#1" },
      ],
    },
    { id: "blog", label: "Blog", url: "/blog", childSource: "blog_categories", children: [] },
  ],
};
