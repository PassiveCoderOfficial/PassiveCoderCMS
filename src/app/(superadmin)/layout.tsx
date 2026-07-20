import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/super-admin";
import SuperAdminSidebar from "@/components/super-admin/sidebar";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSuperAdmin();
  if (!user) redirect("/login?error=unauthorized");

  return (
    <div className="dark flex h-screen bg-background text-foreground">
      <SuperAdminSidebar />
      <main className="flex-1 overflow-y-auto bg-background pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
