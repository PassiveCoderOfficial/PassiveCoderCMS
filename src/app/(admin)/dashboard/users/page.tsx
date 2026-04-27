"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus, Trash2, Shield, Edit2, Check, X, Loader2 } from "lucide-react";

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

export default function UsersPage() {
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
      const { data: membership } = await supabase
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();
      if (!membership) return;
      setTenantId(membership.tenant_id);
      loadMembers(membership.tenant_id);
    })();
  }, []);

  async function loadMembers(tid: string) {
    setLoading(true);
    const { data } = await supabase
      .from("tenant_members")
      .select("user_id, role, joined_at, profiles(email, full_name, avatar_url)")
      .eq("tenant_id", tid)
      .order("joined_at");
    setMembers((data as unknown as Member[]) ?? []);
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
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(`Invited ${inviteEmail}`);
      setInviteEmail("");
      loadMembers(tenantId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invite failed");
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
    toast.success("Role updated");
    setEditingId(null);
    loadMembers(tenantId);
  }

  async function removeMember(userId: string) {
    if (!tenantId) return;
    if (!confirm("Remove this team member?")) return;
    await supabase.from("tenant_members").delete().eq("tenant_id", tenantId).eq("user_id", userId);
    toast.success("Member removed");
    loadMembers(tenantId);
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Team Members</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage staff access to your site dashboard.</p>
      </div>

      {/* Invite */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><UserPlus className="w-4 h-4" /> Invite Team Member</h2>
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48">
            <Label className="text-xs mb-1 block">Email address</Label>
            <Input
              type="email"
              placeholder="colleague@example.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && invite()}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Role</Label>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as Role)}
            >
              <option value="admin">Admin — full access</option>
              <option value="editor">Editor — content only</option>
              <option value="author">Author — posts only</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={invite} disabled={inviting || !inviteEmail.trim()}>
              {inviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Send Invite
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">They'll receive an email to set up their account. You can change their role anytime.</p>
      </div>

      {/* Role guide */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        {([["admin", "Full dashboard access. Can manage team, settings, and all content."],
           ["editor", "Can edit all content sections. Cannot manage team or settings."],
           ["author", "Can create and edit posts only."]] as [Role, string][]).map(([role, desc]) => (
          <div key={role} className="rounded-lg border p-3 space-y-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[role]}`}>{role}</span>
            <p className="text-xs text-muted-foreground mt-1">{desc}</p>
          </div>
        ))}
      </div>

      {/* Members list */}
      <div className="rounded-xl border overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Current Members ({members.length})
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : members.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">No team members yet.</div>
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
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="author">Author</option>
                      </select>
                      <button onClick={() => updateRole(m.user_id, editRole)} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[m.role as Role] ?? ""}`}>
                        {m.role}
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
                    Joined {new Date(m.joined_at).toLocaleDateString()}
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
