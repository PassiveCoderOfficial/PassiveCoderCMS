"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Download, Mail, Receipt, DollarSign } from "lucide-react";
import { formatUsd, receiptAmountLabel, type PayCurrency } from "@/lib/billing/money";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Payment {
  id: string;
  receipt_number: string;
  amount_cents: number;
  currency: PayCurrency;
  orig_amount_minor: number;
  method: string | null;
  paid_at: string;
  is_advance: boolean;
  note: string | null;
  emailed_at: string | null;
}

const METHODS = ["__none__", "bkash", "nagad", "bank", "shurjopay", "dodo", "manual"];

export default function PaymentsSection({
  subscriptionId, totalBilledCents, totalPaidCents, balanceDueCents,
}: {
  subscriptionId: string;
  totalBilledCents: number | null;
  totalPaidCents: number | null;
  balanceDueCents: number | null;
}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailingId, setEmailingId] = useState<string | null>(null);
  const [totals, setTotals] = useState({ billed: totalBilledCents ?? 0, paid: totalPaidCents ?? 0, due: balanceDueCents ?? 0 });

  const [form, setForm] = useState({
    currency: "USD" as PayCurrency,
    orig_amount: "",
    method: "",
    paid_at: new Date().toISOString().split("T")[0],
    note: "",
    is_advance: false,
  });

  async function load() {
    const res = await fetch(`/api/super-admin/payments?subscription_id=${subscriptionId}`);
    const data = await res.json();
    setPayments(data.payments ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [subscriptionId]);

  async function recordPayment() {
    const amount = parseFloat(form.orig_amount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    setSaving(true);
    const res = await fetch("/api/super-admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription_id: subscriptionId,
        currency: form.currency,
        orig_amount: amount,
        method: form.method || null,
        paid_at: form.paid_at,
        note: form.note,
        is_advance: form.is_advance,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(data.error ?? "Failed to record payment"); return; }
    toast.success(`Payment recorded — ${data.payment.receipt_number}`);
    setTotals({ billed: data.totalBilled, paid: data.totalPaid, due: data.balanceDue });
    setForm({ currency: "USD", orig_amount: "", method: "", paid_at: new Date().toISOString().split("T")[0], note: "", is_advance: false });
    setShowForm(false);
    load();
  }

  async function emailReceipt(id: string) {
    setEmailingId(id);
    const res = await fetch(`/api/super-admin/payments/${id}/email`, { method: "POST" });
    const data = await res.json();
    setEmailingId(null);
    if (!res.ok) { toast.error(data.error ?? "Failed to send"); return; }
    toast.success(`Receipt emailed to ${data.sentTo}`);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <Receipt className="w-3.5 h-3.5" /> Payments &amp; Receipts
        </p>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-3.5 h-3.5" /> Record Payment
        </Button>
      </div>

      {/* Statement */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase">Total Billed</p>
            <p className="text-sm font-semibold">{formatUsd(totals.billed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase">Total Paid</p>
            <p className="text-sm font-semibold text-green-400">{formatUsd(totals.paid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase">Balance Due</p>
            <p className={`text-sm font-semibold ${totals.due > 0 ? "text-amber-400" : "text-muted-foreground"}`}>{formatUsd(totals.due)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Record payment form */}
      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={(v) => setForm(f => ({ ...f, currency: v as PayCurrency }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="BDT">BDT (৳)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount ({form.currency === "BDT" ? "৳" : "$"})</Label>
                <Input type="number" min="0" step={form.currency === "BDT" ? "1" : "0.01"} value={form.orig_amount}
                  onChange={e => setForm(f => ({ ...f, orig_amount: e.target.value }))}
                  placeholder={form.currency === "BDT" ? "20000" : "160.00"} />
              </div>
              <div className="space-y-1.5">
                <Label>Method</Label>
                <Select value={form.method || "__none__"} onValueChange={(v) => setForm(f => ({ ...f, method: v === "__none__" ? "" : v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METHODS.map(m => <SelectItem key={m} value={m}>{m === "__none__" ? "— not set —" : m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date Paid</Label>
                <Input type="date" value={form.paid_at} onChange={e => setForm(f => ({ ...f, paid_at: e.target.value }))} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.is_advance} onCheckedChange={(v) => setForm(f => ({ ...f, is_advance: v }))} />
                <Label className="font-normal">Advance / partial payment</Label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Note (optional)</Label>
              <Input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder="e.g. Paid via bKash, ref #12345" />
            </div>
            <div className="flex gap-2">
              <Button onClick={recordPayment} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                Save Payment
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ledger */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : payments.length === 0 ? (
        <p className="text-xs text-muted-foreground py-3">No payments recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {payments.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-accent/40 rounded-lg px-3 py-2.5 text-sm">
              <div>
                <p className="font-medium flex items-center gap-2">
                  {p.receipt_number}
                  {p.is_advance && <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">ADVANCE</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {receiptAmountLabel(p)} · {p.method || "—"} · {new Date(p.paid_at).toLocaleDateString()}
                  {p.emailed_at && <span className="text-green-500"> · emailed</span>}
                </p>
              </div>
              <div className="flex gap-1.5">
                <a href={`/api/receipts/${p.id}/pdf`} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Download PDF">
                  <Download className="w-3.5 h-3.5" />
                </a>
                <button onClick={() => emailReceipt(p.id)} disabled={emailingId === p.id}
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50" title="Email receipt">
                  {emailingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
