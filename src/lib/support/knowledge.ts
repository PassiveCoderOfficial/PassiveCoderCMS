import { GUIDES } from "@/components/guide/guides";
import { en, type TranslationKey } from "@/lib/i18n/locales/en";
import { CREDIT_COSTS, TOPUP_CREDITS } from "@/lib/ai/credit-costs";

/**
 * What our support AI knows, in one place: the ticket worker (support-ai/worker.ts)
 * and the dashboard chat (support/chat.ts) both read it.
 */

export const AI_AUTHOR = "Passive Coder AI";

/** What the support AI may change, and what always goes to a person. */
export const SUPPORT_AI_CAN_CHANGE = "You may ONLY change website content: text, images and section fields on existing pages, blog posts, header and footer. Your edits are drafts; the client previews and approves them.";
export const SUPPORT_AI_NEVER = "NEVER handle: domains, DNS, email accounts, billing, payments, plans, deleting anything, site settings, users/logins, or bugs/errors in the platform.";

/** The Show Me guides written out: the same steps the dashboard walks people through. */
function guideLines(): string {
  const say = (k: TranslationKey) => en[k];
  return GUIDES.map((g) => `${say(g.title)}: ${g.steps.map((s) => `${s.route ? `(${s.route}) ` : ""}${say(s.title)}. ${say(s.body)}`).join(" ")}`).join("\n");
}

const DASHBOARD_MAP = [
  "Dashboard home: /dashboard/analytics (traffic, recent orders).",
  "Website: Pages /dashboard/pages, Posts /dashboard/posts, Media /dashboard/media.",
  "Design: Templates /dashboard/themes, Colors /dashboard/templates/colors, Header and Footer /dashboard/header-builder, Menu /dashboard/navigation, Site identity /dashboard/templates/header-footer.",
  "Customers: Contact and leads /dashboard/contact, Website chat /dashboard/chat, Bookings /dashboard/bookings, CRM /dashboard/crm, Invoices /dashboard/invoices.",
  "Shop (plans with a shop): Products /dashboard/ecommerce/products, Orders /dashboard/ecommerce/orders.",
  "Account: Business profile /dashboard/business-profile, Plan and payments /dashboard/subscription, Tickets /dashboard/support.",
  "The sparkle button (bottom right) opens the AI assistant, which can edit pages, text and images after the owner confirms. The camera button reports a problem with a screenshot.",
];

const costs = () => [
  `AI Credits are one balance per site. A dashboard assistant message costs ${CREDIT_COSTS.assistant}, a website chat conversation ${CREDIT_COSTS.website_chat}, this support chat ${CREDIT_COSTS.support_chat} per conversation, an AiCoder section ${CREDIT_COSTS.section}, an AI project plan ${CREDIT_COSTS.project_plan}, a translation ${CREDIT_COSTS.translate}.`,
  `Top-up packs add ${TOPUP_CREDITS.join(", ")} credits at /dashboard/subscription; purchased credits never expire.`,
].join(" ");

/** The product knowledge in the dashboard chat's prompt. */
export function supportKnowledge(): string {
  return [
    "How the dashboard is laid out:", ...DASHBOARD_MAP, "",
    "Step-by-step guides:", guideLines(), "",
    costs(),
  ].join("\n");
}
