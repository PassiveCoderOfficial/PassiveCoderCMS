"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { CURRENCIES, PRIORITY_CURRENCIES, OTHER_CURRENCIES } from "@/lib/currency/currencies";

const TIMEZONES = [
  "UTC", "Asia/Dhaka", "Asia/Kolkata", "Asia/Karachi", "Asia/Dubai", "Asia/Riyadh",
  "Asia/Singapore", "Asia/Kuala_Lumpur", "Asia/Jakarta", "Asia/Bangkok", "Asia/Manila",
  "Asia/Tokyo", "Asia/Shanghai", "Asia/Hong_Kong", "Asia/Seoul",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow", "Europe/Istanbul",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Sao_Paulo", "America/Mexico_City", "Australia/Sydney", "Pacific/Auckland",
  "Africa/Lagos", "Africa/Cairo", "Africa/Johannesburg", "Africa/Nairobi",
];

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "bn", name: "Bengali (বাংলা)" },
  { code: "hi", name: "Hindi (हिन्दी)" },
  { code: "ur", name: "Urdu (اردو)" },
  { code: "ar", name: "Arabic (العربية)" },
  { code: "es", name: "Spanish (Español)" },
  { code: "fr", name: "French (Français)" },
  { code: "de", name: "German (Deutsch)" },
  { code: "pt", name: "Portuguese (Português)" },
  { code: "zh", name: "Chinese (中文)" },
  { code: "ja", name: "Japanese (日本語)" },
  { code: "id", name: "Indonesian" },
  { code: "ms", name: "Malay" },
];

interface SettingsFormProps {
  initialSettings: Record<string, unknown>;
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: unknown) => setSettings(s => ({ ...s, [key]: value }));

  function handleCurrencyChange(code: string) {
    const cur = CURRENCIES.find((c) => c.code === code);
    if (!cur) return;
    setSettings((s) => ({ ...s, currency: cur.code, currency_symbol: cur.symbol }));
  }

  const selectedCur = CURRENCIES.find((c) => c.code === (settings.currency as string));

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
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Regional</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Select value={settings.timezone as string ?? "UTC"} onValueChange={(v) => update("timezone", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto">
                {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Used for dates, orders, and reports.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Language</Label>
            <Select value={settings.language as string ?? "en"} onValueChange={(v) => update("language", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
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
        <CardHeader>
          <CardTitle className="text-sm">Base Currency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Site-wide currency used across the <strong>ecommerce store</strong> and the{" "}
            <strong>accounting system</strong>. Product prices, cart, checkout, orders, and all
            financial figures use this currency.
          </p>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={settings.currency as string ?? "USD"} onValueChange={handleCurrencyChange}>
              <SelectTrigger>
                <SelectValue>
                  {selectedCur
                    ? `${selectedCur.symbol} ${selectedCur.code} — ${selectedCur.name}`
                    : (settings.currency as string ?? "USD")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto">
                {PRIORITY_CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="font-mono w-8 inline-block">{c.symbol}</span>
                    <span className="font-semibold mr-1">{c.code}</span>
                    <span className="text-muted-foreground text-xs">— {c.name}</span>
                  </SelectItem>
                ))}
                <div className="my-1 border-t" role="separator" />
                {OTHER_CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="font-mono w-8 inline-block">{c.symbol}</span>
                    <span className="font-semibold mr-1">{c.code}</span>
                    <span className="text-muted-foreground text-xs">— {c.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Symbol: <strong>{settings.currency_symbol as string ?? "$"}</strong>
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Symbol Position</Label>
            <Select
              value={settings.currency_position as string ?? "before"}
              onValueChange={(v) => update("currency_position", v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="before">Before — {settings.currency_symbol as string ?? "$"}1,000</SelectItem>
                <SelectItem value="after">After — 1,000{settings.currency_symbol as string ?? "$"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Auto Translate</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>Google Translate widget</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Adds a small floating language switcher so visitors can auto-translate the site into their own language.
              </p>
            </div>
            <Switch checked={!!settings.auto_translate_enabled} onCheckedChange={(v) => update("auto_translate_enabled", v)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Maintenance</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Maintenance Mode</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Show a maintenance page to visitors (you stay able to preview while logged in)</p>
            </div>
            <Switch checked={!!settings.maintenance_mode} onCheckedChange={(v) => update("maintenance_mode", v)} />
          </div>

          {!!settings.maintenance_mode && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-1.5">
                <Label>Maintenance Title</Label>
                <Input
                  value={settings.maintenance_title as string ?? ""}
                  onChange={(e) => update("maintenance_title", e.target.value)}
                  placeholder="We'll be back soon!"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Maintenance Message</Label>
                <Textarea
                  value={settings.maintenance_message as string ?? ""}
                  onChange={(e) => update("maintenance_message", e.target.value)}
                  rows={3}
                  placeholder="Our site is currently undergoing scheduled maintenance. We'll be back online shortly."
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Save Settings
      </Button>
    </div>
  );
}
