"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// ─── Major world currencies ────────────────────────────────────────────────────
const CURRENCIES = [
  { code: "USD", symbol: "$",  name: "US Dollar" },
  { code: "EUR", symbol: "€",  name: "Euro" },
  { code: "GBP", symbol: "£",  name: "British Pound" },
  { code: "BDT", symbol: "৳",  name: "Bangladeshi Taka" },
  { code: "INR", symbol: "₹",  name: "Indian Rupee" },
  { code: "PKR", symbol: "₨",  name: "Pakistani Rupee" },
  { code: "NPR", symbol: "₨",  name: "Nepalese Rupee" },
  { code: "LKR", symbol: "₨",  name: "Sri Lankan Rupee" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼",  name: "Saudi Riyal" },
  { code: "QAR", symbol: "﷼",  name: "Qatari Riyal" },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar" },
  { code: "BHD", symbol: ".د.ب", name: "Bahraini Dinar" },
  { code: "OMR", symbol: "﷼",  name: "Omani Rial" },
  { code: "JOD", symbol: "JD", name: "Jordanian Dinar" },
  { code: "EGP", symbol: "£",  name: "Egyptian Pound" },
  { code: "TRY", symbol: "₺",  name: "Turkish Lira" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  { code: "THB", symbol: "฿",  name: "Thai Baht" },
  { code: "PHP", symbol: "₱",  name: "Philippine Peso" },
  { code: "VND", symbol: "₫",  name: "Vietnamese Dong" },
  { code: "MMK", symbol: "K",  name: "Myanmar Kyat" },
  { code: "KHR", symbol: "៛",  name: "Cambodian Riel" },
  { code: "JPY", symbol: "¥",  name: "Japanese Yen" },
  { code: "CNY", symbol: "¥",  name: "Chinese Yuan" },
  { code: "KRW", symbol: "₩",  name: "South Korean Won" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "TWD", symbol: "NT$", name: "Taiwan Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr", name: "Danish Krone" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint" },
  { code: "RON", symbol: "lei", name: "Romanian Leu" },
  { code: "BGN", symbol: "лв", name: "Bulgarian Lev" },
  { code: "RUB", symbol: "₽",  name: "Russian Ruble" },
  { code: "UAH", symbol: "₴",  name: "Ukrainian Hryvnia" },
  { code: "ZAR", symbol: "R",  name: "South African Rand" },
  { code: "NGN", symbol: "₦",  name: "Nigerian Naira" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "GHS", symbol: "₵",  name: "Ghanaian Cedi" },
  { code: "MAD", symbol: "د.م.", name: "Moroccan Dirham" },
  { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling" },
  { code: "ETB", symbol: "Br", name: "Ethiopian Birr" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "$",  name: "Mexican Peso" },
  { code: "ARS", symbol: "$",  name: "Argentine Peso" },
  { code: "CLP", symbol: "$",  name: "Chilean Peso" },
  { code: "COP", symbol: "$",  name: "Colombian Peso" },
  { code: "PEN", symbol: "S/.", name: "Peruvian Sol" },
  { code: "UYU", symbol: "$U", name: "Uruguayan Peso" },
];

export default function EcommerceSettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("ecommerce_settings").select("*").single().then(({ data }) => {
      if (data) setSettings(data);
    });
  }, []);

  const update = (key: string, value: unknown) =>
    setSettings((s) => (s ? { ...s, [key]: value } : s));

  function handleCurrencyChange(code: string) {
    const cur = CURRENCIES.find((c) => c.code === code);
    if (!cur) return;
    update("currency", cur.code);
    update("currency_symbol", cur.symbol);
  }

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("ecommerce_settings")
      .update(settings)
      .eq("id", settings.id as string);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Settings saved");
  };

  if (!settings) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;

  const selectedCur = CURRENCIES.find((c) => c.code === (settings.currency as string));

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
          <div className="space-y-1.5">
            <Label>Base Currency</Label>
            <Select value={settings.currency as string} onValueChange={handleCurrencyChange}>
              <SelectTrigger>
                <SelectValue>
                  {selectedCur
                    ? `${selectedCur.symbol} ${selectedCur.code} — ${selectedCur.name}`
                    : (settings.currency as string)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto">
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="font-mono w-8 inline-block">{c.symbol}</span>
                    <span className="font-semibold mr-1">{c.code}</span>
                    <span className="text-muted-foreground text-xs">— {c.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Symbol auto-filled: <strong>{settings.currency_symbol as string}</strong> · Position:{" "}
              <strong>{settings.currency_position as string}</strong>
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Symbol Position</Label>
            <Select
              value={settings.currency_position as string}
              onValueChange={(v) => update("currency_position", v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="before">Before amount — e.g. {settings.currency_symbol as string}1,000</SelectItem>
                <SelectItem value="after">After amount — e.g. 1,000{settings.currency_symbol as string}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Tax Rate (%)</Label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={settings.tax_rate as number}
              onChange={(e) => update("tax_rate", parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
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
