"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SettingsFormProps {
  initialSettings: Record<string, unknown>;
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: unknown) => setSettings(s => ({ ...s, [key]: value }));

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/tenant/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? "Failed to save");
    } else {
      toast.success("Settings saved");
    }
  };

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
