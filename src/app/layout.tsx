import type { Metadata } from "next";
import { Inter, Poppins, Anek_Bangla, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { ThemeProvider, ThemedToaster } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ScrollMotion } from "@/components/site/scroll-motion";
import { StaleDeployReload } from "@/components/providers/stale-deploy-reload";
import { WORLD_THEME_SCRIPT } from "@/lib/theme/worlds";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
// Bangla script everywhere (sites, dashboard, marketing). Bengali subset only,
// so its unicode-range covers Bangla glyphs and Latin falls through to the
// site's own font in every stack that lists it. adjustFontFallback must stay
// off: the generated "Anek Bangla Fallback" face is a local Arial with no
// unicode-range, so it captured all Latin text and overrode every site's
// chosen heading/body font.
const anek = Anek_Bangla({ subsets: ["bengali"], variable: "--font-anek", display: "swap", adjustFontFallback: false });
// Arabic script for the Gulf country pages (/sa, /ae/ar, ...): applied by
// globals.css to [lang="ar"] only, so Latin text keeps the site's own font.
const arabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], variable: "--font-arabic", display: "swap", adjustFontFallback: false });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-poppins" });

// No static icons here on purpose. This root metadata is the outermost
// layer, but a file-convention `app/favicon.ico` or `app/icon.png` would be
// served at those literal paths for every route regardless of what a nested
// layout's generateMetadata returns. Every route group sets its own `icons`
// via generateMetadata instead — tenant-facing groups ((site), (marketing))
// through the shared resolveSiteMetadata/buildSiteMetadata in
// lib/site/site-metadata.ts, which auto-generates a small coded favicon for
// a tenant with none uploaded rather than falling back to PLATFORM_ICONS —
// a client's site must never show Passive Coder's own icon. Only the CMS's
// own tool UI ((admin)/(auth)/(staff)/(superadmin), never tenant-facing)
// uses PLATFORM_ICONS directly.
export const metadata: Metadata = {
  title: "Passive Coder",
  description: "Professional websites for local service businesses.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={anek.variable + " " + arabic.variable + " h-full"} data-suppress-hydration-warning>
      <head>
        {/* Admin worlds only (no-op on every public page): theme on <html> before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: WORLD_THEME_SCRIPT }} />
      </head>
      <body className={inter.variable + " " + poppins.variable + " font-sans antialiased h-full"} suppressHydrationWarning>
        <ThemeProvider defaultTheme="system">
          <QueryProvider>
            {children}
          </QueryProvider>
          <ThemedToaster />
          <ScrollMotion />
          <StaleDeployReload />
        </ThemeProvider>
      </body>
    </html>
  );
}
