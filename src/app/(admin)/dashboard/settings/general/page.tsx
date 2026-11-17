"use client";

import { useEffect, useState } from "react";
import SettingsForm from "./settings-form";

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/tenant/settings")
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(() => {});
  }, []);

  if (!settings) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  return <SettingsForm initialSettings={settings} />;
}
