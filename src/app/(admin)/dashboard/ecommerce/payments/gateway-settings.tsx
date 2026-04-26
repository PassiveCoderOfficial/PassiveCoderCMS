"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Gateway {
  id: string;
  slug: string;
  is_test_mode: boolean;
  settings: Record<string, string>;
}

const GATEWAY_FIELDS: Record<string, Array<{ key: string; label: string; secret?: boolean }>> = {
  stripe: [
    { key: "publishable_key", label: "Publishable Key" },
    { key: "secret_key", label: "Secret Key", secret: true },
    { key: "webhook_secret", label: "Webhook Secret", secret: true },
  ],
  paypal: [
    { key: "client_id", label: "Client ID" },
    { key: "client_secret", label: "Client Secret", secret: true },
  ],
  sslcommerz: [
    { key: "store_id", label: "Store ID" },
    { key: "store_password", label: "Store Password", secret: true },
  ],
  shurjopay: [
    { key: "username", label: "Username" },
    { key: "password", label: "Password", secret: true },
    { key: "client_id", label: "Client ID" },
    { key: "client_secret", label: "Client Secret", secret: true },
  ],
  bkash: [
    { key: "app_key", label: "App Key" },
    { key: "app_secret", label: "App Secret", secret: true },
    { key: "username", label: "Username" },
    { key: "password", label: "Password", secret: true },
  ],
  nagad: [
    { key: "merchant_id", label: "Merchant ID" },
    { key: "merchant_private_key", label: "Merchant Private Key", secret: true },
  ],
  manual: [
    { key: "instructions", label: "Payment Instructions" },
    { key: "account_details", label: "Account Details" },
  ],
};

export function GatewaySettings({ gateway }: { gateway: Gateway }) {
  const [settings, setSettings] = useState<Record<string, string>>(gateway.settings ?? {});
  const [testMode, setTestMode] = useState(gateway.is_test_mode);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const fields = GATEWAY_FIELDS[gateway.slug] ?? [];

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("payment_gateways").update({ settings, is_test_mode: testMode }).eq("id", gateway.id);
    if (error) { toast.error("Failed to save settings"); setSaving(false); return; }
    toast.success("Settings saved");
    setSaving(false);
    router.refresh();
  };

  if (!fields.length) return null;

  return (
    <div className="space-y-3 pt-2 border-t">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm">Test Mode</Label>
          <p className="text-xs text-muted-foreground">Use sandbox/test credentials</p>
        </div>
        <Switch checked={testMode} onCheckedChange={setTestMode} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <Label className="text-xs">{field.label}</Label>
            <Input
              type={field.secret ? "password" : "text"}
              value={settings[field.key] ?? ""}
              onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
              className="h-8 text-xs"
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          </div>
        ))}
      </div>
      <Button size="sm" onClick={handleSave} disabled={saving} className="mt-2">
        {saving && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
        Save Settings
      </Button>
    </div>
  );
}
