"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, User, Lock } from "lucide-react";
import { useT } from "@/lib/i18n/language-provider";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
}

export default function ProfilePage() {
  const t = useT();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, role")
        .eq("id", user.id)
        .single();
      if (data) {
        setProfile(data as Profile);
        setFullName(data.full_name ?? "");
        setAvatarUrl(data.avatar_url ?? "");
      }
      setLoading(false);
    })();
  }, []);

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() || null, avatar_url: avatarUrl.trim() || null })
      .eq("id", profile.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success(t("profile.profileSaved"));
  }

  async function changePassword() {
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error(t("profile.passwordsDontMatch"));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t("profile.passwordMin8"));
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) toast.error(error.message);
    else {
      toast.success(t("profile.passwordUpdated"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> {t("profile.loading")}
      </div>
    );
  }

  if (!profile) {
    return <div className="p-6 text-sm text-muted-foreground">{t("profile.couldNotLoad")}</div>;
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("profile.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("profile.subtitle")}</p>
      </div>

      {/* Profile info */}
      <div className="rounded-xl border bg-card p-5 space-y-5">
        <div className="flex items-center gap-3 pb-1">
          <User className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">{t("profile.accountInformation")}</h2>
        </div>

        <div className="space-y-1.5">
          <Label>{t("profile.email")}</Label>
          <Input value={profile.email} disabled className="opacity-60" />
          <p className="text-xs text-muted-foreground">{t("profile.emailCannotBeChanged")}</p>
        </div>

        <div className="space-y-1.5">
          <Label>{t("profile.fullName")}</Label>
          <Input
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder={t("profile.fullNamePlaceholder")}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("profile.avatarUrl")} <span className="text-muted-foreground text-xs">{t("profile.optional")}</span></Label>
          <Input
            value={avatarUrl}
            onChange={e => setAvatarUrl(e.target.value)}
            placeholder="https://..."
          />
          {avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Avatar preview" className="w-12 h-12 rounded-full object-cover mt-2 border" />
          )}
        </div>

        <div className="space-y-1.5">
          <Label>{t("profile.role")}</Label>
          <Input value={profile.role} disabled className="opacity-60 capitalize" />
        </div>

        <Button onClick={saveProfile} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {t("profile.saveChanges")}
        </Button>
      </div>

      {/* Password change */}
      <div className="rounded-xl border bg-card p-5 space-y-5">
        <div className="flex items-center gap-3 pb-1">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">{t("profile.changePassword")}</h2>
        </div>

        <div className="space-y-1.5">
          <Label>{t("profile.newPassword")}</Label>
          <Input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder={t("profile.min8Chars")}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("profile.confirmNewPassword")}</Label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder={t("profile.repeatNewPassword")}
          />
        </div>

        <Button onClick={changePassword} disabled={changingPassword} variant="outline">
          {changingPassword && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {t("profile.updatePassword")}
        </Button>
      </div>
    </div>
  );
}
