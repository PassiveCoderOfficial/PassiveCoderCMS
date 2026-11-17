import type { TranslationKey } from "@/lib/i18n/locales/en";

/**
 * The Show Me guides. A step opens `route` if the visitor isn't there, then
 * spotlights `target`; with no target, or if it isn't on screen (a closed mobile
 * menu), the card still explains the step. `requires` hides a guide on sites
 * whose plan or modules don't include the feature: no menu link, no guide.
 */
export interface GuideStep { route?: string; target?: string; title: TranslationKey; body: TranslationKey }
export interface Guide { id: string; title: TranslationKey; requires?: string; steps: GuideStep[] }

const link = (href: string) => `a[href="${href}"]`;

export const GUIDES: Guide[] = [
  {
    id: "read-leads",
    title: "guide.leads.title",
    steps: [
      { target: link("/dashboard/contact"), title: "guide.leads.s1", body: "guide.leads.b1" },
      { route: "/dashboard/contact", target: '[data-guide="contact-tab-inbox"]', title: "guide.leads.s2", body: "guide.leads.b2" },
      { route: "/dashboard/chat", target: link("/dashboard/chat"), title: "guide.leads.s3", body: "guide.leads.b3" },
    ],
  },
  {
    id: "edit-page",
    title: "guide.page.title",
    steps: [
      { target: link("/dashboard/pages"), title: "guide.page.s1", body: "guide.page.b1" },
      { route: "/dashboard/pages", target: '[data-guide="pages-list"]', title: "guide.page.s2", body: "guide.page.b2" },
      { title: "guide.page.s3", body: "guide.page.b3" },
    ],
  },
  {
    id: "contact-info",
    title: "guide.info.title",
    steps: [
      { target: link("/dashboard/contact"), title: "guide.info.s1", body: "guide.info.b1" },
      { route: "/dashboard/contact", target: '[data-guide="contact-tab-details"]', title: "guide.info.s2", body: "guide.info.b2" },
      { route: "/dashboard/business-profile", target: link("/dashboard/business-profile"), title: "guide.info.s3", body: "guide.info.b3" },
    ],
  },
  {
    id: "add-product",
    title: "guide.product.title",
    requires: link("/dashboard/ecommerce/products"),
    steps: [
      { target: link("/dashboard/ecommerce/products"), title: "guide.product.s1", body: "guide.product.b1" },
      { route: "/dashboard/ecommerce/products", target: `main ${link("/dashboard/ecommerce/products/new")}`, title: "guide.product.s2", body: "guide.product.b2" },
      { title: "guide.product.s3", body: "guide.product.b3" },
    ],
  },
  {
    id: "add-service",
    title: "guide.service.title",
    requires: link("/dashboard/services"),
    steps: [
      { target: link("/dashboard/services"), title: "guide.service.s1", body: "guide.service.b1" },
      { route: "/dashboard/services", target: '[data-guide="services-new-group"]', title: "guide.service.s2", body: "guide.service.b2" },
    ],
  },
  {
    id: "ban-spammer",
    title: "guide.ban.title",
    steps: [
      { title: "guide.ban.s1", body: "guide.ban.b1" },
      { target: link("/dashboard/spam"), title: "guide.ban.s2", body: "guide.ban.b2" },
      { route: "/dashboard/spam", target: '[data-guide="spam-tabs"]', title: "guide.ban.s3", body: "guide.ban.b3" },
    ],
  },
];

/** First match that is actually visible, since the mobile menu keeps hidden links in the page. */
export function findTarget(selector?: string): HTMLElement | null {
  if (!selector) return null;
  for (const el of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.right > 0 && r.left < window.innerWidth) return el;
  }
  return null;
}
