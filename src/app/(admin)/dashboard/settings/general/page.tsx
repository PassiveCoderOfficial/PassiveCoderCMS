"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Try membership first, fall back to owned tenant (super admin)
      let tenantId: string | null = null;
      const { data: membership } = await supabase.from("tenant_members").select("tenant_id").eq("user_id", user.id).single();
      if (membership?.tenant_id) {
        tenantId = membership.tenant_id;
      } else {
        const { data: owned } = await supabase.from("tenants").select("id").eq("owner_id", user.id)
          .order("created_at", { ascending: true }).limit(1).single();
        tenantId = owned?.id ?? null;
      }
      if (!tenantId) return;
      const { data } = await supabase.from("site_settings").select("*").eq("tenant_id", tenantId).single();
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
      <h1 className="text-2xl font-bold">General Settings</h1>

      <Card>
        <CardHeader><CardTitle className="text-sm">Site Identity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Site Name</Label>
            <Input value={settings.site_name as string ?? ""} onChange={(e) => update("site_name", e.target.value)} placeholder="My CMS Site" />
          </div>
          <div className="space-y-1.5">
            <Label>Site Description</Label>
            <Textarea value={settings.site_description as string ?? ""} onChange={(e) => update("site_description", e.target.value)} rows={3} placeholder="Brief description of your site" />
          </div>
          <div className="space-y-1.5">
            <Label>Site URL</Label>
            <Input value={settings.site_url as string ?? ""} onChange={(e) => update("site_url", e.target.value)} placeholder="https://yoursite.com" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">SEO Defaults</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Meta Title</Label>
            <Input value={settings.meta_title as string ?? ""} onChange={(e) => update("meta_title", e.target.value)} placeholder="Default page title" />
          </div>
          <div className="space-y-1.5">
            <Label>Meta Description</Label>
            <Textarea value={settings.meta_description as string ?? ""} onChange={(e) => update("meta_description", e.target.value)} rows={2} placeholder="Default meta description" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Maintenance</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>Maintenance Mode</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Show a maintenance page to visitors</p>
            </div>
            <Switch checked={!!settings.maintenance_mode} onCheckedChange={(v) => update("maintenance_mode", v)} />
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
