import type { AppRole, Currency, SiteRole } from "./common";
import type { PlanPriceV2 } from "./plans";

/** App branding. Passive Coder by default; a white-label partner's brand when
 *  the user's sites are resold by one with white-label switched on. */
export interface Branding {
  /** null = Passive Coder (the default brand). */
  partner_id: string | null;
  name: string;
  logo_url: string | null;
  /** Primary colour, #rrggbb. */
  color: string;
  support_email: string | null;
  support_whatsapp: string | null;
  /** Partner's own dashboard address, when connected. */
  dashboard_domain: string | null;
}

export interface BootstrapTenant {
  id: string;
  slug: string;
  name: string;
  owner_id: string | null;
  plan: string | null;
  status: string | null;
  custom_domain: string | null;
  domain_status: string | null;
  trial_ends_at: string | null;
  /** Default address, e.g. https://<slug>.passivecoder.com */
  default_url: string;
  /** Live address: the custom domain when active, else default_url. */
  live_url: string;
}

/** Billing state of one site, pricing v2. Amounts: USD in dollars, BDT in taka. */
export interface SiteBilling {
  plan_id: string | null;
  status: string | null;
  /** Currency this site is billed in (BDT only for Bangladesh sites). */
  currency: Currency;
  development_paid_at: string | null;
  platform_paid_until: string | null;
  care_plan_id: string | null;
  care_cycle: "monthly" | "yearly" | null;
  care_paid_until: string | null;
  /** Next yearly platform renewal price in `currency`, when the plan has one. */
  renewal_yearly: number | null;
  balance_due: number | null;
}

export interface BootstrapSite {
  tenant_id: string;
  role: SiteRole;
  is_primary: boolean;
  tenant: BootstrapTenant;
  /** Module key -> usable on this site (plan includes it and it is on). */
  modules: Record<string, boolean>;
  billing: SiteBilling | null;
  /** Partner brand for this site, null = Passive Coder. */
  brand: Branding | null;
}

export interface PricingSummary {
  model: "v2";
  packages: { id: string; name: string; pages_built: number; free_care_months: number; pricing: PlanPriceV2 }[];
  care: { id: string; name: string; monthly: Record<Currency, number>; yearly: Record<Currency, number> }[];
}

/** GET /api/mobile-admin/bootstrap (Bearer or cookie). */
export interface MobileBootstrap {
  user: { id: string; email: string | null; name: string | null };
  role: AppRole | null;
  is_super_admin: boolean;
  /** pc_staff manager (sees the cross-site list like the web SA panel). */
  is_manager: boolean;
  sites: BootstrapSite[];
  /** Brand for the app shell (the primary site's brand, else Passive Coder). */
  branding: Branding;
  pricing: PricingSummary;
  /** Builds older than this should show "please update". */
  min_app_version: string;
  /** Unread admin notifications; null until the inbox ships (M3). */
  unread_notifications: number | null;
  server_time: string;
}
