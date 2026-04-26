export const CMS_MODE = (process.env.NEXT_PUBLIC_CMS_MODE ?? "standalone") as "saas" | "standalone";
export const isSaaS       = CMS_MODE === "saas";
export const isStandalone = CMS_MODE === "standalone";

export const flags = {
  multiTenant: isSaaS,
  billing:     isSaaS && process.env.NEXT_PUBLIC_ENABLE_BILLING === "true",
  domains:     isSaaS && process.env.NEXT_PUBLIC_ENABLE_DOMAINS === "true",
  backups:     true,
  onboarding:  isSaaS,
} as const;

export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
export const APP_URL     = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
