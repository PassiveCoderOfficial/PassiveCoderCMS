import { createAdminClient, createClient } from "@/lib/supabase/server";
import { computeVerificationStatus } from "@/lib/verification";
import { Users, ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import GrantSuperAdminButton from "./grant-button";
import ActivateToggleButton from "./activate-button";
import VerifyButton from "./verify-button";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Users & Roles — Super Admin" };

export default async function UsersPage() {
  const supabase = await createAdminClient();
  const authClient = await createClient();
  const { data: { user: currentUser } } = await authClient.auth.getUser();

  const [{ data: superAdmins }, { data: recentUsers }, { data: profiles }] = await Promise.all([
    supabase.from("super_admins").select("user_id,granted_at"),
    supabase.auth.admin.listUsers({ page: 1, perPage: 50 }),
    supabase.from("profiles").select("id, is_active, created_at, email_verified_at, whatsapp_verified_at"),
  ]);

  const superAdminIds = new Set((superAdmins ?? []).map(s => s.user_id));
  const profileById = new Map((profiles ?? []).map(p => [p.id, p]));
  const users = recentUsers?.users ?? [];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-400" /> Users & Roles
        </h1>
        <Button asChild>
          <Link href="/super-admin/users/new">
            <UserPlus className="w-4 h-4" /> Add User
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <h2 className="font-semibold text-sm">All Users</h2>
          <span className="text-xs text-muted-foreground">({users.length})</span>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="border-b">
              <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Email</th>
              <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">Created</th>
              <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">Last Sign In</th>
              <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Role</th>
              <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Status</th>
              <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Verification</th>
              <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const isSA = superAdminIds.has(user.id);
              const profile = profileById.get(user.id);
              const isActive = profile?.is_active ?? true;
              const verification = profile ? computeVerificationStatus(profile) : null;
              return (
                <tr key={user.id} className="border-b last:border-0 hover:bg-accent/50 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/super-admin/users/${user.id}`} className="hover:text-indigo-400 hover:underline transition-colors">
                      {user.email}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs hidden lg:table-cell">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-5 py-3">
                    {isSA ? (
                      <Badge variant="info" className="gap-1"><ShieldCheck className="w-3 h-3" /> Super Admin</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">User</span>
                    )}
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <Badge variant={isActive ? "success" : "destructive"}>{isActive ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    {!verification ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : verification.verified ? (
                      <span className="text-xs text-green-400">Verified</span>
                    ) : verification.locked ? (
                      <span className="text-xs text-red-400">Locked</span>
                    ) : (
                      <span className="text-xs text-amber-400">{verification.daysRemaining}d left</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <GrantSuperAdminButton userId={user.id} isSuperAdmin={isSA} isSelf={user.id === currentUser?.id} />
                      <ActivateToggleButton userId={user.id} isActive={isActive} isSelf={user.id === currentUser?.id} />
                      <VerifyButton userId={user.id} verified={verification?.verified ?? false} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </Card>
    </div>
  );
}
