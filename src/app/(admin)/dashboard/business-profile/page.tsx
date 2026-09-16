"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ProfileWizard, type BusinessProfile } from "./profile-wizard";

export default function BusinessProfilePage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/business-profile")
      .then(r => r.json())
      .then(d => { setProfile(d.profile ?? null); setSeeded(!!d.seeded); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Business profile</h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-xl">
          Tell us about your business once. We use it to write your website
          content, fill in your contact and services sections, and create your
          ExpertNear.Me listing. Nothing is published without you.
        </p>
      </div>

      {seeded && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 max-w-xl">
          Pre-filled from your live site — check it over and edit anything before continuing.
        </div>
      )}

      <ProfileWizard initial={profile} />
    </div>
  );
}
