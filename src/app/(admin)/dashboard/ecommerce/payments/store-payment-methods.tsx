"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { BANK_FIELDS_CLIENT } from "./bank-fields";

type Gateway = { slug: string; name: string; description: string | null; supported_currencies: string[] | null };
type Row = { gateway_slug: string; enabled: boolean; settings: Record<string, string>; sort_order: number };

const EDITABLE: Record<string, { key: string; label: string; multiline?: boolean }[]> = {
  bank_transfer: BANK_FIELDS_CLIENT,
  manual: [{ key: "instructions", label: "Payment instructions", multiline: true }, { key: "account_details", label: "Account details", multiline: true }],
  cod: [{ key: "note", label: "Note shown at checkout (optional)" }],
};

/**
 * This store's payment methods. Switches and details are saved per store
 * (tenant_payment_methods); the platform list only says which methods exist.
 * A store that never saved anything still sees what it offered before: every
 * live platform method except bank transfer.
 */
export function StorePaymentMethods({ tenantId, gateways, initialRows }: { tenantId: string; gateways: Gateway[]; initialRows: Row[] }) {
  const legacy = initialRows.length === 0;
  const [rows, setRows] = useState<Row[]>(() =>
    gateways.map((g, i) => initialRows.find((r) => r.gateway_slug === g.slug)
      ?? { gateway_slug: g.slug, enabled: legacy ? g.slug !== "bank_transfer" : false, settings: {}, sort_order: i }));
  const [saving, setSaving] = useState<string | null>(null);

  const persist = async (next: Row[], slug: string) => {
    setSaving(slug);
    const supabase = createClient();
    // Save every method on the first save, so the store's current offer is
    // kept exactly as shown when it switches from the platform defaults.
    const payload = next.map((r, i) => ({ tenant_id: tenantId, gateway_slug: r.gateway_slug, enabled: r.enabled, settings: r.settings, sort_order: i, updated_at: new Date().toISOString() }));
    const { error } = await supabase.from("tenant_payment_methods").upsert(payload, { onConflict: "tenant_id,gateway_slug" });
    setSaving(null);
    if (error) { toast.error("Could not save: " + error.message); return false; }
    toast.success("Saved");
    return true;
  };

  const toggle = async (slug: string, on: boolean) => {
    const next = rows.map((r) => (r.gateway_slug === slug ? { ...r, enabled: on } : r));
    setRows(next);
    if (!(await persist(next, slug))) setRows(rows);
  };
  const setField = (slug: string, key: string, v: string) =>
    setRows(rows.map((r) => (r.gateway_slug === slug ? { ...r, settings: { ...r.settings, [key]: v } } : r)));

  return (
    <div className="space-y-4">
      {gateways.map((g) => {
        const row = rows.find((r) => r.gateway_slug === g.slug)!;
        const fields = EDITABLE[g.slug];
        return (
          <Card key={g.slug}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{g.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{g.description}{g.supported_currencies?.length ? ` · ${g.supported_currencies.join(", ")}` : ""}</p>
                </div>
                <Switch checked={row.enabled} disabled={saving === g.slug} onCheckedChange={(v) => toggle(g.slug, v)} />
              </div>
            </CardHeader>
            {row.enabled && fields && (
              <CardContent className="pt-0 space-y-3 border-t">
                <div className="grid md:grid-cols-2 gap-3 pt-3">
                  {fields.map((f) => (
                    <div key={f.key} className={f.multiline ? "space-y-1 md:col-span-2" : "space-y-1"}>
                      <Label className="text-xs">{f.label}</Label>
                      {f.multiline
                        ? <Textarea rows={3} value={row.settings[f.key] ?? ""} onChange={(e) => setField(g.slug, f.key, e.target.value)} className="text-xs" />
                        : <Input value={row.settings[f.key] ?? ""} onChange={(e) => setField(g.slug, f.key, e.target.value)} className="h-8 text-xs" />}
                    </div>
                  ))}
                </div>
                <Button size="sm" disabled={saving === g.slug} onClick={() => persist(rows, g.slug)}>
                  {saving === g.slug && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />} Save details
                </Button>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
