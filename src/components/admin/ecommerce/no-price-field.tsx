"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { NO_PRICE_MODES, defaultLabel, resolveNoPrice, type NoPriceMode, type NoPriceSetting } from "@/lib/ecommerce/price-display";

/**
 * "When the price is blank, show…" picker. Used in Ecommerce → Settings (the
 * store default) and in the product editor (per product, with a Store
 * default option and a "Set Default" link beside each choice).
 */
export function NoPriceField({ value, onChange, storeDefault, onSetDefault, title = "When the price is blank" }: {
  value: NoPriceSetting | null | undefined;
  onChange: (v: NoPriceSetting | null) => void;
  /** Product editor only: the store default, offered as the first choice. */
  storeDefault?: NoPriceSetting | null;
  /** Product editor only: save a choice as the store default. */
  onSetDefault?: (v: NoPriceSetting) => Promise<void>;
  title?: string;
}) {
  const perProduct = storeDefault !== undefined;
  const store = resolveNoPrice(null, storeDefault);
  const [saving, setSaving] = useState<NoPriceMode | null>(null);
  const current = value?.mode ?? null;

  const setDefault = async (mode: NoPriceMode) => {
    if (!onSetDefault) return;
    setSaving(mode);
    await onSetDefault({ mode, label: value?.mode === mode ? value.label : undefined }).finally(() => setSaving(null));
  };

  const row = (key: string, active: boolean, label: string, hint: string, onPick: () => void, mode?: NoPriceMode) => (
    <div key={key} className={cn("flex items-start gap-2.5 rounded-lg border p-2.5", active ? "border-primary bg-primary/5" : "hover:bg-muted/50")}>
      <button type="button" onClick={onPick} className="flex-1 flex items-start gap-2.5 text-left">
        <span className={cn("mt-0.5 w-4 h-4 rounded-full border-2 shrink-0", active ? "border-primary bg-primary shadow-[inset_0_0_0_2px_hsl(var(--background))]" : "border-muted-foreground/40")} />
        <span>
          <span className="block text-sm font-medium">{label}</span>
          <span className="block text-xs text-muted-foreground">{hint}</span>
        </span>
      </button>
      {mode && onSetDefault && (
        store.mode === mode && storeDefault?.mode
          ? <span className="text-[11px] text-muted-foreground shrink-0 pt-0.5">Default</span>
          : <button type="button" onClick={() => setDefault(mode)} disabled={!!saving} className="text-[11px] text-primary underline underline-offset-2 shrink-0 pt-0.5 inline-flex items-center gap-1">
              {saving === mode && <Loader2 className="w-3 h-3 animate-spin" />}Set Default
            </button>
      )}
    </div>
  );

  const mode = current ?? (perProduct ? null : "whatsapp");
  return (
    <div className="space-y-2">
      <Label>{title}</Label>
      {perProduct && row("store", current === null, `Store default: ${store.mode === "zero" ? "Show price as 0" : store.label}`, "Follows Ecommerce → Settings.", () => onChange(null))}
      {NO_PRICE_MODES.map((m) => row(m.value, mode === m.value, m.label, m.hint, () => onChange({ mode: m.value, label: value?.mode === m.value ? value.label : undefined }), m.value))}
      {mode && mode !== "zero" && (
        <div className="space-y-1">
          <Label className="text-xs">Button text</Label>
          <Input value={value?.label ?? ""} onChange={(e) => onChange({ mode, label: e.target.value })} placeholder={defaultLabel(mode)} className="h-9" />
        </div>
      )}
    </div>
  );
}
