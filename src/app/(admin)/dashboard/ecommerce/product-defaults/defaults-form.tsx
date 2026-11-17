"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ExtendedEditor } from "../products/extended-editor";
import type { ProductExtended } from "@/lib/ecommerce/product-extended";

export function DefaultsForm({ tenantId, initial }: { tenantId: string; initial: ProductExtended }) {
  const [value, setValue] = useState<ProductExtended>(initial);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    const { error } = await createClient().from("site_settings").update({ product_defaults: value }).eq("tenant_id", tenantId);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Defaults saved");
  };
  return (
    <div className="space-y-4">
      <ExtendedEditor value={value} onChange={setValue} />
      <Button onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save defaults</Button>
    </div>
  );
}
