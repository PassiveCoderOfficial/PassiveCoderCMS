import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/super-admin";
import SuperAdminSidebar from "@/components/super-admin/sidebar";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSuperAdmin();
  if (!user) redirect("/login?error=unauthorized");

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      <SuperAdminSidebar />
      <main className="flex-1 overflow-y-auto bg-gray-950 pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
