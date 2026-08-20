import { redirect } from "next/navigation";
import { requireManagerOrSuperAdmin } from "@/lib/super-admin";
import SuperAdminSidebar from "@/components/super-admin/sidebar";
import type { Metadata } from "next";

// Super-admin console is PassiveCoder's own tool UI, not a tenant's site.
export const metadata: Metadata = {
  icons: { icon: "/branding/passivecoder-icon.png", shortcut: "/branding/passivecoder-icon.png", apple: "/branding/passivecoder-icon.png" },
};

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireManagerOrSuperAdmin();
  if (!auth?.user) redirect("/login?error=unauthorized");

  return (
    <div className="dark flex h-screen bg-background text-foreground">
      <SuperAdminSidebar isSA={auth.isSA} />
      <main className="flex-1 overflow-y-auto bg-background pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
