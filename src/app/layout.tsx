import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
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
  description: "Modern CMS built with Next.js and Supabase",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full" data-suppress-hydration-warning>
      <body className={inter.variable + " " + poppins.variable + " font-sans antialiased h-full"} suppressHydrationWarning>
        <ThemeProvider defaultTheme="system">
          <QueryProvider>
            {children}
          </QueryProvider>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
