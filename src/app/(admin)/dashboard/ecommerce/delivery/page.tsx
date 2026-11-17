"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Truck, Plus, Trash2, Pencil, Check, Loader2, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSiteCurrency } from "@/lib/hooks/use-site-currency";
import { CourierAccounts } from "@/components/admin/couriers/courier-accounts";

const ZONE_ROWS = [
  { zone: "same_district", name: "Same district", hint: "Seller and customer in the same district", rate: "70", eta: "1-2 days" },
  { zone: "same_division", name: "Same division", hint: "Different districts in one division", rate: "110", eta: "2-3 days" },
  { zone: "other", name: "Rest of Bangladesh", hint: "Anywhere else", rate: "130", eta: "3-5 days" },
] as const;

interface Rate {
  id: string; name: string; areas: string[] | null; rate: number; free_above: number | null;
  eta_days: string | null; cod_fee_pct: number | null; is_default: boolean;
  weight_included_kg: number | null; extra_per_kg: number | null; zone?: string | null;
}
const EMPTY = { id: "", name: "", areas: "", rate: "", free_above: "", eta_days: "", cod_fee_pct: "", is_default: false, weight_included_kg: "1", extra_per_kg: "" };

/**
 * Delivery options customers choose at checkout (e.g. Inside Dhaka 60,
 * Outside Dhaka 120, free above 2,000). With none set, checkout shows free
 * delivery. Saved to shipping_rates, which checkout and orders read.
 */
