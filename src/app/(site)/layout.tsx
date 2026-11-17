import { isSaaS } from "@/lib/flags";
import { styleText } from "@/lib/security/style-text";
import { DemoBanner } from "@/components/demo/demo-banner";
import { SupportCapture } from "@/components/support/support-capture";
import { supportCaptureFor } from "@/lib/support/viewer";
import { withSiteMedia } from "@/lib/media/site-media";
import { SiteJsonLd } from "@/components/seo/site-jsonld";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { buildSiteMetadata } from "@/lib/site/site-metadata";
import { headers } from "next/headers";
import { after } from "next/server";
import { countVisit } from "@/lib/usage/count-visit";
import type { Metadata } from "next";
import { resolveDbTemplateIdentity } from "@/modules/templates/resolve-identity";
import { buildTemplateBodyScript } from "@/modules/themes/template-css";
import { buildSiteTheme } from "@/modules/themes/site-theme";
import Script from "next/script";
import { siteCodeBlocked } from "@/lib/security/untrusted-viewer";
import { sanitizeTrialCss } from "@/lib/security/trial-html";
import { safeGaId } from "@/lib/analytics/tracking-ids";
import { PageRenderer } from "@/components/site/page-renderer";
import { SiteHeaderChrome } from "@/components/site/site-header-chrome";
import { CartProvider } from "@/lib/cart/cart-context";
import { CartDrawer } from "@/components/site/cart-drawer";
import { MaintenanceScreen } from "@/components/site/maintenance-screen";
import { GoogleTranslateWidget } from "@/components/site/google-translate-widget";
import { DonorSiteHeader, LocationConsent, PushConsent } from "@/modules/registry/donors/site-chrome";
import { AdminEditWidget } from "@/components/site/admin-edit-widget";
import { ScrollReveal } from "@/components/site/scroll-reveal";
import { FloatingWhatsApp } from "@/components/site/floating-whatsapp";
import { FloatingContactButtons } from "@/components/site/floating-contact-buttons";
import { GoogleTagManager } from "@/components/site/google-tag-manager";
import { MetaPixel } from "@/components/site/meta-pixel";
import { DineInBadge } from "@/components/site/dine-in-badge";
import { previewOverlay } from "@/lib/support-ai/preview";
import { PreviewBar } from "@/components/support/preview-bar";
import { MarketplaceHeader, MarketplaceFooter, getMarketplaceChrome, MARKETPLACE_TOKENS_CSS } from "@/modules/registry/marketplace/chrome";

// Single-vendor tenant with a dedicated floating WhatsApp CTA (per explicit
// client request). Not a general platform feature yet — gated to this one
// tenant id. If more tenants want this, move to a site_settings toggle.
const WHATSAPP_TENANT_ID = "72dd48ef-497c-4e22-9894-4d43a9a4556b";
import type { Block } from "@/types/cms";
import { RTL_LANGS } from "@/lib/i18n-site/storefront-text";
import { SiteContactProvider } from "@/components/site/site-contact-context";
import { installableSite } from "@/modules/registry/food-delivery/store";
import { SiteInstall } from "@/components/site/site-install";
import { getSiteContact } from "@/lib/site-contact";
import { getStudioHeader } from "@/lib/site/header-studio";
import { getStudioFooter } from "@/lib/site/footer-studio";
import { pickSiteFooter } from "@/modules/footer-studio/doc";
import { StudioFooterChrome } from "@/components/site/footer-studio/studio-footer-chrome";
import { pickSiteHeader } from "@/modules/header-studio/doc";
import { StudioHeaderChrome } from "@/components/site/header-studio/studio-header-chrome";

