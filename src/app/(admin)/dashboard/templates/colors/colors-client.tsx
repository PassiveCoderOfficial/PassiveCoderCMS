"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ColorPicker } from "@/components/ui/color-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { TemplatePalette } from "@/modules/themes/template-registry";

const TOKEN_LABELS: { key: keyof TemplatePalette; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "accent", label: "Accent" },
  { key: "background", label: "Background" },
  { key: "foreground", label: "Foreground" },
];

export function ColorsClient({
  basePalette,
  overrides,
}: {
  basePalette: TemplatePalette;
  overrides: Partial<TemplatePalette>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Partial<TemplatePalette>>(overrides);
  const [saving, setSaving] = useState(false);

  const effective = { ...basePalette, ...values };

  const setToken = (key: keyof TemplatePalette, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data: m } = await supabase.from("tenant_members").select("tenant_id").eq("user_id", user.id).eq("is_primary", true).maybeSingle();
    const tid = m?.tenant_id;
    if (!tid) { toast.error("No site found"); setSaving(false); return; }

    const { error } = await supabase.from("site_identity").upsert(
      { tenant_id: tid, color_overrides: Object.keys(values).length ? values : null, updated_at: new Date().toISOString() },
      { onConflict: "tenant_id" },
    );
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Colors saved");
    router.refresh();
  };

  const resetAll = async () => {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data: m } = await supabase.from("tenant_members").select("tenant_id").eq("user_id", user.id).eq("is_primary", true).maybeSingle();
    const tid = m?.tenant_id;
    if (!tid) { setSaving(false); return; }
    const { error } = await supabase.from("site_identity").update({ color_overrides: null, updated_at: new Date().toISOString() }).eq("tenant_id", tid);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setValues({});
    toast.success("Reset to template default");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-lg border p-4">
        {TOKEN_LABELS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div>
              <Label>{label}</Label>
              {values[key] && <p className="text-xs text-muted-foreground">Custom — overrides template default</p>}
            </div>
            <div className="w-40">
              <ColorPicker value={effective[key]} onChange={(v) => setToken(key, v)} allowAlpha={false} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Colors
        </Button>
        <Button variant="outline" onClick={resetAll} disabled={Object.keys(values).length === 0}>
          <RotateCcw className="w-4 h-4 mr-2" /> Reset to template default
        </Button>
      </div>
    </div>
  );
}
