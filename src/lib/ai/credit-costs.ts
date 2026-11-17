/**
 * The one table of what AI costs, and what each plan includes. Whole numbers
 * only; 1 old generation = 10 credits. No server imports: client components
 * quote these numbers too. Spending lives in lib/ai/credits.ts.
 */
export const CREDIT_COSTS = {
  /** AiCoder writes one section (also regenerate, generate-block, the assistant's generate tool). */
  section: 10,
  /** AI project plan (Project Management). */
  project_plan: 10,
  /** One message to the dashboard assistant. */
  assistant: 2,
  /** One website chat conversation, charged when the AI first answers. */
  website_chat: 1,
  /** One dashboard support conversation (ticket), charged when the AI first works on it. */
  support_chat: 1,
  /** One page or product translated, or up to 20 collection entries. */
  translate: 10,
  /** One "write SEO for every page" run (the first on each site is free). */
  seo: 10,
  /** One "write my About text" in the business profile. */
  business_about: 10,
} as const;

export type CreditUse = keyof typeof CREDIT_COSTS;

export const CREDITS_PER_GENERATION = 10;

/** Monthly allowance per plan. The plans table holds the live value (modules.ai_coder.monthly_credits). */
export const PLAN_MONTHLY_CREDITS: Record<string, number> = { basic: 250, pro: 1500, biz: 10500, custom: 2500 };

/**
 * Plan states with no plans row: today's 0 generations plus their chat
 * allowance (50, agency 500), so no site ends up with less than it had.
 */
export const PLANLESS_MONTHLY_CREDITS: Record<string, number> = { free: 50, trial: 50, agency: 500 };
export const DEFAULT_MONTHLY_CREDITS = 50;

/** Backstop against a script or retry loop draining a month in an afternoon. */
export const ASSISTANT_MESSAGES_PER_DAY = 200;

/** Top-up packs, as sold. The ai_generation_packages table is what checkout reads. */
export const TOPUP_CREDITS = [500, 2000, 10000] as const;

/** Sections on the usage breakdown. */
export type CreditGroup = "section" | "chat" | "assistant" | "other";
export const CREDIT_GROUP: Record<CreditUse, CreditGroup> = {
  section: "section",
  website_chat: "chat",
  support_chat: "chat",
  assistant: "assistant",
  project_plan: "other",
  translate: "other",
  seo: "other",
  business_about: "other",
};

/** What the owner sees: the shape of GET /api/aicoder/quota. */
export interface CreditStatus {
  unlimited: boolean;
  /** Credits left right now: monthly left + purchased + free build grant. */
  left: number;
  /** "X of Y left this month": this month's allowance + top-ups + free grant. */
  total: number;
  monthlyIncluded: number;
  usedThisMonth: number;
  purchasedRemaining: number;
  /** One-time signup build grant, in credits. */
  freeBuildCredits: number;
  resetAt: string;
  breakdown: Record<CreditGroup, number>;
}
