import React from "react";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { PageRenderer } from "@/components/site/page-renderer";
import { SiteHeaderChrome, HIDE_GLOBAL_CHROME_CSS } from "@/components/site/site-header-chrome";
import { withSiteMedia } from "@/lib/media/site-media";
import { fetchGlobalLayout, fetchTranslatedChrome } from "@/lib/site/global-blocks";
import { RTL_LANGS } from "@/lib/i18n-site/storefront-text";

/**
 * Wrapper for built-in routes that have language versions (/<lang>/products/x,
 * /<lang>/shop): lang + dir on the content, that language's header/footer
 * (from its translated home page) in place of the main-language chrome, and
 * the floating switcher when the header has no language button of its own.
 */
export async function LanguageShell({ tenantId, lang, main, alternates, children }: {
  tenantId: string | null;
  /** The version being shown; null = the main language. */
  lang: string | null;
  main: string;
  alternates: Record<string, string>;
  children: React.ReactNode;
}) {
  const [chrome, global] = tenantId
    ? await Promise.all([lang ? fetchTranslatedChrome(tenantId, lang) : Promise.resolve(null), fetchGlobalLayout(tenantId)])
    : [null, null];
  return (
    <div lang={lang ?? main} dir={lang && RTL_LANGS.has(lang) ? "rtl" : undefined}>
      {chrome && <style dangerouslySetInnerHTML={{ __html: HIDE_GLOBAL_CHROME_CSS }} />}
      {chrome && <SiteHeaderChrome localized blocks={withSiteMedia(chrome.header)} />}
      {children}
      {chrome && <PageRenderer blocks={withSiteMedia(chrome.footer)} />}
      <LanguageSwitcher alternates={alternates} current={lang ?? main} chrome={chrome?.header ?? global?.header} />
    </div>
  );
}
