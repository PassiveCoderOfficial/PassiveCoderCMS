"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navSections } from "./nav-items";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, ShieldCheck, LogOut, Zap, MessageCircle, X, Store } from "lucide-react";
import type { ModuleKey } from "./nav-items";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { isSaaS } from "@/lib/flags";
import { Shell } from "@/components/admin-shell/sidebar";
import type { ShellNavItem, ShellNavSection } from "@/components/admin-shell/types";
import { publicUrl } from "@/lib/tenant/site-urls";
import { useT } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/locales/en";

// nav-items.ts stays static English (icons/hrefs/module gating live there,
// shared with resolveModuleKeyForPath and the SA plan editor). Labels are
// translated here at render time via this lookup instead of threading a
// translation key through NavItem — same string used in both nav-items.ts
// and the sidebar section labels below.
const LABEL_KEY: Record<string, TranslationKey> = {
  "Overview": "sidebar.sectionOverview",
  "Account": "sidebar.sectionAccount",
  "Content": "sidebar.sectionContent",
  "Site Sections": "sidebar.sectionSiteSections",
  "Appearance": "sidebar.sectionAppearance",
  "Marketplace": "sidebar.sectionMarketplace",
  "Ecommerce": "sidebar.sectionEcommerce",
  "System": "sidebar.sectionSystem",
  "Business Tools": "sidebar.sectionBusinessTools",
  "Dashboard": "sidebar.dashboard",
  "Subscription": "sidebar.subscription",
  "Support": "sidebar.support",
  "Pages": "sidebar.pages",
  "Posts": "sidebar.posts",
  "Media": "sidebar.media",
  "Services": "sidebar.services",
  "Features": "sidebar.features",
  "Portfolio": "sidebar.portfolio",
  "Sliders": "sidebar.sliders",
  "Testimonials": "sidebar.testimonials",
  "Pricing": "sidebar.pricing",
  "Contact": "sidebar.contact",
  "Bookings": "sidebar.bookings",
  "Blood Donors": "sidebar.bloodDonors",
  "Templates": "sidebar.templates",
  "Browse Templates": "sidebar.browseTemplates",
  "Colors & Design": "sidebar.colorsAndDesign",
  "Navigation": "sidebar.navigation",
  "Header Builder": "sidebar.headerBuilder",
  "Footer Builder": "sidebar.footerBuilder",
  "Site Identity": "sidebar.siteIdentity",
  "Vendors": "sidebar.vendors",
  "Service Catalog": "sidebar.serviceCatalog",
  "Requests": "sidebar.requests",
  "Products": "sidebar.products",
  "All Products": "sidebar.allProducts",
  "Add Single": "sidebar.addSingle",
  "Add Multiple": "sidebar.addMultiple",
  "Categories": "sidebar.categories",
  "Orders": "sidebar.orders",
  "Sellers": "sidebar.sellers",
  "All Sellers": "sidebar.allSellers",
  "Listing Review": "sidebar.listingReview",
  "Payouts": "sidebar.payouts",
  "Payments": "sidebar.payments",
  "Delivery": "sidebar.delivery",
  "Business Profile": "sidebar.businessProfile",
  "Modules": "sidebar.modules",
  "Users": "sidebar.users",
  "Backups": "sidebar.backups",
  "Settings": "sidebar.settings",
  "API Keys": "sidebar.apiKeys",
  "Domain": "sidebar.domain",
  "Visit Site": "sidebar.visitSite",
  "Docs": "sidebar.docs",
  "CRM": "sidebar.crm",
  "Invoices": "sidebar.invoices",
  "Marketing": "sidebar.marketing",
  "Content Scheduler": "sidebar.contentScheduler",
  "Calendar & Queue": "sidebar.calendarAndQueue",
  "Brands": "sidebar.brands",
  "Access": "sidebar.access",
  "Jobs & Staff": "sidebar.jobsAndStaff",
  "POS": "sidebar.pos",
  "Kitchen": "sidebar.kitchen",
  "Branches": "sidebar.branches",
  "Reservations": "sidebar.reservations",
  "Inventory": "sidebar.inventory",
  "Accounting": "sidebar.accounting",
  "Transactions": "sidebar.transactions",
  "Accounts": "sidebar.accounts",
  "P&L Report": "sidebar.plReport",
};

// Routes where the full-width page builder needs the sidebar out of the way by
// default. Still user-togglable via the rail button — this only sets the
// initial state per route.
const BUILDER_ROUTE = /^\/dashboard\/pages\/[^/]+$/;

