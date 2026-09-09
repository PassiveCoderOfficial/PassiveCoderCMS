import type { Metadata } from "next";
import { PLATFORM_ICONS } from "@/lib/site/site-metadata";

// Login/signup are PassiveCoder's own pages, not a tenant's site.
export const metadata: Metadata = {
  icons: PLATFORM_ICONS,
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
