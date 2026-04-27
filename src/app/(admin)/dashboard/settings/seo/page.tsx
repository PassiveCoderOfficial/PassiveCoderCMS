"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function SeoSettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: membership } = await supabase.from("tenant_members").select("tenant_id").eq("user_id", user.id).single();
      if (!membership) return;
      const { data } = await supabase.from("site_settings").select("*").eq("tenant_id", membership.tenant_id).single();
      if (data) setSettings(data);
    })();
  }, []);

  const update = (key: string, value: unknown) => setSettings((s) => s ? { ...s, [key]: value } : s);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("site_settings").update(settings).eq("id", settings.id as string);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Settings saved");
  };

  if (!settings) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">SEO Settings</h1>

      <Card>
        <CardHeader><CardTitle className="text-sm">Default Meta Tags</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Default Meta Title</Label>
            <Input value={settings.meta_title as string ?? ""} onChange={(e) => update("meta_title", e.target.value)} placeholder="My Site - Page Title" />
            <p className="text-xs text-muted-foreground">Used when a page doesn&apos;t have its own SEO title</p>
          </div>
          <div className="space-y-1.5">
            <Label>Default Meta Description</Label>
            <Textarea value={settings.meta_description as string ?? ""} onChange={(e) => update("meta_description", e.target.value)} rows={3} placeholder="Default description for search engines" />
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Save Settings
      </Button>
    </div>
  );
}
