"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const STATUSES = [
  ["pending", "Pending"], ["processing", "Processing"], ["on_hold", "On hold"], ["completed", "Completed"],
  ["cancelled", "Cancelled"], ["refunded", "Refunded"], ["failed", "Failed"],
] as const;
const PAYMENTS = [
  ["pending", "Unpaid"], ["paid", "Paid"], ["partially_refunded", "Partially refunded"], ["refunded", "Refunded"], ["failed", "Failed"],
] as const;

export function OrderActions({ orderId, status, paymentStatus, notes, hasEmail, transactionId }: {
  orderId: string; status: string; paymentStatus: string; notes: string; hasEmail: boolean; transactionId?: string | null;
}) {
  const router = useRouter();
  const [s, setS] = useState(status);
  const [p, setP] = useState(paymentStatus);
  const [n, setN] = useState(notes);
  const [notify, setNotify] = useState(hasEmail);
  const [saving, setSaving] = useState(false);
  const dirty = s !== status || p !== paymentStatus || n !== notes;

  async function save() {
    setSaving(true);
    const r = await fetch(`/api/ecommerce/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(s !== status ? { status: s } : {}),
        ...(p !== paymentStatus ? { payment_status: p } : {}),
        ...(n !== notes ? { notes: n } : {}),
        notify: notify && s !== status,
      }),
    });
    const d = await r.json().catch(() => ({}));
    setSaving(false);
    if (!r.ok) { toast.error(d.error ?? "Could not update order"); return; }
    toast.success(d.emailed ? "Order updated and customer emailed" : "Order updated");
    router.refresh();
  }

  return (
    <div className="space-y-4 lg:sticky lg:top-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">Order status</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">Fulfilment</span>
            <select value={s} onChange={(e) => setS(e.target.value)} className="w-full h-9 rounded-md border bg-background px-2 text-sm">
              {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">Payment</span>
            <select value={p} onChange={(e) => setP(e.target.value)} className="w-full h-9 rounded-md border bg-background px-2 text-sm">
              {PAYMENTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          {transactionId && <p className="text-xs text-muted-foreground">Transaction ID: <span className="font-mono">{transactionId}</span></p>}
          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">Internal note (customer can&apos;t see it)</span>
            <Textarea value={n} onChange={(e) => setN(e.target.value)} rows={3} placeholder="e.g. Called customer, delivering Thursday" />
          </label>
          {hasEmail && s !== status && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
              Email the customer about the new status
            </label>
          )}
          <Button className="w-full" onClick={save} disabled={!dirty || saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save changes
          </Button>
        </CardContent>
      </Card>
      <Button variant="outline" className="w-full" onClick={() => window.print()}>
        <Printer className="w-4 h-4 mr-2" /> Print packing slip
      </Button>
    </div>
  );
}
