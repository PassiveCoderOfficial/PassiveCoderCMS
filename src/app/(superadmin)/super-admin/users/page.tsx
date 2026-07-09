import { createAdminClient, createClient } from "@/lib/supabase/server";
import { computeVerificationStatus } from "@/lib/verification";
import { Users, ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import GrantSuperAdminButton from "./grant-button";
import ActivateToggleButton from "./activate-button";

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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-400" /> Users & Roles
        </h1>
        <Link href="/super-admin/users/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors">
          <UserPlus className="w-4 h-4" /> Add User
        </Link>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <h2 className="font-semibold text-white text-sm">All Users</h2>
          <span className="text-xs text-gray-500">({users.length})</span>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-800">
              {["Email", "Created", "Last Sign In", "Role", "Status", "Verification", "Actions"].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const isSA = superAdminIds.has(user.id);
              const profile = profileById.get(user.id);
              const isActive = profile?.is_active ?? true;
              const verification = profile ? computeVerificationStatus(profile) : null;
              return (
                <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/super-admin/users/${user.id}`} className="text-white hover:text-indigo-400 hover:underline transition-colors">
                      {user.email}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-5 py-3">
                    {isSA ? (
                      <span className="inline-flex items-center gap-1 bg-indigo-900/50 text-indigo-400 text-xs font-medium px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" /> Super Admin
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">User</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 bg-green-900/30 text-green-400 text-xs font-medium px-2 py-0.5 rounded-full">Active</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-red-900/30 text-red-400 text-xs font-medium px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {!verification ? (
                      <span className="text-xs text-gray-500">—</span>
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
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