function AdminHeader({ onClose, activeSite }: { onClose?: () => void; activeSite?: { slug: string; custom_domain?: string } | null }) {
  const t = useT();
  // Relative "/" resolves against the current tenant subdomain — always the
  // wrong host once a tenant has attached a custom domain (nobody markets
  // the .passivecoder.com subdomain once they have their own domain).
  // publicUrl resolves the real one, falling back to the subdomain when no
  // custom domain is set. Reported live via screenshot alongside the icon
  // having no visible label, only a hover tooltip.
  const visitHref = activeSite ? publicUrl(activeSite, "/") : "/";
  return (
    <div className="flex h-14 items-center justify-between px-4 border-b gap-2">
      <a href="https://passivecoder.com" target="_blank" rel="noopener noreferrer" className="flex items-center min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://mljchiaabgvdzdsfobxs.supabase.co/storage/v1/object/public/media/uploads/1777257556858_Passive_Coder_Web_logo.png"
          alt="Passive Coder"
          className="h-7 w-auto"
        />
      </a>
      <div className="flex items-center gap-1 shrink-0">
        <a
          href={visitHref}
          target="_blank"
          rel="noopener noreferrer"
          title={t("sidebar.visitSite")}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("sidebar.visitSite")}</span>
        </a>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 rounded text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function AdminFooter({ isSuperAdmin, isStaff, isVendor }: { isSuperAdmin: boolean; isStaff: boolean; isVendor: boolean }) {
  const t = useT();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      <Separator />
      <div className="p-3 space-y-1">
        <div className="flex items-center gap-1">
          {isSuperAdmin && (
            <Link
              href="/super-admin"
              className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm text-indigo-500 hover:bg-accent hover:text-indigo-400 transition-colors"
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              {t("sidebar.superAdminPanel")}
            </Link>
          )}
          {isStaff && !isSuperAdmin && (
            <a
              href={`${typeof window !== "undefined" && window.location.hostname.includes("localhost") ? "http" : "https"}://${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com"}/staff`}
              className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm text-yellow-500 hover:bg-accent hover:text-yellow-400 transition-colors"
            >
              <Zap className="h-4 w-4 shrink-0" />
              {t("sidebar.staffPortal")}
            </a>
          )}
          {isVendor && !isSuperAdmin && !isStaff && (
            <Link
              href="/vendor/dashboard"
              className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm text-emerald-600 hover:bg-accent hover:text-emerald-500 transition-colors"
            >
              <Store className="h-4 w-4 shrink-0" />
              {t("sidebar.sellerCentre")}
            </Link>
          )}
          <button
            onClick={handleLogout}
            title={t("sidebar.logout")}
            className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-red-500 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <a
          href="https://wa.me/8801678669699?text=Hi%2C%20I%20need%20support%20with%20my%20Passive%20Coder%20site."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full rounded-md py-2 px-2 text-xs font-semibold text-white bg-[#25D366] hover:bg-[#1da851] transition-colors shadow-sm"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {t("sidebar.whatsappSupport")}
        </a>
        <p className="text-[10px] text-muted-foreground text-center pt-1">Passive Coder v{process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0"}</p>
      </div>
    </>
  );
}

export function AdminSidebar({ isSuperAdmin = false, isStaff = false, isVendor = false, enabledModules, activeSite }: {
  isSuperAdmin?: boolean; isStaff?: boolean; isVendor?: boolean; enabledModules?: Record<ModuleKey, boolean>;
  activeSite?: { slug: string; custom_domain?: string } | null;
}) {
  const t = useT();
  const pathname = usePathname();
  const isBuilderRoute = BUILDER_ROUTE.test(pathname) && pathname !== "/dashboard/pages/new";

  const translateItem = (item: ShellNavItem): ShellNavItem => ({
    ...item,
    label: LABEL_KEY[item.label] ? t(LABEL_KEY[item.label]) : item.label,
    children: item.children?.map(translateItem),
  });
  const translatedSections: ShellNavSection[] = navSections.map((section) => ({
    ...section,
    label: LABEL_KEY[section.label] ? t(LABEL_KEY[section.label]) : section.label,
    items: section.items.map(translateItem),
  }));

  return (
    <Shell
      theme="light"
      sections={translatedSections}
      defaultCollapsed={isBuilderRoute}
      header={(onClose) => <AdminHeader onClose={onClose} activeSite={activeSite} />}
      footer={<AdminFooter isSuperAdmin={isSuperAdmin} isStaff={isStaff} isVendor={isVendor} />}
      filterItem={(item: ShellNavItem) => {
        if (item.saasOnly && !isSaaS) return false;
        if (item.standaloneOnly && isSaaS) return false;
        // enabledModules is undefined for super admins (bypass) — only gate
        // when it's actually resolved (regular tenants/agents).
        if (item.moduleKey && enabledModules && !enabledModules[item.moduleKey as ModuleKey]) return false;
        return true;
      }}
    />
  );
}
