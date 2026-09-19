"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ProfileWizard, type BusinessProfile } from "./profile-wizard";
import { useT } from "@/lib/i18n/language-provider";

export default function BusinessProfilePage() {
  const t = useT();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [enmProfileLink, setEnmProfileLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/business-profile")
      .then(r => r.json())
      .then(d => { setProfile(d.profile ?? null); setSeeded(!!d.seeded); setEnmProfileLink(d.enmProfileLink ?? null); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("bizProfile.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-xl">
          {t("bizProfile.subtitle")}
        </p>
      </div>

      {seeded && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 max-w-xl">
          {t("bizProfile.seededNotice")}
        </div>
      )}

      <ProfileWizard initial={profile} initialEnmProfileLink={enmProfileLink} />
    </div>
  );
}
