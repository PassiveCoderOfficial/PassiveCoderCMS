"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus, Trash2, Shield, Edit2, Check, X, Loader2 } from "lucide-react";
import { TransferSiteDialog } from "@/components/admin/transfer-site-dialog";
import { useT } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/locales/en";

type Role = "admin" | "editor" | "author";
interface Member {
  user_id: string;
  role: Role;
  joined_at: string;
  profiles: { email: string; full_name: string | null; avatar_url: string | null } | null;
}

const ROLE_COLORS: Record<Role, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  editor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  author: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const ROLE_GUIDE: { role: Role; labelKey: TranslationKey; descKey: TranslationKey }[] = [
  { role: "admin", labelKey: "usersPage.roleAdmin", descKey: "usersPage.roleAdminDesc" },
  { role: "editor", labelKey: "usersPage.roleEditor", descKey: "usersPage.roleEditorDesc" },
  { role: "author", labelKey: "usersPage.roleAuthor", descKey: "usersPage.roleAuthorDesc" },
];

export default function UsersPage() {
  const t = useT();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("editor");
  const [inviting, setInviting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<Role>("editor");

  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Server-resolved (subdomain-aware) rather than a tenant_members lookup:
      // a super admin has no membership row, so .single() returned HTTP 406 and
      // the Users page rendered empty — no members listed, nobody invitable —
      // on the very screen used to manage site access.
      const res = await fetch("/api/tenant/current");
      const { tenantId: currentTenantId } = await res.json().catch(() => ({ tenantId: null }));
      if (!currentTenantId) return;
      setTenantId(currentTenantId);
      loadMembers(currentTenantId);
    })();
  }, []);

  async function loadMembers(tid: string) {
    setLoading(true);
    // Two queries, not one embedded select: tenant_members.user_id references
    // auth.users, not profiles, so PostgREST has no FK path to walk for
    // `profiles(...)` — that embed returned HTTP 400 ("could not find a
    // relationship") on every load, which the earlier .single() 406 upstream
    // had been masking. Fetching profiles separately by id and merging
    // client-side is the standard workaround for embedding across two tables
    // that both reference a third rather than each other.
    const { data: rows } = await supabase
      .from("tenant_members")
      .select("user_id, role, joined_at")
      .eq("tenant_id", tid)
      .order("joined_at");

    const userIds = (rows ?? []).map(r => r.user_id);
    const { data: profileRows } = userIds.length
      ? await supabase.from("profiles").select("id, email, full_name, avatar_url").in("id", userIds)
      : { data: [] as { id: string; email: string; full_name: string | null; avatar_url: string | null }[] };
    const byId = new Map((profileRows ?? []).map(p => [p.id, p]));

    setMembers((rows ?? []).map(r => ({
      user_id: r.user_id,
      role: r.role as Role,
      joined_at: r.joined_at,
      profiles: byId.get(r.user_id)
        ? { email: byId.get(r.user_id)!.email, full_name: byId.get(r.user_id)!.full_name, avatar_url: byId.get(r.user_id)!.avatar_url }
        : null,
    })));
    setLoading(false);
  }

  async function invite() {
    if (!inviteEmail.trim() || !tenantId) return;
    setInviting(true);
    try {
      const res = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole, tenantId }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? t("usersPage.failed"));
      toast.success(t("usersPage.invitedEmail", { email: inviteEmail }));
      setInviteEmail("");
      loadMembers(tenantId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("usersPage.inviteFailed"));
    } finally {
      setInviting(false);
    }
  }

  async function updateRole(userId: string, role: Role) {
    if (!tenantId) return;
    const { error } = await supabase
      .from("tenant_members")
      .update({ role })
      .eq("tenant_id", tenantId)
      .eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    toast.success(t("usersPage.roleUpdated"));
    setEditingId(null);
    loadMembers(tenantId);
  }

  async function removeMember(userId: string) {
    if (!tenantId) return;
    if (!confirm(t("usersPage.removeConfirm"))) return;
    await supabase.from("tenant_members").delete().eq("tenant_id", tenantId).eq("user_id", userId);
    toast.success(t("usersPage.memberRemoved"));
    loadMembers(tenantId);
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">{t("usersPage.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("usersPage.subtitle")}</p>
      </div>

      {/* Ownership handover. Separate from the invite box below because it does
          something categorically different — invite grants access, this changes
          who the site belongs to. */}
      {tenantId && (
        <TransferSiteDialog tenantId={tenantId} onDone={() => loadMembers(tenantId)} />
      )}

      {/* Invite */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><UserPlus className="w-4 h-4" /> {t("usersPage.inviteTeamMember")}</h2>
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48">
            <Label className="text-xs mb-1 block">{t("usersPage.emailAddress")}</Label>
            <Input
              type="email"
              placeholder="colleague@example.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && invite()}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">{t("usersPage.role")}</Label>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as Role)}
            >
              <option value="admin">{t("usersPage.roleAdminFull")}</option>
              <option value="editor">{t("usersPage.roleEditorContent")}</option>
              <option value="author">{t("usersPage.roleAuthorPosts")}</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={invite} disabled={inviting || !inviteEmail.trim()}>
              {inviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
              {t("usersPage.sendInvite")}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t("usersPage.inviteHint")}</p>
      </div>

      {/* Role guide */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        {ROLE_GUIDE.map(({ role, labelKey, descKey }) => (
          <div key={role} className="rounded-lg border p-3 space-y-1 bg-card">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[role]}`}>{t(labelKey)}</span>
            <p className="text-xs text-muted-foreground mt-1">{t(descKey)}</p>
          </div>
        ))}
      </div>

      {/* Members list */}
      <div className="rounded-xl border overflow-hidden bg-card">
        <div className="bg-muted/50 px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("usersPage.currentMembers", { count: members.length })}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : members.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">{t("usersPage.noTeamMembersYet")}</div>
        ) : (
          <div className="divide-y">
            {members.map(m => {
              const profile = m.profiles;
              const initials = (profile?.full_name ?? profile?.email ?? "?").slice(0, 2).toUpperCase();
              return (
                <div key={m.user_id} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                      : initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{profile?.full_name ?? profile?.email ?? m.user_id}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                  </div>
                  {editingId === m.user_id ? (
                    <div className="flex items-center gap-2">
                      <select
                        className="h-8 rounded border border-input bg-background px-2 text-xs"
                        value={editRole}
                        onChange={e => setEditRole(e.target.value as Role)}
                      >
                        <option value="admin">{t("usersPage.roleAdmin")}</option>
                        <option value="editor">{t("usersPage.roleEditor")}</option>
                        <option value="author">{t("usersPage.roleAuthor")}</option>
                      </select>
                      <button onClick={() => updateRole(m.user_id, editRole)} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[m.role as Role] ?? ""}`}>
                        {t(ROLE_GUIDE.find(r => r.role === m.role)?.labelKey ?? "usersPage.roleEditor")}
                      </span>
                      <button onClick={() => { setEditingId(m.user_id); setEditRole(m.role as Role); }} className="text-muted-foreground hover:text-foreground">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => removeMember(m.user_id)} className="text-muted-foreground hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {t("usersPage.joined", { date: new Date(m.joined_at).toLocaleDateString() })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
