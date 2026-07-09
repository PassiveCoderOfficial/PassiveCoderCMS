"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Download, Mail, Receipt, DollarSign } from "lucide-react";
import { formatUsd, receiptAmountLabel, type PayCurrency } from "@/lib/billing/money";

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

const METHODS = ["", "bkash", "nagad", "bank", "shurjopay", "dodo", "manual"];

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
    <div className="border-t border-gray-800 pt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
          <Receipt className="w-3.5 h-3.5" /> Payments &amp; Receipts
        </p>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-600/30 text-indigo-400 px-2.5 py-1.5 rounded-lg transition-colors">
          <Plus className="w-3.5 h-3.5" /> Record Payment
        </button>
      </div>

      {/* Statement */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-800/60 rounded-lg p-3">
          <p className="text-[10px] text-gray-500 uppercase">Total Billed</p>
          <p className="text-sm font-semibold text-white">{formatUsd(totals.billed)}</p>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-3">
          <p className="text-[10px] text-gray-500 uppercase">Total Paid</p>
          <p className="text-sm font-semibold text-green-400">{formatUsd(totals.paid)}</p>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-3">
          <p className="text-[10px] text-gray-500 uppercase">Balance Due</p>
          <p className={`text-sm font-semibold ${totals.due > 0 ? "text-amber-400" : "text-gray-500"}`}>{formatUsd(totals.due)}</p>
        </div>
      </div>

      {/* Record payment form */}
      {showForm && (
        <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4 mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Currency</label>
              <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value as PayCurrency }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
                <option value="USD">USD ($)</option>
                <option value="BDT">BDT (৳)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Amount ({form.currency === "BDT" ? "৳" : "$"})</label>
              <input type="number" min="0" step={form.currency === "BDT" ? "1" : "0.01"} value={form.orig_amount}
                onChange={e => setForm(f => ({ ...f, orig_amount: e.target.value }))}
                placeholder={form.currency === "BDT" ? "20000" : "160.00"}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Method</label>
              <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
                {METHODS.map(m => <option key={m} value={m}>{m || "— not set —"}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Date Paid</label>
              <input type="date" value={form.paid_at} onChange={e => setForm(f => ({ ...f, paid_at: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.is_advance} onChange={e => setForm(f => ({ ...f, is_advance: e.target.checked }))}
                  className="rounded border-gray-700 bg-gray-800" />
                Advance / partial payment
              </label>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Note (optional)</label>
            <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="e.g. Paid via bKash, ref #12345"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={recordPayment} disabled={saving}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
              Save Payment
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-400 hover:text-white px-3 py-2">Cancel</button>
          </div>
        </div>
      )}

      {/* Ledger */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-gray-500" /></div>
      ) : payments.length === 0 ? (
        <p className="text-xs text-gray-600 py-3">No payments recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {payments.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-gray-800/40 rounded-lg px-3 py-2.5 text-sm">
              <div>
                <p className="text-white font-medium flex items-center gap-2">
                  {p.receipt_number}
                  {p.is_advance && <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">ADVANCE</span>}
                </p>
                <p className="text-xs text-gray-500">
                  {receiptAmountLabel(p)} · {p.method || "—"} · {new Date(p.paid_at).toLocaleDateString()}
                  {p.emailed_at && <span className="text-green-500"> · emailed</span>}
                </p>
              </div>
              <div className="flex gap-1.5">
                <a href={`/api/receipts/${p.id}/pdf`} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Download PDF">
                  <Download className="w-3.5 h-3.5" />
                </a>
                <button onClick={() => emailReceipt(p.id)} disabled={emailingId === p.id}
                  className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors disabled:opacity-50" title="Email receipt">
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
