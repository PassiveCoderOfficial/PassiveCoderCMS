import { createClient, createAdminClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { getTemplateIdentity } from "@/modules/themes/template-registry";
import { resolveDbTemplateIdentity } from "@/modules/templates/resolve-identity";
import { buildTemplateCSSVars, buildTemplateBodyScript } from "@/modules/themes/template-css";
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
import type { Block } from "@/types/cms";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");

  const [{ data: settings }, identityResult] = await Promise.all([
    tenantId
      ? createAdminClient().then(admin =>
          admin.from("site_settings").select("site_name, meta_description, site_description").eq("tenant_id", tenantId).maybeSingle()
        )
      : supabase.from("site_settings").select("site_name, meta_description, site_description").maybeSingle(),
    tenantId
      ? createAdminClient().then(admin =>
          admin.from("site_identity").select("site_name, favicon_url").eq("tenant_id", tenantId).single()
        )
      : Promise.resolve({ data: null }),
  ]);
  const identity = identityResult?.data ?? null;

  const siteName = (identity as { site_name?: string } | null)?.site_name ?? settings?.site_name ?? "CMS Site";
  const faviconUrl = (identity as { favicon_url?: string } | null)?.favicon_url ?? null;

  return {
    title: { default: siteName, template: `%s | ${siteName}` },
    description: settings?.meta_description ?? settings?.site_description,
    ...(faviconUrl && {
      icons: { icon: faviconUrl, shortcut: faviconUrl, apple: faviconUrl },
    }),
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");
  const tenantSlug = reqHeaders.get("x-tenant-slug");
  const isBloodSite = tenantSlug === "blood";

  const settingsCols = "site_theme, custom_css, custom_js, analytics_code, maintenance_mode, maintenance_title, maintenance_message, site_name, meta_description, auto_translate_enabled";
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
    color_overrides?: Partial<import("@/modules/themes/template-registry").TemplatePalette> | null;
  } | null;

  // Tenants are being migrated off active_template_slug (resolved against the
  // hardcoded TEMPLATE_REGISTRY) onto template_id, a real row in the DB
  // templates table (migration 062 + the legacy-* rows seeded from the
  // registry during that cutover). template_id is preferred; the registry
  // lookup stays as a fallback only until every live tenant is repointed and
  // verified, at which point it and TEMPLATE_REGISTRY itself get deleted.
  const activeTemplateSlug = identity?.active_template_slug ?? null;
  const templateIdentity = identity?.template_id
    ? await resolveDbTemplateIdentity(identity.template_id)
    : activeTemplateSlug
      ? getTemplateIdentity(activeTemplateSlug)
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

  const mergedPalette = templateIdentity
    ? { ...templateIdentity.palette, ...(identity?.color_overrides ?? {}) }
    : null;
  const templateCSSVars = templateIdentity && mergedPalette
    ? buildTemplateCSSVars(mergedPalette, templateIdentity.typography)
    : null;
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

  return (
    <CartProvider>
      {/* The root layout mounts <ThemeProvider defaultTheme="system">, which
          adds .dark to <html> from the visitor's OS setting on mount — that
          repainted light-locked tenant sites (themed text turned near-white on
          white cards, worst on form fields). When a tenant pins its theme we
          re-declare the palette so .dark can't win, and pin color-scheme so
          native controls follow too. */}
      {siteTheme === "light" && (
        <style dangerouslySetInnerHTML={{ __html: `
          :root, html.dark, html.light { color-scheme: light; }
          html.dark {
            --background: 0 0% 100%; --foreground: 222.2 84% 4.9%;
            --card: 0 0% 100%; --card-foreground: 222.2 84% 4.9%;
            --popover: 0 0% 100%; --popover-foreground: 222.2 84% 4.9%;
            --primary: 222.2 47.4% 11.2%; --primary-foreground: 210 40% 98%;
            --secondary: 210 40% 96.1%; --secondary-foreground: 222.2 47.4% 11.2%;
            --muted: 210 40% 96.1%; --muted-foreground: 215.4 16.3% 46.9%;
            --accent: 210 40% 96.1%; --accent-foreground: 222.2 47.4% 11.2%;
            --border: 214.3 31.8% 91.4%; --input: 214.3 31.8% 91.4%;
            --ring: 222.2 84% 4.9%;
          }
        ` }} />
      )}
      {siteTheme === "dark" && (
        <style dangerouslySetInnerHTML={{ __html: `:root{color-scheme:dark;}` }} />
      )}
      {/* Theme flash prevention */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      {templateCSSVars && (
        <style dangerouslySetInnerHTML={{ __html: templateCSSVars }} />
      )}
      {templateBodyScript && (
        // eslint-disable-next-line @next/next/no-sync-scripts
        <script dangerouslySetInnerHTML={{ __html: templateBodyScript }} />
      )}
      {templateCustomCss && (
        <style dangerouslySetInnerHTML={{ __html: templateCustomCss }} />
      )}
      {settings?.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: settings.custom_css }} />
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
      ) : globalHeader.length > 0 ? (
        <PageRenderer blocks={globalHeader} />
      ) : null}

      {/* Page content */}
      {children}

      {/* Persistent global footer */}
      {globalFooter.length > 0 && (
        <PageRenderer blocks={globalFooter} />
      )}

      {/* Floating cart drawer — always mounted, toggled by cart icon */}
      <CartDrawer />

      {/* One IntersectionObserver drives all [data-reveal] scroll animations */}
      <ScrollReveal />

      {isAdminViewer && <AdminEditWidget />}

      {settings?.auto_translate_enabled && <GoogleTranslateWidget />}

      {settings?.analytics_code && (
        <div dangerouslySetInnerHTML={{ __html: settings.analytics_code }} />
      )}
      {settings?.custom_js && (
        <script dangerouslySetInnerHTML={{ __html: settings.custom_js }} />
      )}
    </CartProvider>
  );
}
