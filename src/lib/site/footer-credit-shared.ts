/**
 * "Powered by Passive Coder" footer credit. Pure helpers (client + server).
 *
 * Basic / trial / free / unknown plans always show the default credit; Pro,
 * Biz, Custom (and active white-label partner sites) may hide it or change its
 * text and link. The choice is stored on the footer block (data.credit), but
 * only honoured when the server says the site's plan allows it — so a
 * downgrade brings the default back automatically.
 */
export type FooterCredit = { show?: boolean; text?: string; url?: string };

export const DEFAULT_CREDIT_TEXT = "Powered by Passive Coder";
export const DEFAULT_CREDIT_URL = "https://passivecoder.com";
export const CREDIT_TEXT_MAX = 80;

/** Plans whose owners may hide or change the credit. Everything else = locked. */
export const CREDIT_EDITABLE_PLANS = new Set(["pro", "biz", "custom", "enterprise"]);

export function planCanEditCredit(plan: string | null | undefined): boolean {
  return !!plan && CREDIT_EDITABLE_PLANS.has(plan.toLowerCase());
}

/** Plain text, single line, max 80 chars. */
export function sanitizeCreditText(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.replace(/<[^>]*>/g, "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, CREDIT_TEXT_MAX);
}

/** http(s) URL only, else "". */
export function sanitizeCreditUrl(v: unknown): string {
  if (typeof v !== "string" || !v.trim()) return "";
  try {
    const u = new URL(v.trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : "";
  } catch {
    return "";
  }
}

export type ResolvedCredit = { show: boolean; text: string; url: string; isDefault: boolean };

/** Partner (white-label reseller) default for all its sites. partners.footer_credit. */
export type PartnerCreditRule = FooterCredit & { allowClients?: boolean };

/** The credit a site shows when the owner has not (or may not) change it. */
export type CreditBase = { show: boolean; text: string; url: string };
export const PC_CREDIT_BASE: CreditBase = { show: true, text: DEFAULT_CREDIT_TEXT, url: DEFAULT_CREDIT_URL };

export function partnerBase(rule: PartnerCreditRule | null | undefined): CreditBase {
  if (!rule) return PC_CREDIT_BASE;
  return {
    show: rule.show !== false,
    text: sanitizeCreditText(rule.text) || DEFAULT_CREDIT_TEXT,
    url: sanitizeCreditUrl(rule.url) || DEFAULT_CREDIT_URL,
  };
}

const mk = (show: boolean, text: string, url: string): ResolvedCredit =>
  ({ show, text, url, isDefault: text === DEFAULT_CREDIT_TEXT && url === DEFAULT_CREDIT_URL });

/**
 * What the footer actually renders. `base` is Passive Coder's credit, or the
 * reseller's default on an active white-label partner site. A locked site
 * (Basic plan, or partner disallows changes) always gets the base.
 */
export function resolveCredit(saved: FooterCredit | null | undefined, editable: boolean, base: CreditBase = PC_CREDIT_BASE): ResolvedCredit {
  if (!editable || !saved) return mk(base.show, base.text, base.url);
  if (saved.show === false) return mk(false, base.text, base.url);
  return mk(true, sanitizeCreditText(saved.text) || base.text, sanitizeCreditUrl(saved.url) || base.url);
}
