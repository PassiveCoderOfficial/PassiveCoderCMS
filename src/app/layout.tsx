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
// layout's generateMetadata returns — which is exactly why every tenant site
// showed the PassiveCoder icon instead of their own. Every route group that
// needs a favicon (site, marketing, admin, ...) now sets its own `icons` via
// generateMetadata, falling back to /branding/passivecoder-icon.png only
// when there's no tenant-specific one.
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
