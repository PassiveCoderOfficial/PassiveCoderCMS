"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function EcommerceSettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("ecommerce_settings").select("*").single().then(({ data }) => {
      if (data) setSettings(data);
    });
  }, []);

  const update = (key: string, value: unknown) => setSettings((s) => s ? { ...s, [key]: value } : s);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("ecommerce_settings").update(settings).eq("id", settings.id as string);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Settings saved");
  };

  if (!settings) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Ecommerce Settings</h1>

      <Card>
        <CardHeader><CardTitle className="text-sm">General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Ecommerce</Label>
            <Switch checked={!!settings.is_enabled} onCheckedChange={(v) => update("is_enabled", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Guest Checkout</Label>
            <Switch checked={!!settings.guest_checkout} onCheckedChange={(v) => update("guest_checkout", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Stock Management</Label>
            <Switch checked={!!settings.stock_management} onCheckedChange={(v) => update("stock_management", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Tax Inclusive Pricing</Label>
            <Switch checked={!!settings.tax_inclusive} onCheckedChange={(v) => update("tax_inclusive", v)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Currency</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Currency Code</Label>
              <Input value={settings.currency as string} onChange={(e) => update("currency", e.target.value)} placeholder="USD" />
            </div>
            <div className="space-y-1.5">
              <Label>Currency Symbol</Label>
              <Input value={settings.currency_symbol as string} onChange={(e) => update("currency_symbol", e.target.value)} placeholder="$" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Symbol Position</Label>
            <Select value={settings.currency_position as string} onValueChange={(v) => update("currency_position", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="before">Before (e.g. $100)</SelectItem>
                <SelectItem value="after">After (e.g. 100$)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tax Rate (%)</Label>
            <Input type="number" step="0.01" value={settings.tax_rate as number} onChange={(e) => update("tax_rate", parseFloat(e.target.value) || 0)} placeholder="0" />
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
