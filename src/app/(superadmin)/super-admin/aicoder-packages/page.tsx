"use client";

import { useEffect, useState } from "react";
import { Sparkles, Plus, Trash2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Package {
  id: string;
  name: string;
  generations: number;
  price_usd_cents: number;
  active: boolean;
  dodo_product_id: string | null;
  dodo_product_id_sandbox: string | null;
}

function PackageRow({ pkg, onSaved, onDeleted }: { pkg: Package; onSaved: () => void; onDeleted: () => void }) {
  const [name, setName] = useState(pkg.name);
  const [generations, setGenerations] = useState(String(pkg.generations));
  const [priceUsd, setPriceUsd] = useState((pkg.price_usd_cents / 100).toFixed(2));
  const [active, setActive] = useState(pkg.active);
  const [dodoLive, setDodoLive] = useState(pkg.dodo_product_id ?? "");
  const [dodoSandbox, setDodoSandbox] = useState(pkg.dodo_product_id_sandbox ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/super-admin/aicoder-packages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: pkg.id,
        name,
        generations: parseInt(generations, 10),
        price_usd_cents: Math.round(parseFloat(priceUsd) * 100),
        active,
        dodo_product_id: dodoLive.trim() || null,
        dodo_product_id_sandbox: dodoSandbox.trim() || null,
      }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error ?? "Failed to save"); return; }
    toast.success("Package saved");
    onSaved();
  }

  async function remove() {
    setSaving(true);
    const res = await fetch(`/api/super-admin/aicoder-packages?id=${pkg.id}`, { method: "DELETE" });
    setSaving(false);
    if (!res.ok) { toast.error("Failed to delete"); return; }
    toast.success("Package deleted");
    onDeleted();
  }

  const hasProductId = !!dodoLive.trim();

  return (
    <Card>
      <CardContent className="pt-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Generations</Label>
            <Input type="number" min="1" value={generations} onChange={e => setGenerations(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Price (USD)</Label>
            <Input type="number" min="0.01" step="0.01" value={priceUsd} onChange={e => setPriceUsd(e.target.value)} className="h-8 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Dodo Product ID (live)</Label>
            <Input value={dodoLive} onChange={e => setDodoLive(e.target.value)} placeholder="pdt_..." className="h-8 text-sm font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Dodo Product ID (sandbox)</Label>
            <Input value={dodoSandbox} onChange={e => setDodoSandbox(e.target.value)} placeholder="pdt_..." className="h-8 text-sm font-mono" />
          </div>
        </div>

        {!hasProductId && (
          <p className="text-xs text-amber-500">
            No live Dodo product ID set — this package won&apos;t be purchasable until one is added.
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Switch checked={active} onCheckedChange={setActive} />
            <span className="text-xs text-muted-foreground">{active ? "Visible to tenants" : "Hidden"}</span>
          </div>
          <div className="flex items-center gap-2">
            {confirmDelete ? (
              <>
                <span className="text-xs text-destructive">Delete this package?</span>
                <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={remove} disabled={saving}>Yes</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              </>
            ) : (
              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button size="sm" className="h-7 text-xs gap-1" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NewPackageForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [generations, setGenerations] = useState("");
  const [priceUsd, setPriceUsd] = useState("");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!name.trim() || !generations || !priceUsd) { toast.error("Fill in all fields"); return; }
    setSaving(true);
    const res = await fetch("/api/super-admin/aicoder-packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        generations: parseInt(generations, 10),
        price_usd_cents: Math.round(parseFloat(priceUsd) * 100),
      }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error ?? "Failed to create"); return; }
    toast.success("Package created — set its Dodo product ID before it's purchasable");
    setName(""); setGenerations(""); setPriceUsd("");
    onCreated();
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> New Package</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <div className="space-y-1.5">
          <Label className="text-xs">Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Top-up 500" className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Generations</Label>
          <Input type="number" min="1" value={generations} onChange={e => setGenerations(e.target.value)} placeholder="500" className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Price (USD)</Label>
          <Input type="number" min="0.01" step="0.01" value={priceUsd} onChange={e => setPriceUsd(e.target.value)} placeholder="19.00" className="h-8 text-sm" />
        </div>
        <Button size="sm" onClick={create} disabled={saving} className="h-8 gap-1.5">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Add
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AiCoderPackagesPage() {
  const [packages, setPackages] = useState<Package[] | null>(null);

  function load() {
    fetch("/api/super-admin/aicoder-packages")
      .then(r => r.json())
      .then(d => setPackages(d.packages ?? []))
      .catch(() => setPackages([]));
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="w-6 h-6 text-primary" /> AiCoder Top-Up Packages</h1>
        <p className="text-sm text-muted-foreground mt-1">
          One-time generation packs tenants can buy on top of their plan&apos;s monthly quota. Each package needs its
          own Dodo product (create it on the Dodo dashboard first, then paste the product ID here) — a package with
          no product ID isn&apos;t purchasable.
        </p>
      </div>

      <NewPackageForm onCreated={load} />

      {packages === null ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : packages.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">No packages yet — add one above.</p>
      ) : (
        <div className="space-y-3">
          {packages.map(pkg => (
            <PackageRow key={pkg.id} pkg={pkg} onSaved={load} onDeleted={load} />
          ))}
        </div>
      )}
    </div>
  );
}
