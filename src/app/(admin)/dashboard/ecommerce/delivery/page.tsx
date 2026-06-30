"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Truck, Plus, Trash2, Pencil, Check, X, Loader2, GripVertical } from "lucide-react";

interface DeliveryOption {
  id: string;
  name: string;
  description: string | null;
  price: number;
  estimated_days: string | null;
  is_enabled: boolean;
  order_index: number;
}

const supabase = createClient();

export default function DeliveryPage() {
  const [options, setOptions] = useState<DeliveryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "0", estimated_days: "", is_enabled: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("delivery_options").select("*").order("order_index").then(({ data }) => {
      setOptions(data ?? []);
      setLoading(false);
    });
  }, []);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parseFloat(form.price) || 0,
      estimated_days: form.estimated_days.trim() || null,
      is_enabled: form.is_enabled,
    };
    if (editingId) {
      const { error } = await supabase.from("delivery_options").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); setSaving(false); return; }
      setOptions(prev => prev.map(o => o.id === editingId ? { ...o, ...payload } : o));
      setEditingId(null);
    } else {
      const { data, error } = await supabase.from("delivery_options")
        .insert({ ...payload, order_index: options.length }).select().single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      setOptions(prev => [...prev, data as DeliveryOption]);
      setAdding(false);
    }
    setForm({ name: "", description: "", price: "0", estimated_days: "", is_enabled: true });
    setSaving(false);
    toast.success("Saved");
  }

  function startEdit(o: DeliveryOption) {
    setEditingId(o.id);
    setForm({ name: o.name, description: o.description ?? "", price: String(o.price), estimated_days: o.estimated_days ?? "", is_enabled: o.is_enabled });
    setAdding(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this delivery option?")) return;
    await supabase.from("delivery_options").delete().eq("id", id);
    setOptions(prev => prev.filter(o => o.id !== id));
  }

  async function toggleEnabled(o: DeliveryOption) {
    await supabase.from("delivery_options").update({ is_enabled: !o.is_enabled }).eq("id", o.id);
    setOptions(prev => prev.map(x => x.id === o.id ? { ...x, is_enabled: !x.is_enabled } : x));
  }

  const formPanel = (
    <Card>
      <CardContent className="p-5 space-y-4">
        <h3 className="font-semibold text-sm">{editingId ? "Edit Option" : "New Delivery Option"}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs mb-1 block">Name *</Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Standard Delivery" />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Price</Label>
            <Input type="number" min="0" step="0.01" value={form.price} onChange={e => set("price", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Estimated Days</Label>
            <Input value={form.estimated_days} onChange={e => set("estimated_days", e.target.value)} placeholder="3-5 business days" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs mb-1 block">Description</Label>
            <Input value={form.description} onChange={e => set("description", e.target.value)} placeholder="Optional details…" />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_enabled} onCheckedChange={v => set("is_enabled", v)} id="enabled" />
            <Label htmlFor="enabled" className="text-sm">Enabled</Label>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving || !form.name.trim()}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
            {editingId ? "Update" : "Add"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setAdding(false); setEditingId(null); }}>
            <X className="w-4 h-4 mr-2" /> Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Truck className="w-6 h-6" /> Delivery Options</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage shipping and delivery methods shown at checkout.</p>
        </div>
        {!adding && !editingId && (
          <Button size="sm" onClick={() => setAdding(true)}><Plus className="w-4 h-4 mr-2" /> Add Option</Button>
        )}
      </div>

      {(adding && !editingId) && formPanel}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : options.length === 0 && !adding ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Truck className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No delivery options yet</p>
            <p className="text-sm text-muted-foreground">Add options like Standard, Express, Free shipping.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {options.map(o => (
            editingId === o.id ? <div key={o.id}>{formPanel}</div> : (
              <Card key={o.id} className={o.is_enabled ? "" : "opacity-50"}>
                <CardContent className="p-4 flex items-center gap-4">
                  <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{o.name}</p>
                      {!o.is_enabled && <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Disabled</span>}
                    </div>
                    {o.description && <p className="text-xs text-muted-foreground">{o.description}</p>}
                    {o.estimated_days && <p className="text-xs text-muted-foreground">{o.estimated_days}</p>}
                  </div>
                  <p className="font-semibold text-sm shrink-0">{o.price === 0 ? "Free" : `$${o.price.toFixed(2)}`}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch checked={o.is_enabled} onCheckedChange={() => toggleEnabled(o)} />
                    <Button size="sm" variant="ghost" onClick={() => startEdit(o)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(o.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </div>
      )}
    </div>
  );
}
