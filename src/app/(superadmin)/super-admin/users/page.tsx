import { createAdminClient, createClient } from "@/lib/supabase/server";
import { Users, ShieldCheck } from "lucide-react";
import GrantSuperAdminButton from "./grant-button";

export const metadata = { title: "Users & Roles — Super Admin" };

export default async function UsersPage() {
  const supabase = await createAdminClient();
  const authClient = await createClient();
  const { data: { user: currentUser } } = await authClient.auth.getUser();

  const [{ data: superAdmins }, { data: recentUsers }] = await Promise.all([
    supabase.from("super_admins").select("user_id,granted_at"),
    supabase.auth.admin.listUsers({ page: 1, perPage: 50 }),
  ]);

  const superAdminIds = new Set((superAdmins ?? []).map(s => s.user_id));
  const users = recentUsers?.users ?? [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Users className="w-6 h-6 text-purple-400" /> Users & Roles
      </h1>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <h2 className="font-semibold text-white text-sm">All Users</h2>
          <span className="text-xs text-gray-500">({users.length})</span>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-800">
              {["Email", "Created", "Last Sign In", "Role", "Actions"].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const isSA = superAdminIds.has(user.id);
              return (
                <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3 text-white">{user.email}</td>
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
                    <GrantSuperAdminButton userId={user.id} isSuperAdmin={isSA} isSelf={user.id === currentUser?.id} />
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
