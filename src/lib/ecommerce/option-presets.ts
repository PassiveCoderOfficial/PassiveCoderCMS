/**
 * Reusable option types ("Size: 25ml, 50ml, 100ml") per store, in
 * product_option_presets. Shared by the product editor's "Add from preset"
 * and the Product Defaults page's preset manager. One preset per name per
 * store: saving a name that exists updates it instead of adding a copy.
 */
import { createClient } from "@/lib/supabase/client";
import { generateId } from "@/lib/utils";
import type { OptionDisplay, OptionValue, ProductOption } from "./variations";

export type OptionPreset = { id: string; name: string; option: ProductOption };

const DISPLAYS: OptionDisplay[] = ["buttons", "swatches", "dropdown"];

/** Tolerate malformed rows (missing values, string values, bad display). */
export function normalizePreset(row: { id: string; name?: string | null; option?: unknown }): OptionPreset {
  const o = (row.option && typeof row.option === "object" ? row.option : {}) as Partial<ProductOption> & { values?: unknown };
  const rawValues: unknown[] = Array.isArray(o.values) ? (o.values as unknown[]) : [];
  const values: OptionValue[] = rawValues
    .map((v): OptionValue | null => {
      if (typeof v === "string") return v.trim() ? { id: generateId(), label: v.trim() } : null;
      if (!v || typeof v !== "object") return null;
      const x = v as Partial<OptionValue>;
      const label = String(x.label ?? "").trim();
      if (!label) return null;
      return {
        id: x.id || generateId(), label,
        ...(x.color ? { color: x.color } : {}),
        ...(x.image ? { image: x.image } : {}),
        ...(typeof x.priceDelta === "number" && Number.isFinite(x.priceDelta) ? { priceDelta: x.priceDelta } : {}),
      };
    })
    .filter((v): v is OptionValue => !!v);
  const name = String(row.name || o.name || "Option").trim() || "Option";
  return {
    id: row.id, name,
    option: { id: o.id || generateId(), name, display: DISPLAYS.includes(o.display as OptionDisplay) ? (o.display as OptionDisplay) : "buttons", values },
  };
}

/** Label for pickers: "Size (25ml, 50ml, 100ml)" or "Size (no values)". */
export const presetLabel = (p: OptionPreset) =>
  `${p.name} (${p.option.values.length ? p.option.values.map((v) => v.label).join(", ") : "no values"})`;

/** A copy of the preset's option with fresh ids, ready to add to a product. */
export const presetToOption = (p: OptionPreset): ProductOption => ({
  ...p.option, id: generateId(), name: p.name, values: p.option.values.map((v) => ({ ...v, id: generateId() })),
});

export async function listPresets(tenantId: string): Promise<OptionPreset[]> {
  const { data, error } = await createClient().from("product_option_presets").select("id, name, option").eq("tenant_id", tenantId).order("name");
  if (error) throw error;
  return (data ?? []).map(normalizePreset);
}

/**
 * Save an option as a preset. Same name (any case) = update that preset, so
 * clicking "Save as preset" twice never makes duplicates. With `id`, that
 * preset is updated (renames included). Throws a readable error when the
 * option has no values.
 */
export async function savePreset(tenantId: string, option: ProductOption, id?: string): Promise<OptionPreset> {
  const name = option.name.trim();
  if (!name) throw new Error("Give the option a name first (for example Size).");
  const values = option.values.filter((v) => v.label.trim());
  if (!values.length) throw new Error(`Add at least one value to "${name}" before saving it as a preset.`);
  const clean: ProductOption = { id: option.id || generateId(), name, display: option.display, values };
  const sb = createClient();
  let targetId = id;
  if (!targetId) {
    const { data: same } = await sb.from("product_option_presets").select("id, name").eq("tenant_id", tenantId);
    targetId = (same ?? []).find((r) => String(r.name ?? "").trim().toLowerCase() === name.toLowerCase())?.id;
  }
  const res = targetId
    ? await sb.from("product_option_presets").update({ name, option: clean }).eq("id", targetId).eq("tenant_id", tenantId).select("id, name, option").single()
    : await sb.from("product_option_presets").insert({ tenant_id: tenantId, name, option: clean }).select("id, name, option").single();
  if (res.error) throw res.error;
  return normalizePreset(res.data);
}

export async function deletePreset(tenantId: string, id: string): Promise<void> {
  const { error } = await createClient().from("product_option_presets").delete().eq("id", id).eq("tenant_id", tenantId);
  if (error) throw error;
}
