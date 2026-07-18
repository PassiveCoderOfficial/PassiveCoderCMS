import { createAdminClient, createClient } from "@/lib/supabase/server";
import { computeVerificationStatus } from "@/lib/verification";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  User, ArrowLeft, ExternalLink, ShieldCheck, Globe, Mail, Calendar,
} from "lucide-react";
import GrantSuperAdminButton from "../grant-button";
import ActivateToggleButton from "../activate-button";
import VerifyButton from "../verify-button";

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
const PROTO = ROOT.includes("localhost") ? "http" : "https";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await createAdminClient();
  const authClient = await createClient();
  const { data: { user: currentUser } } = await authClient.auth.getUser();

  const [{ data: authUser }, { data: profile }, { data: superAdmin }, { data: memberships }] = await Promise.all([
    admin.auth.admin.getUserById(id),
    admin.from("profiles").select("id, full_name, is_active, created_at, email_verified_at, whatsapp_verified_at").eq("id", id).maybeSingle(),
    admin.from("super_admins").select("granted_at").eq("user_id", id).maybeSingle(),
    admin.from("tenant_members").select("role, joined_at, tenants(id, name, slug, custom_domain, status)").eq("user_id", id),
  ]);

  const user = authUser?.user;
  if (!user) notFound();

  const isSA = !!superAdmin;
  const isActive = profile?.is_active ?? true;
  const verification = profile ? computeVerificationStatus(profile) : null;

  const STATUS_COLOR: Record<string, string> = {
    active: "bg-green-900/50 text-green-400",
    onboarded: "bg-blue-900/50 text-blue-400",
    trial: "bg-amber-900/50 text-amber-400",
    suspended: "bg-red-900/50 text-red-400",
    cancelled: "bg-gray-800 text-gray-400",
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/super-admin/users" className="text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <User className="w-5 h-5 text-purple-400" />
        <h1 className="text-2xl font-bold text-white">{profile?.full_name || user.email}</h1>
        {isSA && (
          <span className="inline-flex items-center gap-1 bg-indigo-900/50 text-indigo-400 text-xs font-medium px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3" /> Super Admin
          </span>
        )}
        {isActive ? (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-900/30 text-green-400">Active</span>
        ) : (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-900/30 text-red-400">Inactive</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <GrantSuperAdminButton userId={user.id} isSuperAdmin={isSA} isSelf={user.id === currentUser?.id} />
        <ActivateToggleButton userId={user.id} isActive={isActive} isSelf={user.id === currentUser?.id} />
        <VerifyButton userId={user.id} verified={verification?.verified ?? false} />
      </div>

      {/* Account info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /> Account Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Email</p>
            <p className="text-gray-200">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Full Name</p>
            <p className="text-gray-200">{profile?.full_name ?? <span className="text-gray-600">—</span>}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Created</p>
            <p className="text-gray-200">{new Date(user.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Last Sign In</p>
            <p className="text-gray-200">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : "Never"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Verification</p>
            {!verification ? (
              <p className="text-gray-600">—</p>
            ) : verification.verified ? (
              <p className="text-green-400">Verified</p>
            ) : verification.locked ? (
              <p className="text-red-400">Locked (grace period expired)</p>
            ) : (
              <p className="text-amber-400">{verification.daysRemaining} day(s) left to verify</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">User ID</p>
            <p className="text-gray-500 font-mono text-xs">{user.id}</p>
          </div>
        </div>
      </div>

      {/* Associated websites */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Globe className="w-4 h-4 text-gray-400" /> Associated Websites</h2>
        {memberships?.length ? (
          <div className="space-y-2">
            {memberships.map((m, i) => {
              const tenant = (Array.isArray(m.tenants) ? m.tenants[0] : m.tenants) as
                { id: string; name: string; slug: string; custom_domain: string | null; status: string } | null;
              if (!tenant) return null;
              const siteUrl = tenant.custom_domain ? `${PROTO}://${tenant.custom_domain}` : `${PROTO}://${tenant.slug}.${ROOT}`;
              return (
                <div key={tenant.id ?? i} className="flex items-center justify-between text-sm border border-gray-800 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-3">
                    <div>
                      <Link href={`/super-admin/sites/${tenant.id}`} className="text-gray-200 hover:text-indigo-400 hover:underline">
                        {tenant.name}
                      </Link>
                      <p className="text-xs text-gray-500">{tenant.slug}.{ROOT}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[tenant.status] ?? STATUS_COLOR.cancelled}`}>
                      {tenant.status}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded capitalize">{m.role}</span>
                  </div>
                  <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                    Visit Site <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-600">No associated websites.</p>
        )}
      </div>

      {isSA && superAdmin?.granted_at && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-1">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /> Super Admin Since</h2>
          <p className="text-sm text-gray-300">{new Date(superAdmin.granted_at).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}
