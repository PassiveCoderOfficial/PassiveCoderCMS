export const CMS_MODE = (process.env.NEXT_PUBLIC_CMS_MODE ?? "standalone") as "saas" | "standalone";
export const isSaaS       = CMS_MODE === "saas";
export const isStandalone = CMS_MODE === "standalone";

export const flags = {
  multiTenant: isSaaS,
  billing:     isSaaS && process.env.NEXT_PUBLIC_ENABLE_BILLING === "true",
  domains:     isSaaS && process.env.NEXT_PUBLIC_ENABLE_DOMAINS === "true",
  backups:     true,
  onboarding:  isSaaS,
  /** Project Management release flag (docs/business/project-management-plan.md).
   *  Off: only the root workspace in the super admin and staff portals works;
   *  clients keep Jobs & Staff. On: Projects replaces it on pro, biz, agency and
   *  custom. Set NEXT_PUBLIC_ENABLE_PROJECTS=true in Vercel and redeploy (it is
   *  inlined at build time). */
  projects:    process.env.NEXT_PUBLIC_ENABLE_PROJECTS === "true",
} as const;

export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
export const APP_URL     = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Slug of the platform's own tenant (the root site). Its subdomain is the
 *  preview of the root site's builder pages (beta.passivecoder.com). Was
 *  derived from ROOT_DOMAIN ("passivecoder"); renamed to "beta" 2026-10-10. */
export const ROOT_TENANT_SLUG = process.env.ROOT_TENANT_SLUG ?? "beta";

