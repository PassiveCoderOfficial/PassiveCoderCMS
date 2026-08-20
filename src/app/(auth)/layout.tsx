import type { Metadata } from "next";

// Login/signup are PassiveCoder's own pages, not a tenant's site.
export const metadata: Metadata = {
  icons: { icon: "/branding/passivecoder-icon.png", shortcut: "/branding/passivecoder-icon.png", apple: "/branding/passivecoder-icon.png" },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
