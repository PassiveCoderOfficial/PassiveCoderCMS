import { createClient, createAdminClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { after } from "next/server";
import { countVisit } from "@/lib/usage/count-visit";
import { recordPageView } from "@/lib/usage/record-page-view";
import type { Metadata } from "next";
import { resolveDbTemplateIdentity } from "@/modules/templates/resolve-identity";
import { buildTemplateCSSVars, buildTemplateBodyScript } from "@/modules/themes/template-css";
import Script from "next/script";
import { PageRenderer } from "@/components/site/page-renderer";
import { CartProvider } from "@/lib/cart/cart-context";
import { CartDrawer } from "@/components/site/cart-drawer";
import { MaintenanceScreen } from "@/components/site/maintenance-screen";
import { GoogleTranslateWidget } from "@/components/site/google-translate-widget";
import { DonorSiteHeader } from "@/components/donors/donor-site-header";
import { LocationConsent } from "@/components/donors/location-consent";
import { PushConsent } from "@/components/donors/push-consent";
import { AdminEditWidget } from "@/components/site/admin-edit-widget";
import { ScrollReveal } from "@/components/site/scroll-reveal";
import { FloatingWhatsApp } from "@/components/site/floating-whatsapp";
import { MarketplaceHeader } from "@/components/marketplace-ecom/marketplace-header";
import { MarketplaceFooter } from "@/components/marketplace-ecom/marketplace-footer";
import { getMarketplaceChrome } from "@/lib/marketplace-ecom/chrome";

// Single-vendor tenant with a dedicated floating WhatsApp CTA (per explicit
// client request). Not a general platform feature yet — gated to this one
// tenant id. If more tenants want this, move to a site_settings toggle.
const WHATSAPP_TENANT_ID = "72dd48ef-497c-4e22-9894-4d43a9a4556b";
import type { Block } from "@/types/cms";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");

  // Favicon/site name can be set from two different screens which write two
  // different tables: Templates > Header/Footer writes site_identity, while
  // Settings writes site_settings. Read both and prefer identity, otherwise a
  // favicon uploaded on the Settings screen silently never appears.
  const [{ data: settings }, identityResult] = await Promise.all([
    tenantId
      ? createAdminClient().then(admin =>
          admin.from("site_settings").select("site_name, meta_description, site_description, favicon_url").eq("tenant_id", tenantId).maybeSingle()
        )
      : supabase.from("site_settings").select("site_name, meta_description, site_description, favicon_url").maybeSingle(),
    tenantId
      ? createAdminClient().then(admin =>
          admin.from("site_identity").select("site_name, favicon_url, logo_url, tagline").eq("tenant_id", tenantId).single()
        )
      : Promise.resolve({ data: null }),
  ]);
  const identity = identityResult?.data as
    { site_name?: string; favicon_url?: string; logo_url?: string; tagline?: string } | null;

  // These columns hold "" as often as NULL — a site saved with the field left
  // blank stores an empty string — and ?? only skips null/undefined, so an
  // empty description would win and render an empty meta tag.
  const firstNonEmpty = (...vals: (string | null | undefined)[]) =>
    vals.find((v) => typeof v === "string" && v.trim().length > 0)?.trim();

  const siteName = firstNonEmpty(identity?.site_name, settings?.site_name) ?? "CMS Site";
  let description = firstNonEmpty(
    settings?.meta_description,
    settings?.site_description,
    identity?.tagline,
  );

  // Most sites never fill in a description — 34 of 43 tenants had none when
  // this was written — which left shared links with no summary at all. The
  // homepage hero is the site's own opening line, so it stands in until
  // someone writes a proper one, rather than leaving the preview blank or
  // (as before) inheriting the platform's.
  if (!description && tenantId) {
    const admin = await createAdminClient();
    const { data: homePage } = await admin
      .from("pages")
      .select("blocks")
      .eq("tenant_id", tenantId)
      .eq("slug", "home")
      .eq("status", "published")
      .maybeSingle();
    const hero = ((homePage?.blocks as Block[] | null) ?? []).find((b) => b.type === "hero");
    const heroData = hero?.data as { description?: string; subtitle?: string } | undefined;
    description = firstNonEmpty(heroData?.description, heroData?.subtitle);
  }
  // Fall back to the platform icon only when the tenant genuinely has none —
  // never to another tenant's, and never to the removed app/favicon.ico
  // file-convention icon that used to silently win over this value.
  const faviconUrl =
    firstNonEmpty(identity?.favicon_url, (settings as { favicon_url?: string } | null)?.favicon_url) ??
    "/branding/passivecoder-icon.png";
  // Link-preview image: the tenant's own logo if they have one, then their
  // favicon (a small square image beats no image), never the platform's own
  // branding — a client's WhatsApp preview showing "Passive Coder" is the
  // bug this fixes, so nothing here may fall through to it.
  const ogImage = firstNonEmpty(identity?.logo_url, identity?.favicon_url);

  // WhatsApp/Telegram/Facebook link previews read og:* tags and, absent an
  // openGraph block at this level, Next synthesizes one from the *root*
  // layout's title/description — which is PassiveCoder's own marketing copy.
  // That's exactly what clients were seeing instead of their own site's
  // description and image. Every tenant route now gets its own openGraph
  // (and matching twitter card) so nothing here can inherit upward.
  // Resolved from the request host so each tenant's metadata is based on its
  // own origin — a shared constant would resolve every relative URL (the
  // platform fallback icon, most obviously) against the wrong domain, and
  // without any base Next warns and leaves them unresolved.
  const host = reqHeaders.get("host");
  const proto = host?.startsWith("localhost") || host?.startsWith("127.") ? "http" : "https";
  const metadataBase = host ? new URL(`${proto}://${host}`) : undefined;

  return {
    metadataBase,
    title: { default: siteName, template: `%s | ${siteName}` },
    description,
    icons: { icon: faviconUrl, shortcut: faviconUrl, apple: faviconUrl },
    openGraph: {
      title: siteName,
      description,
      siteName,
      images: ogImage ? [{ url: ogImage }] : [],
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: siteName,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");
  const tenantSlug = reqHeaders.get("x-tenant-slug");
  const isBloodSite = tenantSlug === "blood";

  // Count the visit for the plan allowance. after() so it never delays the
  // page, and countVisit swallows its own errors — a counter is never worth
  // failing a customer's site over.
  if (tenantId) {
    const userAgent = reqHeaders.get("user-agent");
    // TEMP diagnostic — recordPageView silently wrote a row for "/" but not
    // for "/services" on the same tenant, with no thrown error either time.
    console.log("[analytics-debug]", { pathname: reqHeaders.get("x-pathname"), tenantId });
    after(() => countVisit(tenantId, userAgent));
    // Separate call, separate table (page_view_stats) — this feeds the
    // dashboard analytics panel and must never affect the billing counter
    // above, so it stays a fully independent write with its own failure mode.
    after(() =>
      recordPageView(
        tenantId,
        reqHeaders.get("x-pathname") ?? "/",
        userAgent,
        reqHeaders.get("referer"),
        reqHeaders.get("host"),
        reqHeaders.get("x-vercel-ip-country"),
      ),
    );
  }

  const settingsCols = "site_theme, custom_css, custom_js, analytics_code, ga_measurement_id, maintenance_mode, maintenance_title, maintenance_message, site_name, meta_description, auto_translate_enabled";
  const [settingsResult, identityResult] = await Promise.all([
    tenantId
      ? createAdminClient().then(admin =>
          admin.from("site_settings").select(settingsCols).eq("tenant_id", tenantId).maybeSingle()
        )
      : supabase.from("site_settings").select(settingsCols).maybeSingle(),
    tenantId
      ? createAdminClient().then(admin =>
          admin.from("site_identity")
            .select("active_template_slug, template_id, logo_url, logo_dark_url, site_name, tagline, global_header, global_footer, color_overrides")
            .eq("tenant_id", tenantId)
            .single()
        )
      : Promise.resolve({ data: null }),
  ]);

  const settings = settingsResult?.data;
  const identity = identityResult?.data as {
    active_template_slug?: string;
    template_id?: string | null;
    logo_url?: string;
    logo_dark_url?: string;
    site_name?: string;
    tagline?: string;
    global_header?: Block[] | null;
    global_footer?: Block[] | null;
    color_overrides?: Partial<import("@/modules/themes/template-types").TemplatePalette> | null;
  } | null;

  // A tenant's visual identity comes from the templates table via
  // template_id. This used to resolve `active_template_slug` against a
  // hardcoded registry of 54 TypeScript objects; that column is still written
  // for history/debugging but nothing reads it any more.
  const templateIdentity = identity?.template_id
    ? await resolveDbTemplateIdentity(identity.template_id)
    : null;

  // Is the visitor an admin of THIS tenant (owner/admin/editor member, or a
  // super admin)? Drives both the maintenance-mode bypass below and the
  // floating edit widget — resolved once here so neither has to repeat it.
  const { data: { user } } = await supabase.auth.getUser();
  let isAdminViewer = false;
  if (user && tenantId) {
    const admin = await createAdminClient();
    const [{ data: sa }, { data: membership }] = await Promise.all([
      admin.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
      admin.from("tenant_members").select("role").eq("user_id", user.id).eq("tenant_id", tenantId)
        .in("role", ["owner", "admin", "editor"]).maybeSingle(),
    ]);
    isAdminViewer = !!sa || !!membership;
  }

  // ── Maintenance mode ────────────────────────────────────────────────────────
  // When on, show the maintenance screen to public visitors. Logged-in users
  // (the owner/staff previewing) bypass it so they can keep working on the site.
  if (settings?.maintenance_mode && !user) {
    return (
      <MaintenanceScreen
        title={settings?.maintenance_title || undefined}
        description={settings?.maintenance_message || settings?.meta_description || undefined}
        logoUrl={identity?.logo_url ?? null}
        siteName={identity?.site_name ?? settings?.site_name ?? undefined}
      />
    );
  }

  // A published site renders in the palette its template defines, not in
  // whatever the visitor's phone is set to. Following prefers-color-scheme
  // repainted --background/--foreground underneath a palette that was designed
  // around fixed colours, which is what made text disappear into card
  // surfaces on dark-mode devices. Tenants who genuinely want a dark site set
  // site_theme = "dark" explicitly; everyone else gets light, deterministically.
  const siteTheme = settings?.site_theme === "dark" ? "dark" : "light";

  // Also pin `color-scheme`: without it the browser renders native form
  // controls (select popups, date pickers, autofill, scrollbars) using the
  // visitor's OS dark mode even when the site itself is locked to light —
  // which is what made input text unreadable on dark-mode devices.
  const themeScript =
    siteTheme === "dark"
      ? `document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');document.documentElement.style.colorScheme='dark';`
      : `document.documentElement.classList.add('light');document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';`;

  // Roughly half the tenants have never had a template applied. Those used to
  // inherit whatever colour the block components hardcoded; now that blocks are
  // token-driven they'd fall through to the base shadcn slate, which renders
  // CTAs as a near-black gradient. Give palette-less sites a neutral branded
  // default (and still honour any color_overrides they've set) so a site
  // without a template still looks like a site, not an unstyled shell.
  const FALLBACK_PALETTE = {
    primary: "#2563EB", primaryFg: "#ffffff",
    secondary: "#0F172A", accent: "#38BDF8",
    background: "#FFFFFF", foreground: "#0F172A",
    muted: "#F1F5F9", mutedFg: "#64748B",
    card: "#FFFFFF", border: "#E2E8F0", ring: "#2563EB",
    borderRadius: "0.75rem",
  };
  const FALLBACK_TYPOGRAPHY = {
    headingFont: "Inter", bodyFont: "Inter",
    headingWeight: "700", letterSpacing: "-0.02em",
  };

  const mergedPalette = templateIdentity
    ? { ...templateIdentity.palette, ...(identity?.color_overrides ?? {}) }
    : { ...FALLBACK_PALETTE, ...(identity?.color_overrides ?? {}) };
  const templateCSSVars = buildTemplateCSSVars(
    mergedPalette,
    templateIdentity?.typography ?? FALLBACK_TYPOGRAPHY,
  );
  const templateBodyScript = templateIdentity
    ? buildTemplateBodyScript(templateIdentity.slug)
    : null;
  const templateCustomCss = templateIdentity?.customCss ?? null;

  // Global header/footer — stored as single Block object OR Block[] array
  function toBlockArray(val: unknown): Block[] {
    if (!val) return [];
    if (Array.isArray(val)) return val as Block[];
    if (typeof val === "object" && (val as Record<string, unknown>).type) return [val as Block];
    return [];
  }
  const globalHeader: Block[] = toBlockArray(identity?.global_header);
  const globalFooter: Block[] = toBlockArray(identity?.global_footer);

  // Multi-vendor marketplace tenants get a dedicated header/footer instead of
  // page-builder blocks: the header carries live cart count, search and the
  // category menu, none of which a static block can express. Keyed off the
  // ecommerce marketplace actually being in use (approved sellers exist)
  // rather than a hardcoded slug, so any future marketplace tenant picks it
  // up automatically.
  const marketplaceChrome = await getMarketplaceChrome(tenantId);

  return (
    <CartProvider>
      {/* The root layout mounts <ThemeProvider defaultTheme="system">, which
          adds .dark to <html> from the visitor's OS setting on mount — that
          repainted light-locked tenant sites (themed text turned near-white on
          white cards, worst on form fields). When a tenant pins its theme we
          re-declare the palette so .dark can't win, and pin color-scheme so
          native controls follow too. */}
      {/* `precedence` makes React hoist these into <head> deterministically and
          keeps them ordered: theme lock, then template vars, then custom CSS.

          The lock only neutralises the dark-mode *overrides* — it must not
          re-declare colour values. It used to hardcode the default shadcn
          slate palette here, which loaded after the template vars and so
          overwrote every tenant's brand colours for any visitor whose OS was
          in dark mode (that's why themed CTAs rendered near-black). Unsetting
          the vars lets each tenant's own :root palette show through instead. */}
      {siteTheme === "light" && (
        <style precedence="pc-theme" dangerouslySetInnerHTML={{ __html: `
          :root, html.dark, html.light { color-scheme: light; }
          html.dark {
            --background: revert; --foreground: revert;
            --card: revert; --card-foreground: revert;
            --popover: revert; --popover-foreground: revert;
            --primary: revert; --primary-foreground: revert;
            --secondary: revert; --secondary-foreground: revert;
            --muted: revert; --muted-foreground: revert;
            --accent: revert; --accent-foreground: revert;
            --border: revert; --input: revert;
            --ring: revert;
          }
        ` }} />
      )}
      {siteTheme === "dark" && (
        <style precedence="pc-theme" dangerouslySetInnerHTML={{ __html: `:root{color-scheme:dark;}` }} />
      )}
      {/* Theme flash prevention */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      {templateCSSVars && (
        <style precedence="pc-template" dangerouslySetInnerHTML={{ __html: templateCSSVars }} />
      )}
      {templateBodyScript && (
        // eslint-disable-next-line @next/next/no-sync-scripts
        <script dangerouslySetInnerHTML={{ __html: templateBodyScript }} />
      )}
      {templateCustomCss && (
        <style precedence="pc-template-css" dangerouslySetInnerHTML={{ __html: templateCustomCss }} />
      )}
      {settings?.custom_css && (
        <style precedence="pc-custom" dangerouslySetInnerHTML={{ __html: settings.custom_css }} />
      )}

      {/* Persistent global header — dedicated donor-site header for the blood
          directory (present on every /donors/* route too, via donors/layout.tsx),
          otherwise the tenant's page-builder global header block. */}
      {isBloodSite ? (
        <>
          <DonorSiteHeader showTranslate={!!settings?.auto_translate_enabled} />
          <LocationConsent />
          <PushConsent />
        </>
      ) : marketplaceChrome ? (
        <MarketplaceHeader
          logoUrl={marketplaceChrome.logoUrl}
          siteName={marketplaceChrome.siteName}
          categories={marketplaceChrome.categories}
          supportPhone={marketplaceChrome.contact?.phone}
        />
      ) : globalHeader.length > 0 ? (
        <PageRenderer blocks={globalHeader} />
      ) : null}

      {/* Page content */}
      {children}

      {/* Persistent global footer */}
      {marketplaceChrome ? (
        <MarketplaceFooter
          logoUrl={marketplaceChrome.logoDarkUrl}
          siteName={marketplaceChrome.siteName}
          categories={marketplaceChrome.categories}
          contact={marketplaceChrome.contact}
        />
      ) : globalFooter.length > 0 ? (
        <PageRenderer blocks={globalFooter} />
      ) : null}

      {/* Floating cart drawer — always mounted, toggled by cart icon */}
      <CartDrawer />

      {/* One IntersectionObserver drives all [data-reveal] scroll animations */}
      <ScrollReveal />

      {tenantId === WHATSAPP_TENANT_ID && <FloatingWhatsApp />}

      {isAdminViewer && <AdminEditWidget />}

      {settings?.auto_translate_enabled && <GoogleTranslateWidget />}

      {settings?.ga_measurement_id && (
        <>
          {/* Phase 2 GA connect: inject the tenant's own gtag.js with their own
              measurement ID. We never read GA data back — their GA account is
              the source of truth for anyone who wants full GA-parity reporting;
              our own analytics panel (page_view_stats) is what the dashboard
              itself reads from. afterInteractive so it never blocks the page. */}
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${settings.ga_measurement_id}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${settings.ga_measurement_id}');`}
          </Script>
        </>
      )}
      {settings?.analytics_code && (
        <div dangerouslySetInnerHTML={{ __html: settings.analytics_code }} />
      )}
      {settings?.custom_js && (
        <script dangerouslySetInnerHTML={{ __html: settings.custom_js }} />
      )}
    </CartProvider>
  );
}
