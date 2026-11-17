"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navSectionsFor } from "./nav-items";
import { navItemVisible } from "./nav-filter";
import { COLLECTION_ICONS } from "./collection-icons";
import { Layers } from "lucide-react";
import { ExternalLink, ShieldCheck, LogOut, Zap, MessageCircle, X, Store } from "lucide-react";
import type { ModuleKey } from "./nav-items";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { isSaaS } from "@/lib/flags";
import { Shell } from "@/components/admin-shell/sidebar";
import { useChatWaiting, withChatBadge } from "@/components/site-chat/use-chat-waiting";
import type { ShellNavItem, ShellNavSection } from "@/components/admin-shell/types";
import { publicHost, publicUrl } from "@/lib/tenant/site-urls";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/locales/en";
import { PLATFORM_WHATSAPP } from "@/lib/platform-contact";

// nav-items.ts stays static English (icons/hrefs/module gating live there,
// shared with resolveModuleKeyForPath and the SA plan editor). Labels are
// translated here at render time via this lookup instead of threading a
// translation key through NavItem — same string used in both nav-items.ts
// and the sidebar section labels below.
const LABEL_KEY: Record<string, TranslationKey> = {
  "Overview": "sidebar.sectionOverview",
  "Website": "sidebar.sectionWebsite",
  "Site Content": "sidebar.sectionSiteContent",
  "Customers & Sales": "sidebar.sectionCustomersSales",
  "Shop": "sidebar.sectionShop",
  "Restaurant": "sidebar.sectionRestaurant",
  "Real Estate": "sidebar.sectionRealEstate",
  "Blood Donation": "sidebar.sectionBloodDonation",
  "Team & Planning": "sidebar.sectionTeamPlanning",
  "Account & Help": "sidebar.sectionAccountHelp",
  "Design": "sidebar.design",
  "General Settings": "sidebar.generalSettings",
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
  "Import / Export": "sidebar.importExport",
  "SEO & AI Search": "sidebar.seoAi",
  "Business Email": "sidebar.businessEmail",
  "Settings": "sidebar.settings",
  "AI Connect": "sidebar.aiConnect",
  "Chat": "sidebar.chat",
  "API Keys": "sidebar.apiKeys",
  "Move to self-host": "sidebar.selfhostMove",
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
  "Projects": "sidebar.projects",
  "POS": "sidebar.pos",
  "Kitchen": "sidebar.kitchen",
  "Branches": "sidebar.branches",
  "Reservations": "sidebar.reservations",
  "Food Delivery": "sidebar.foodDelivery",
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

/** White-label: a reseller's brand replaces ours for their clients (lib/partners/brand.ts). */
export type SidebarBrand = { name: string; logoUrl: string | null; supportEmail: string | null; supportWhatsapp: string | null };

function AdminHeader({ onClose, activeSite, brand }: { onClose?: () => void; activeSite?: { name?: string; slug: string; custom_domain?: string } | null; brand?: SidebarBrand | null }) {
  const t = useT();
  // Relative "/" resolves against the current tenant subdomain — always the
  // wrong host once a tenant has attached a custom domain (nobody markets
  // the .passivecoder.com subdomain once they have their own domain).
  // publicUrl resolves the real one, falling back to the subdomain when no
  // custom domain is set.
  const visitHref = activeSite ? publicUrl(activeSite, "/") : "/";
  const siteName = activeSite?.name ?? brand?.name ?? "Passive Coder";
  const visitLabel = activeSite ? publicHost(activeSite) : t("sidebar.visitSite");
  return (
    <div className="border-b">
      {/* White label: the reseller's logo sits above the site it belongs to. */}
      {brand?.logoUrl && (
        <Link href="/dashboard" className="block px-3 pt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoUrl} alt={brand.name} className="h-6 w-auto max-w-[9rem] object-contain" />
        </Link>
      )}
      {/* Which site am I in? The first thing in the menu, always. */}
      <div className="flex items-center gap-2.5 px-3 py-3">
        <Link href="/dashboard" aria-label={siteName} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
          {siteName.trim().charAt(0).toUpperCase() || "S"}
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-5" title={siteName}>{siteName}</p>
          <a
            href={visitHref}
            target="_blank"
            rel="noopener noreferrer"
            title={t("sidebar.visitSite")}
            className="flex items-center gap-1 text-xs leading-4 text-muted-foreground transition-colors hover:text-primary"
          >
            <span className="truncate">{visitLabel}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label={t("sidebar.collapseSidebar")} className="-mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground lg:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function AdminFooter({ isSuperAdmin, isStaff, isVendor, brand }: { isSuperAdmin: boolean; isStaff: boolean; isVendor: boolean; brand?: SidebarBrand | null }) {
  const t = useT();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const portalRow = "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-medium leading-5 transition-colors hover:bg-foreground/[0.05]";
  const support = "flex w-full items-center justify-center gap-1.5 rounded-lg border bg-card px-2 py-1.5 text-xs font-medium leading-5 text-foreground shadow-sm transition-colors hover:bg-accent";

  return (
    <div className="space-y-1.5 border-t p-3">
      <div className="flex items-center gap-1">
        {isSuperAdmin && (
          <Link prefetch={false} href="/super-admin" className={cn(portalRow, "text-violet-700 dark:text-violet-300")}>
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span className="truncate">{t("sidebar.superAdminPanel")}</span>
          </Link>
        )}
        {isStaff && !isSuperAdmin && (
          <a
            href={`${typeof window !== "undefined" && window.location.hostname.includes("localhost") ? "http" : "https"}://${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com"}/staff`}
            className={cn(portalRow, "text-violet-700 dark:text-violet-300")}
          >
            <Zap className="h-4 w-4 shrink-0" />
            <span className="truncate">{t("sidebar.staffPortal")}</span>
          </a>
        )}
        {isVendor && !isSuperAdmin && !isStaff && (
          <Link prefetch={false} href="/vendor/dashboard" className={cn(portalRow, "text-emerald-700 dark:text-emerald-400")}>
            <Store className="h-4 w-4 shrink-0" />
            <span className="truncate">{t("sidebar.sellerCentre")}</span>
          </Link>
        )}
        <button
          onClick={handleLogout}
          title={t("sidebar.logout")}
          aria-label={t("sidebar.logout")}
          className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
      {brand ? (
        (brand.supportWhatsapp || brand.supportEmail) && (
          <a
            href={brand.supportWhatsapp ? `https://wa.me/${brand.supportWhatsapp.replace(/\D/g, "")}` : `mailto:${brand.supportEmail}`}
            target="_blank"
            rel="noopener noreferrer"
            className={support}
          >
            <MessageCircle className="h-3.5 w-3.5 text-[#128C7E] dark:text-[#25D366]" />
            Contact {brand.name}
          </a>
        )
      ) : PLATFORM_WHATSAPP && (
        <a
          href={`https://wa.me/${PLATFORM_WHATSAPP}?text=Hi%2C%20I%20need%20support%20with%20my%20Passive%20Coder%20site.`}
          target="_blank"
          rel="noopener noreferrer"
          className={support}
        >
          <MessageCircle className="h-3.5 w-3.5 text-[#128C7E] dark:text-[#25D366]" />
          {t("sidebar.whatsappSupport")}
        </a>
      )}
      <p className="pt-0.5 text-center text-[10px] leading-4 text-muted-foreground">{brand ? brand.name : "Passive Coder"} v{process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0"}</p>
    </div>
  );
}

export function AdminSidebar({ isSuperAdmin = false, isStaff = false, isVendor = false, enabledModules, activeSite, brand = null, collections = [], hiddenPaths }: {
  isSuperAdmin?: boolean; isStaff?: boolean; isVendor?: boolean; enabledModules?: Record<ModuleKey, boolean>;
  /** The site's collection types: each becomes its own menu item under Site Content. */
  collections?: { slug: string; name: string; icon: string }[];
  /** Areas hidden on this site (layout-locked sites hide the builder and design). */
  hiddenPaths?: string[];
  activeSite?: { name?: string; slug: string; custom_domain?: string } | null;
  brand?: SidebarBrand | null;
}) {
  const t = useT();
  const pathname = usePathname();
  const chatWaiting = useChatWaiting();
  const isBuilderRoute = BUILDER_ROUTE.test(pathname) && pathname !== "/dashboard/pages/new";

  const translateItem = (item: ShellNavItem): ShellNavItem => ({
    ...item,
    label: LABEL_KEY[item.label] ? t(LABEL_KEY[item.label]) : item.label,
    children: item.children?.map(translateItem),
  });
  // Restaurant on: the shop IS the menu. Same products and categories,
  // restaurant words (food items, menu sections) so owners recognise them.
  const RESTAURANT_WORDS: Record<string, string> = {
    Shop: "Menu", Products: "Food Items", "All Products": "All Items", "Add Single": "Add Item",
    "Add Multiple": "Add Many Items", Categories: "Menu Sections", "Product Defaults": "Item Defaults",
  };
  const restaurant = !!enabledModules?.restaurant;
  const word = (l: string) => (restaurant && RESTAURANT_WORDS[l]) || l;
  const renameItem = (item: ShellNavItem): ShellNavItem => ({ ...item, label: word(item.label), children: item.children?.map(renameItem) });
  const translatedSections: ShellNavSection[] = navSectionsFor(enabledModules).map((section) => {
    const isShop = section.label === "Shop";
    let items = isShop ? section.items.map(renameItem) : section.items;
    if (section.label === "Site Content" && collections.length) {
      const own = collections.map((c) => ({
        label: c.name, href: `/dashboard/collections/${c.slug}`, icon: COLLECTION_ICONS[c.icon] ?? Layers, moduleKey: "collections" as ModuleKey,
      }));
      items = [...own, ...items];
    }
    return {
      ...section,
      label: isShop && restaurant ? word(section.label) : LABEL_KEY[section.label] ? t(LABEL_KEY[section.label]) : section.label,
      items: items.map((i) => (isShop && restaurant ? i : translateItem(i))),
    };
  });

  return (
    <Shell
      sections={withChatBadge(translatedSections, "/dashboard/chat", chatWaiting)}
      defaultCollapsed={isBuilderRoute}
      header={(onClose) => <AdminHeader onClose={onClose} activeSite={activeSite} brand={brand} />}
      footer={<AdminFooter isSuperAdmin={isSuperAdmin} isStaff={isStaff} isVendor={isVendor} brand={brand} />}
      // Same rules as the mobile app menu (nav-filter.ts). enabledModules is
      // undefined when no site is selected: only gate when it's resolved.
      filterItem={(item: ShellNavItem) => navItemVisible(
        { href: item.href, saasOnly: item.saasOnly, standaloneOnly: item.standaloneOnly, moduleKey: item.moduleKey as ModuleKey | undefined },
        { isSaaS, enabledModules, hiddenPaths, whiteLabel: !!brand },
      )}
    />
  );
}
