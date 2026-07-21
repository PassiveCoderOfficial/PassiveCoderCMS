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
import ResetPasswordButton from "../reset-password-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  function statusVariant(status: string) {
    if (status === "active") return "success" as const;
    if (status === "onboarded") return "info" as const;
    if (status === "trial") return "warning" as const;
    if (status === "suspended") return "destructive" as const;
    return "secondary" as const;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/super-admin/users" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <User className="w-5 h-5 text-purple-400" />
        <h1 className="text-2xl font-bold">{profile?.full_name || user.email}</h1>
        {isSA && (
          <Badge variant="info" className="gap-1"><ShieldCheck className="w-3 h-3" /> Super Admin</Badge>
        )}
        <Badge variant={isActive ? "success" : "destructive"}>{isActive ? "Active" : "Inactive"}</Badge>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <GrantSuperAdminButton userId={user.id} isSuperAdmin={isSA} isSelf={user.id === currentUser?.id} />
        <ActivateToggleButton userId={user.id} isActive={isActive} isSelf={user.id === currentUser?.id} />
        <VerifyButton userId={user.id} verified={verification?.verified ?? false} />
        <ResetPasswordButton userId={user.id} email={user.email ?? ""} />
      </div>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /> Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Email</p>
              <p>{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Full Name</p>
              <p>{profile?.full_name ?? <span className="text-muted-foreground">—</span>}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Created</p>
              <p>{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Last Sign In</p>
              <p>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : "Never"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Verification</p>
              {!verification ? (
                <p className="text-muted-foreground">—</p>
              ) : verification.verified ? (
                <p className="text-green-400">Verified</p>
              ) : verification.locked ? (
                <p className="text-red-400">Locked (grace period expired)</p>
              ) : (
                <p className="text-amber-400">{verification.daysRemaining} day(s) left to verify</p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">User ID</p>
              <p className="text-muted-foreground font-mono text-xs">{user.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Associated websites */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Globe className="w-4 h-4 text-muted-foreground" /> Associated Websites</CardTitle>
        </CardHeader>
        <CardContent>
          {memberships?.length ? (
            <div className="space-y-2">
              {memberships.map((m, i) => {
                const tenant = (Array.isArray(m.tenants) ? m.tenants[0] : m.tenants) as
                  { id: string; name: string; slug: string; custom_domain: string | null; status: string } | null;
                if (!tenant) return null;
                const siteUrl = tenant.custom_domain ? `${PROTO}://${tenant.custom_domain}` : `${PROTO}://${tenant.slug}.${ROOT}`;
                return (
                  <div key={tenant.id ?? i} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div>
                        <Link href={`/super-admin/sites/${tenant.id}`} className="hover:text-indigo-400 hover:underline">
                          {tenant.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{tenant.slug}.{ROOT}</p>
                      </div>
                      <Badge variant={statusVariant(tenant.status)}>{tenant.status}</Badge>
                      <Badge variant="secondary" className="capitalize">{m.role}</Badge>
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
            <p className="text-xs text-muted-foreground">No associated websites.</p>
          )}
        </CardContent>
      </Card>

      {isSA && superAdmin?.granted_at && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /> Super Admin Since</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{new Date(superAdmin.granted_at).toLocaleDateString()}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
