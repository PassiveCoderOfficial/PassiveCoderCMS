"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShoppingBag, Plus, X, Loader2, Check, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
}

const STATUS_VARIANT: Record<string, "default" | "outline" | "destructive" | "secondary"> = {
  completed: "default", pending: "secondary", cancelled: "destructive",
  processing: "secondary", refunded: "outline", on_hold: "outline", failed: "destructive",
};

const supabase = createClient();

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customer_name: "", customer_email: "", status: "pending", payment_status: "pending",
    payment_method: "", notes: "", total: "0", subtotal: "0", shipping_cost: "0", tax: "0",
  });

  useEffect(() => {
    supabase.from("orders").select("id,order_number,customer_name,customer_email,status,payment_status,total,created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => { setOrders(data ?? []); setLoading(false); });
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function createOrder() {
    if (!form.customer_name.trim() || !form.customer_email.trim()) return;
    setSaving(true);
    const order_number = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const { data, error } = await supabase.from("orders").insert({
      order_number,
      customer_name: form.customer_name.trim(),
      customer_email: form.customer_email.trim(),
      status: form.status,
      payment_status: form.payment_status,
      payment_method: form.payment_method || null,
      notes: form.notes || null,
      total: parseFloat(form.total) || 0,
      subtotal: parseFloat(form.subtotal) || 0,
      shipping_cost: parseFloat(form.shipping_cost) || 0,
      tax: parseFloat(form.tax) || 0,
      items: [],
      billing_address: {},
    }).select().single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setOrders(prev => [data as Order, ...prev]);
    setAdding(false);
    setForm({ customer_name: "", customer_email: "", status: "pending", payment_status: "pending", payment_method: "", notes: "", total: "0", subtotal: "0", shipping_cost: "0", tax: "0" });
    toast.success(`Order ${order_number} created`);
  }

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingBag className="w-6 h-6" /> Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">{orders.length} total orders</p>
        </div>
        <Button size="sm" onClick={() => setAdding(a => !a)}>
          {adding ? <><X className="w-4 h-4 mr-2" />Cancel</> : <><Plus className="w-4 h-4 mr-2" />Add Order</>}
        </Button>
      </div>

      {adding && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold text-sm">New Manual Order</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Customer Name *</Label>
                <Input value={form.customer_name} onChange={e => set("customer_name", e.target.value)} placeholder="John Smith" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Customer Email *</Label>
                <Input type="email" value={form.customer_email} onChange={e => set("customer_email", e.target.value)} placeholder="john@example.com" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Order Status</Label>
                <select value={form.status} onChange={e => set("status", e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {["pending","processing","on_hold","completed","cancelled","refunded","failed"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Payment Status</Label>
                <select value={form.payment_status} onChange={e => set("payment_status", e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {["pending","paid","failed","refunded","partially_refunded"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Payment Method</Label>
                <Input value={form.payment_method} onChange={e => set("payment_method", e.target.value)} placeholder="Cash, Bank Transfer…" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Total ($)</Label>
                <Input type="number" step="0.01" min="0" value={form.total} onChange={e => set("total", e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs mb-1 block">Notes</Label>
                <Input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Internal notes…" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={createOrder} disabled={saving || !form.customer_name.trim() || !form.customer_email.trim()}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />} Create Order
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : orders.length === 0 && !adding ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No orders yet</p>
            <p className="text-sm text-muted-foreground">Orders appear here when customers purchase, or create one manually above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {orders.map(order => (
            <Card key={order.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-medium text-sm">#{order.order_number}</p>
                    <Badge variant={STATUS_VARIANT[order.status] ?? "outline"} className="text-xs">{order.status}</Badge>
                    <Badge variant="outline" className="text-xs">{order.payment_status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {order.customer_name} · {order.customer_email} · {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="font-semibold text-sm">{formatCurrency(order.total)}</p>
                  <Link href={`/dashboard/ecommerce/orders/${order.id}`} className="text-xs text-primary hover:underline">View →</Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
