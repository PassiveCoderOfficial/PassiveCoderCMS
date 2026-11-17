"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { FormAlert, FormField } from "@/components/site/form-field";
import { checkAddress, checkName, checkPhone } from "@/lib/validation/customer";
import { saveAddressAction, type SavedAddress } from "@/app/(site)/account/actions";
import { BD_DISTRICTS, BD_LOCATIONS } from "@/lib/donors/bd-locations";

export type AddressDraft = Omit<SavedAddress, "id"> & { id?: string };
export const EMPTY_ADDRESS: AddressDraft = { label: "Home", full_name: "", phone: "", address_line1: "", area: "", city: "", postal_code: "", is_default: false };
const LABELS = ["Home", "Office", "Other"];

/**
 * Add / edit one saved address. `areas` (the store's delivery areas) turns
 * the area into a picker so the delivery charge can be worked out from it.
 * `bd` (marketplace stores) asks for district + thana instead, which prices
 * each seller's parcel by distance.
 */
export function AddressForm({ initial = EMPTY_ADDRESS, areas = [], bd = false, onSaved, onCancel }: {
  initial?: AddressDraft;
  areas?: string[];
  bd?: boolean;
  onSaved: (id: string) => void;
  onCancel?: () => void;
}) {
  const [a, setA] = useState<AddressDraft>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<AddressDraft>) => setA({ ...a, ...patch });
  const errs = {
    name: checkName(a.full_name),
    phone: checkPhone(a.phone),
    address: checkAddress(a.address_line1),
    area: bd ? (!a.district ? "Choose your district so we can work out delivery" : null)
      : areas.length && !a.area ? "Choose your area so we can work out delivery" : null,
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    if (Object.values(errs).some(Boolean)) return;
    setBusy(true);
    const r = await saveAddressAction(a);
    setBusy(false);
    if (r.error || !r.id) return setError(r.error ?? "Couldn't save this address.");
    onSaved(r.id);
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-1.5">Save as</p>
        <div className="flex flex-wrap gap-2">
          {LABELS.map((l) => (
            <button key={l} type="button" onClick={() => set({ label: l })}
              className={`h-9 px-4 rounded-full border text-sm ${a.label === l ? "border-primary bg-primary/10 text-primary font-semibold" : "hover:border-primary"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Full name" required value={a.full_name} onChange={(v) => set({ full_name: v })} error={errs.name} showError={submitted} autoComplete="name" />
        <FormField label="Mobile number" required type="tel" inputMode="tel" value={a.phone} onChange={(v) => set({ phone: v })} error={errs.phone} showError={submitted} autoComplete="tel" placeholder="01712345678" />
      </div>
      <FormField label="Address" required multiline value={a.address_line1} onChange={(v) => set({ address_line1: v })} error={errs.address} showError={submitted}
        autoComplete="street-address" placeholder="House, road, block / village, thana" />
      <div className="grid sm:grid-cols-2 gap-4">
        {bd ? (
          <>
            <div>
              <label className="block text-sm font-medium mb-1.5">District <span className="text-destructive">*</span></label>
              <select value={a.district ?? ""} onChange={(e) => set({ district: e.target.value, thana: "", city: e.target.value, area: e.target.value })}
                className={`w-full h-11 rounded-xl border bg-background px-3 text-sm ${submitted && errs.area ? "border-destructive" : ""}`}>
                <option value="">Choose district</option>
                {BD_DISTRICTS.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
              {submitted && errs.area && <p className="mt-1.5 text-xs text-destructive">{errs.area}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Thana / upazila</label>
              <select value={a.thana ?? ""} onChange={(e) => set({ thana: e.target.value, area: e.target.value || a.district || "" })}
                className="w-full h-11 rounded-xl border bg-background px-3 text-sm" disabled={!a.district}>
                <option value="">Choose thana</option>
                {(BD_LOCATIONS[a.district ?? ""] ?? []).map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
          </>
        ) : areas.length ? (
          <div>
            <label className="block text-sm font-medium mb-1.5">Area <span className="text-destructive">*</span></label>
            <select value={a.area ?? ""} onChange={(e) => set({ area: e.target.value, city: e.target.value })}
              className={`w-full h-11 rounded-xl border bg-background px-3 text-sm ${submitted && errs.area ? "border-destructive" : ""}`}>
              <option value="">Choose area</option>
              {areas.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            {submitted && errs.area && <p className="mt-1.5 text-xs text-destructive">{errs.area}</p>}
          </div>
        ) : (
          <FormField label="City / area" value={a.city ?? ""} onChange={(v) => set({ city: v, area: v })} autoComplete="address-level2" />
        )}
        <FormField label="Postcode" value={a.postal_code ?? ""} onChange={(v) => set({ postal_code: v })} inputMode="numeric" autoComplete="postal-code" placeholder="Optional" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={a.is_default} onChange={(e) => set({ is_default: e.target.checked })} className="w-4 h-4 accent-[hsl(var(--primary))]" />
        Use as my default address
      </label>
      {error && <FormAlert>{error}</FormAlert>}
      <div className="flex gap-2">
        <button disabled={busy} className="inline-flex items-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground px-5 text-sm font-bold disabled:opacity-60">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Save address
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="h-11 px-4 text-sm text-muted-foreground hover:text-foreground">Cancel</button>}
      </div>
    </form>
  );
}
