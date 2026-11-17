"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getClientTenantId } from "@/lib/tenant/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NoPriceField } from "./no-price-field";
import type { NoPriceSetting } from "@/lib/ecommerce/price-display";

/** Ecommerce → Settings: what products without a price show (store default). */
export function StoreNoPriceCard() {
  const [tid, setTid] = useState<string | null>(null);
  const [defaults, setDefaults] = useState<Record<string, unknown> | null>(null);
  const [value, setValue] = useState<NoPriceSetting | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getClientTenantId().then((id) => {
      setTid(id);
      if (!id) return;
      createClient().from("site_settings").select("product_defaults").eq("tenant_id", id).maybeSingle().then(({ data }) => {
        const d = (data?.product_defaults ?? {}) as Record<string, unknown>;
        setDefaults(d);
        setValue((d.noPrice as NoPriceSetting | undefined) ?? { mode: "whatsapp" });
      });
    });
  }, []);

  if (!tid || !defaults) return null;
  const save = async () => {
    setSaving(true);
    const next = { ...defaults, noPrice: value ?? { mode: "whatsapp" } };
    const { error } = await createClient().from("site_settings").update({ product_defaults: next }).eq("tenant_id", tid);
    setSaving(false);
    if (error) toast.error(error.message); else { setDefaults(next); toast.success("Saved"); }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Products without a price</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">Leave a product&apos;s price blank to show this instead. Each product can choose differently in its Pricing section.</p>
        <NoPriceField value={value} onChange={(v) => setValue(v ?? { mode: "whatsapp" })} title="Show" />
        <Button size="sm" onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save</Button>
      </CardContent>
    </Card>
  );
}