export default function DeliveryPage() {
  const money = useSiteCurrency().format;
  const [rates, setRates] = useState<Rate[] | null>(null);
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [saving, setSaving] = useState(false);
  const [marketplace, setMarketplace] = useState(false);

  const load = useCallback(async () => {
    const j = await fetch("/api/ecommerce/shipping-rates").then((r) => r.json()).catch(() => ({}));
    setRates(j.rates ?? []);
    setMarketplace(!!j.marketplace);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!form) return;
    setSaving(true);
    const res = await fetch("/api/ecommerce/shipping-rates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, id: form.id || undefined }) });
    const j = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { toast.error(j.error ?? "Could not save"); return; }
    toast.success("Delivery option saved");
    setForm(null);
    load();
  }

  async function remove(r: Rate) {
    if (!confirm(`Delete "${r.name}"? Customers won't see it at checkout any more.`)) return;
    await fetch(`/api/ecommerce/shipping-rates?id=${r.id}`, { method: "DELETE" });
    load();
  }

  async function makeDefault(r: Rate) {
    await fetch("/api/ecommerce/shipping-rates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...r, areas: r.areas ?? [], is_default: true }) });
    load();
  }

  const set = (k: keyof typeof EMPTY, v: string | boolean) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const areaRates = rates?.filter((r) => !r.zone) ?? null;

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Truck className="w-6 h-6" /> Delivery</h1>
          <p className="text-sm text-muted-foreground mt-1">The delivery choices and charges customers see at checkout.</p>
        </div>
        {!form && <Button onClick={() => setForm({ ...EMPTY })}><Plus className="w-4 h-4 mr-1" /> Add delivery option</Button>}
      </div>

      {form && (
        <Card>
          <CardHeader><CardTitle className="text-sm">{form.id ? "Edit delivery option" : "New delivery option"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Inside Dhaka" autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label>Delivery charge</Label>
                <Input type="number" min="0" value={form.rate} onChange={(e) => set("rate", e.target.value)} placeholder="60" />
              </div>
              <div className="space-y-1.5">
                <Label>Free delivery on orders above (optional)</Label>
                <Input type="number" min="0" value={form.free_above} onChange={(e) => set("free_above", e.target.value)} placeholder="2000" />
              </div>
              <div className="space-y-1.5">
                <Label>Delivery time (optional)</Label>
                <Input value={form.eta_days} onChange={(e) => set("eta_days", e.target.value)} placeholder="1-2 days" />
              </div>
              <div className="space-y-1.5">
                <Label>Charge covers parcels up to (kg)</Label>
                <Input type="number" min="0" step="0.1" value={form.weight_included_kg} onChange={(e) => set("weight_included_kg", e.target.value)} placeholder="1" />
              </div>
              <div className="space-y-1.5">
                <Label>Extra per additional kg (optional)</Label>
                <Input type="number" min="0" value={form.extra_per_kg} onChange={(e) => set("extra_per_kg", e.target.value)} placeholder="20" />
                <p className="text-[11px] text-muted-foreground">Uses each product&apos;s weight. Leave empty for one flat charge.</p>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Areas covered (optional, comma separated)</Label>
                <Input value={form.areas} onChange={(e) => set("areas", e.target.value)} placeholder="Dhaka, Gazipur, Narayanganj" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_default} onChange={(e) => set("is_default", e.target.checked)} /> Selected by default at checkout
              </label>
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />} Save</Button>
              <Button variant="ghost" onClick={() => setForm(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Your delivery options</CardTitle>
          <CardDescription>{areaRates?.length ? "Customers pick one at checkout. The charge is added to their order." : "None yet, so checkout shows free delivery. Add one to charge for delivery."}</CardDescription>
        </CardHeader>
        <CardContent>
          {areaRates === null ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            : areaRates.length > 0 && (
              <div className="rounded-lg border divide-y">
                {areaRates.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium flex items-center gap-2">{r.name}{r.is_default && <span className="text-[10px] rounded-full bg-primary/10 text-primary px-2 py-0.5">Default</span>}</p>
                      <p className="text-xs text-muted-foreground">
                        {Number(r.rate) > 0 ? money(Number(r.rate)) : "Free"}
                        {Number(r.extra_per_kg) > 0 ? ` (up to ${Number(r.weight_included_kg ?? 1)} kg, +${money(Number(r.extra_per_kg))}/kg after)` : ""}
                        {r.free_above != null ? ` · free above ${money(Number(r.free_above))}` : ""}
                        {r.eta_days ? ` · ${r.eta_days}` : ""}
                        {r.areas?.length ? ` · ${r.areas.join(", ")}` : ""}
                      </p>
                    </div>
                    {!r.is_default && <Button size="icon" variant="ghost" className="h-8 w-8" title="Make default" onClick={() => makeDefault(r)}><Star className="w-4 h-4" /></Button>}
                    <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Edit" onClick={() => setForm({
                      id: r.id, name: r.name, areas: (r.areas ?? []).join(", "), rate: String(r.rate ?? ""), free_above: r.free_above != null ? String(r.free_above) : "",
                      eta_days: r.eta_days ?? "", cod_fee_pct: r.cod_fee_pct != null ? String(r.cod_fee_pct) : "", is_default: r.is_default,
                      weight_included_kg: String(r.weight_included_kg ?? 1), extra_per_kg: Number(r.extra_per_kg) > 0 ? String(r.extra_per_kg) : "",
                    })}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label="Delete" onClick={() => remove(r)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>

      {marketplace && rates !== null && <ZoneRates rates={rates.filter((r) => r.zone)} onSaved={load} />}

      {marketplace && <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Platform courier accounts</h2>
          <p className="text-sm text-muted-foreground">
            Your own Steadfast and Pathao logins. Sellers who have not connected their own can book parcels through these;
            the courier then pays cash on delivery to you, and you pay sellers from their balance.
          </p>
        </div>
        <CourierAccounts api="/api/ecommerce/shipping-rates/couriers" variant="platform" />
      </div>}
    </div>
  );
}

/** Marketplace delivery by distance: seller district to customer district. */
function ZoneRates({ rates, onSaved }: { rates: Rate[]; onSaved: () => void }) {
  const init = () => Object.fromEntries(ZONE_ROWS.map((z) => {
    const r = rates.find((x) => x.zone === z.zone);
    return [z.zone, {
      rate: r ? String(r.rate) : "", free_above: r?.free_above != null ? String(r.free_above) : "", eta_days: r?.eta_days ?? "",
      weight_included_kg: String(r?.weight_included_kg ?? 1), extra_per_kg: Number(r?.extra_per_kg) > 0 ? String(r?.extra_per_kg) : "",
      cod_fee_pct: r?.cod_fee_pct != null ? String(r.cod_fee_pct) : "1",
    }];
  })) as Record<string, { rate: string; free_above: string; eta_days: string; weight_included_kg: string; extra_per_kg: string; cod_fee_pct: string }>;
  const [f, setF] = useState(init);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setF(init()); }, [rates]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveAll() {
    setSaving(true);
    for (const z of ZONE_ROWS) {
      const v = f[z.zone];
      if (v.rate === "") continue;
      const res = await fetch("/api/ecommerce/shipping-rates", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zone: z.zone, name: z.name, ...v }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); toast.error(j.error ?? `Could not save ${z.name}`); setSaving(false); return; }
    }
    setSaving(false);
    toast.success("Zone rates saved");
    onSaved();
  }

  const upd = (zone: string, k: string, v: string) => setF((cur) => ({ ...cur, [zone]: { ...cur[zone], [k]: v } }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Delivery by distance (marketplace)</CardTitle>
        <CardDescription>
          Each seller&apos;s parcel is charged by where it travels: from the seller&apos;s district to the customer&apos;s.
          When either district is unknown, the delivery options above are used.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {ZONE_ROWS.map((z) => (
          <div key={z.zone} className="rounded-lg border p-3 space-y-3">
            <div>
              <p className="font-medium text-sm">{z.name}</p>
              <p className="text-xs text-muted-foreground">{z.hint}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="space-y-1"><Label className="text-xs">Charge</Label><Input type="number" min="0" value={f[z.zone].rate} placeholder={z.rate} onChange={(e) => upd(z.zone, "rate", e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Free above</Label><Input type="number" min="0" value={f[z.zone].free_above} placeholder="Optional" onChange={(e) => upd(z.zone, "free_above", e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Delivery time</Label><Input value={f[z.zone].eta_days} placeholder={z.eta} onChange={(e) => upd(z.zone, "eta_days", e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Covers up to (kg)</Label><Input type="number" min="0" step="0.1" value={f[z.zone].weight_included_kg} onChange={(e) => upd(z.zone, "weight_included_kg", e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Extra per kg</Label><Input type="number" min="0" value={f[z.zone].extra_per_kg} placeholder="Optional" onChange={(e) => upd(z.zone, "extra_per_kg", e.target.value)} /></div>
            </div>
          </div>
        ))}
        <Button onClick={saveAll} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />} Save zone rates</Button>
      </CardContent>
    </Card>
  );
}