export async function generateMetadata(): Promise<Metadata> {
  const tenantId = (await headers()).get("x-tenant-id");
  // Full resolution (site_identity + site_settings, description fallback to
  // the homepage hero, auto-generated favicon when nothing's uploaded,
  // OG/twitter cards, per-request metadataBase) now lives in one shared
  // place — see site-metadata.ts for why: this was the one route-group that
  // had it right, everywhere else had a partial copy or none at all.
  const [meta, installable] = await Promise.all([buildSiteMetadata(tenantId), installableSite(tenantId)]);
  // Installable store (food delivery): app/manifest.ts serves the
  // restaurant's own manifest on this host; iOS needs these tags too.
  if (!installable) return meta;
  return { ...meta, appleWebApp: { capable: true, title: installable.shortName, statusBarStyle: "default" } };
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
    after(() => countVisit(tenantId, reqHeaders.get("user-agent")));
  }
  // recordPageView (page_view_stats, the analytics panel) is called from
  // (site)/[...slug]/page.tsx instead of here — it needs the REAL path, and
  // the x-pathname header this layout tried to inject via middleware proved
  // unreliable (root-caused to Next 16 renaming middleware.ts's runtime
  // contract to "Proxy"; the header-forwarding mechanism did not deliver the
  // value downstream despite matching the documented API). The page
  // component already has the exact path from its own route params, with no
  // header plumbing needed — simpler and doesn't depend on a mechanism that
  // silently failed here.

  const settingsCols = "site_theme, custom_css, custom_js, analytics_code, ga_measurement_id, gtm_container_id, meta_pixel_id, maintenance_mode, maintenance_title, maintenance_message, site_name, meta_description, auto_translate_enabled, language";
  // Everything this layout needs that does not depend on anything else, in
  // one round trip (audit 2026-10-18: these ran one after another and were
  // most of a 1-2s TTFB on client sites).
  const [settingsResult, identityResult, { data: { user } }, marketplaceChrome, siteContact, installable, studioHeader, studioFooter] = await Promise.all([
    tenantId
      ? createAdminClient().then(admin =>
          admin.from("site_settings").select(settingsCols).eq("tenant_id", tenantId).maybeSingle()
        )
      : supabase.from("site_settings").select(settingsCols).maybeSingle(),
    tenantId
      ? createAdminClient().then(admin =>
          admin.from("site_identity")
            .select("active_template_slug, template_id, logo_url, logo_dark_url, site_name, tagline, global_header, global_footer, color_overrides, design_overrides")
            .eq("tenant_id", tenantId)
            .single()
        )
      : Promise.resolve({ data: null }),
    supabase.auth.getUser(),
    getMarketplaceChrome(tenantId),
    getSiteContact(tenantId),
    installableSite(tenantId),
    // Header Studio (opt-in): null for every site that has not published one,
    // and for all sites while migration 240 is not applied.
    getStudioHeader(tenantId),
    // Footer Studio (opt-in): null for every site that has not published one,
    // and for all sites while migration 241 is not applied.
    getStudioFooter(tenantId),
  ]);

  const settings = settingsResult?.data;
  // Free trial: the site's own code does not run until it is paid (custom JS,
  // the free-form analytics snippet, and Tag Manager, whose container can
  // inject any script). Saved values are kept; they start working on upgrade.
  // The same holds for a signed-in viewer on a platform subdomain who is not a
  // member of this site, and for staff and super admins always: the sign-in
  // cookie is shared across subdomains, so the site's own code is left out
  // for that one viewer (lib/security/viewer-trust.ts). Visitors who are not
  // signed in, and the site's own members, get the site exactly as saved.
  const trialSite = await siteCodeBlocked(tenantId);
  // Written into an inline script below, so only a well-formed id is used.
  const gaId = safeGaId(settings?.ga_measurement_id);
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
    design_overrides?: import("@/modules/themes/template-types").SiteDesign | null;
  } | null;

  // A tenant's visual identity comes from the templates table via
  // template_id. This used to resolve `active_template_slug` against a
  // hardcoded registry of 54 TypeScript objects; that column is still written
  // for history/debugging but nothing reads it any more.
  // Is the visitor an admin of THIS tenant (owner/admin/editor member, or a
  // super admin)? Drives both the maintenance-mode bypass below and the
  // floating edit widget — resolved once here so neither has to repeat it.
  const adminViewer = async () => {
    if (!user || !tenantId) return false;
    const admin = await createAdminClient();
    const [{ data: sa }, { data: membership }] = await Promise.all([
      admin.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
      admin.from("tenant_members").select("role").eq("user_id", user.id).eq("tenant_id", tenantId)
        .in("role", ["owner", "admin", "editor"]).maybeSingle(),
    ]);
    return !!sa || !!membership;
  };
  const [templateIdentity, isAdminViewer, capture] = await Promise.all([
    identity?.template_id ? resolveDbTemplateIdentity(identity.template_id) : Promise.resolve(null),
    adminViewer(),
    user ? supportCaptureFor(tenantId) : Promise.resolve({ show: false, team: false }),
  ]);

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
  // data-theme-locked tells the root layout's global ThemeProvider (mounted
  // above every route group, admin dashboard included) not to resync this
  // element with the visitor's OS preference once it mounts — without it,
  // that provider's own system-preference effect ran right after this
  // script and silently flipped a light-locked site back to dark on any
  // visitor with OS dark mode on.
  const themeScript =
    siteTheme === "dark"
      ? `document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');document.documentElement.style.colorScheme='dark';document.documentElement.dataset.themeLocked='dark';`
      : `document.documentElement.classList.add('light');document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';document.documentElement.dataset.themeLocked='light';`;

  // Palette + overrides + design settings, merged the same way on every
  // surface (see modules/themes/site-theme.ts). Sites with no template get a
  // neutral branded fallback there rather than the bare shadcn slate.
  const { css: templateCSSVars } = buildSiteTheme(identity, templateIdentity);
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
  // AI support preview: the proposed header/footer instead of the live one.
  const preview = await previewOverlay(tenantId);
  const pv = preview?.identity;
  const globalHeader: Block[] = toBlockArray(pv?.global_header !== undefined ? pv.global_header : identity?.global_header);
  const globalFooter: Block[] = toBlockArray(pv?.global_footer !== undefined ? pv.global_footer : identity?.global_footer);

  // Multi-vendor marketplace tenants get a dedicated header/footer instead of
  // page-builder blocks: the header carries live cart count, search and the
  // category menu, none of which a static block can express. Keyed off the
  // ecommerce marketplace actually being in use (approved sellers exist)
  // rather than a hardcoded slug, so any future marketplace tenant picks it
  // up automatically.
  const mainLang = ((settings?.language as string) || "en").split("-")[0].toLowerCase();
  const mainDir = RTL_LANGS.has(mainLang) ? "rtl" : undefined;
  // Which header: blood / marketplace chrome first, then a published Header
  // Studio header, else the classic global header blocks exactly as before.
  // Which footer: marketplace chrome first, then a published Footer Studio
  // footer, else the classic global footer blocks exactly as before.
  const footerKind = pickSiteFooter({ marketplace: !!marketplaceChrome, studio: studioFooter?.config ?? null, legacyBlocks: globalFooter.length });
  const headerKind = pickSiteHeader({ blood: isBloodSite, marketplace: !!marketplaceChrome, studio: studioHeader?.config ?? null, legacyBlocks: globalHeader.length });

  return (
    <SiteContactProvider value={siteContact}>
    <CartProvider>
      {/* Public sites never scroll sideways on phones: one over-wide element
          (a wide logo, a decorative shape, a long word) otherwise lets the whole
          page drag left/right. clip (not hidden) keeps sticky headers working. */}
      <style precedence="pc-base" href="pc-no-hscroll" dangerouslySetInnerHTML={{ __html: "html,body{overflow-x:clip}" }} />
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
      {/* Theme flash prevention. next/script's beforeInteractive strategy is
          what actually runs this before hydration — a bare <script> here
          rendered wherever this nested layout sits in the body's render
          tree with no such guarantee, which meant it ran too late (or after)
          ThemeProvider's own mount effect to beat the OS-preference sync
          race it exists to prevent. `precedence` (the <style>-tag hoisting
          mechanism used elsewhere on this page) is not a valid prop for
          <script> — it silently did nothing here. */}
      <Script id="pc-theme-lock" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} />
      {templateCSSVars && (
        <style precedence="pc-template" dangerouslySetInnerHTML={{ __html: templateCSSVars }} />
      )}
      {templateBodyScript && (
        // eslint-disable-next-line @next/next/no-sync-scripts
        <script dangerouslySetInnerHTML={{ __html: templateBodyScript }} />
      )}
      {templateCustomCss && (
        <style precedence="pc-template-css" dangerouslySetInnerHTML={{ __html: styleText(templateCustomCss) }} />
      )}
      {marketplaceChrome && (
        // Marketplace brand tokens, so shared storefront pages (cart,
        // checkout, account, order confirmation) pick up the marketplace
        // look without per-page colour hardcoding. Light-locked on purpose.
        <style precedence="pc-template" dangerouslySetInnerHTML={{ __html: MARKETPLACE_TOKENS_CSS }} />
      )}
      {settings?.custom_css && (
        <style precedence="pc-custom" dangerouslySetInnerHTML={{ __html: trialSite ? sanitizeTrialCss(settings.custom_css) : styleText(settings.custom_css) }} />
      )}

      {/* Site language root: lang drives the Arabic font, dir makes an
          Arabic-first site right-to-left, and data-site-lang tells the Google
          language button which language the page is written in. A translated
          page (seo.lang) sets its own lang/dir inside this. While Google shows
          the page in a left-to-right language, html.translated-ltr flips it back. */}
      <div data-site-lang={mainLang} lang={mainLang} dir={mainDir} className="pc-site-lang-root" style={{ display: "contents" }}>
      {mainDir === "rtl" && (
        <style precedence="pc-base" href="pc-translated-ltr" dangerouslySetInnerHTML={{ __html: "html.translated-ltr .pc-site-lang-root{direction:ltr}" }} />
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
      ) : headerKind === "studio" && studioHeader ? (
        <StudioHeaderChrome data={studioHeader} logoUrl={identity?.logo_url ?? null} logoDarkUrl={identity?.logo_dark_url ?? null}
          siteName={identity?.site_name ?? settings?.site_name ?? ""} />
      ) : globalHeader.length > 0 ? (
        // display:contents keeps a sticky nav sticky; the attribute lets a
        // translated page (seo.lang) swap in its own localized chrome.
        <SiteHeaderChrome blocks={withSiteMedia(globalHeader)} />
      ) : null}

      {preview && <PreviewBar />}

      {/* Business + website structured data for search and AI answer engines. */}
      <SiteJsonLd tenantId={tenantId} />

      {/* Page content */}
      {marketplaceChrome ? <div className="bg-[#F5F5F7] min-h-[60vh]">{children}</div> : children}

      {/* Persistent global footer */}
      {marketplaceChrome ? (
        <MarketplaceFooter
          logoUrl={marketplaceChrome.logoDarkUrl}
          siteName={marketplaceChrome.siteName}
          categories={marketplaceChrome.categories}
          contact={marketplaceChrome.contact}
        />
      ) : footerKind === "studio" && studioFooter ? (
        <StudioFooterChrome data={studioFooter} logoUrl={identity?.logo_url ?? null} logoDarkUrl={identity?.logo_dark_url ?? null}
          siteName={identity?.site_name ?? settings?.site_name ?? ""} />
      ) : globalFooter.length > 0 ? (
        <div data-site-chrome="footer" style={{ display: "contents" }}>
          <PageRenderer blocks={withSiteMedia(globalFooter)} />
        </div>
      ) : null}
      </div>

      {/* Floating cart drawer — always mounted, toggled by cart icon */}
      <CartDrawer />

      {/* One IntersectionObserver drives all [data-reveal] scroll animations */}
      <ScrollReveal />

      {tenantId === WHATSAPP_TENANT_ID && <FloatingWhatsApp />}
      {!isBloodSite && !marketplaceChrome && <FloatingContactButtons tenantId={tenantId} />}
      <DemoBanner tenantId={tenantId} />

      <DineInBadge />
      {installable && <SiteInstall lang={installable.lang} color={installable.color} />}

      {isAdminViewer && <AdminEditWidget />}
      {isSaaS && capture.show && <SupportCapture area="site" team={capture.team} />}

      {settings?.auto_translate_enabled && <GoogleTranslateWidget pageLanguage={(settings.language as string) || "en"} />}

      {gaId && (
        <>
          {/* Phase 2 GA connect: inject the tenant's own gtag.js with their own
              measurement ID. We never read GA data back — their GA account is
              the source of truth for anyone who wants full GA-parity reporting;
              our own analytics panel (page_view_stats) is what the dashboard
              itself reads from. afterInteractive so it never blocks the page. */}
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');`}
          </Script>
        </>
      )}
      {!trialSite && <GoogleTagManager id={settings?.gtm_container_id as string | null} />}
      <MetaPixel id={settings?.meta_pixel_id as string | null} />
      {!trialSite && settings?.analytics_code && (
        <div dangerouslySetInnerHTML={{ __html: settings.analytics_code }} />
      )}
      {!trialSite && settings?.custom_js && (
        <script dangerouslySetInnerHTML={{ __html: settings.custom_js }} />
      )}
    </CartProvider>
    </SiteContactProvider>
  );
}
