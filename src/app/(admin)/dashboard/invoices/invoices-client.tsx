"use client";

import { useState } from "react";
import {
  FileText, Plus, X, Loader2, Send, Check, Trash2, ExternalLink, Copy,
} from "lucide-react";

interface InvoiceItem { description: string; quantity: number; unit_price: number }
interface Invoice {
  id: string; invoice_number: string; public_token: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  currency: string; customer_name: string; customer_email: string | null;
  customer_phone: string | null; items: InvoiceItem[];
  subtotal: number; discount: number; tax: number; total: number;
  notes: string | null; issue_date: string; due_date: string | null;
  sent_at: string | null; paid_at: string | null; created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-800 text-gray-400 border-gray-700",
  sent: "bg-blue-900/50 text-blue-300 border-blue-700/50",
  paid: "bg-green-900/50 text-green-300 border-green-700/50",
  overdue: "bg-red-900/50 text-red-300 border-red-700/50",
  cancelled: "bg-gray-800 text-gray-500 border-gray-700",
};

const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40";
const btnPrimary = "inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50";
const btnGhost = "inline-flex items-center gap-2 border border-gray-700 hover:bg-gray-800 text-gray-300 px-3 py-2 rounded-lg text-sm transition-colors";

function money(n: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(n));
  } catch {
    return `${currency} ${Number(n).toFixed(2)}`;
  }
}

function NewInvoiceModal({ baseCurrency, onClose, onCreated }: {
  baseCurrency: string; onClose: () => void; onCreated: (inv: Invoice) => void;
}) {
  const [customer, setCustomer] = useState({ customer_name: "", customer_email: "", customer_phone: "" });
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", quantity: 1, unit_price: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [currency, setCurrency] = useState(baseCurrency);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);
  const total = Math.max(0, subtotal - discount + tax);

  const setItem = (idx: number, patch: Partial<InvoiceItem>) =>
    setItems(list => list.map((it, i) => i === idx ? { ...it, ...patch } : it));

  async function save() {
    setSaving(true); setError(null);
    const res = await fetch("/api/invoices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...customer, items: items.filter(i => i.description.trim()),
        discount, tax, currency, due_date: dueDate || null, notes,
      }),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { setError(d.error ?? "Failed"); return; }
    onCreated(d); onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-950 border border-gray-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">New invoice</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <input className={inputCls} placeholder="Customer name *" value={customer.customer_name}
            onChange={(e) => setCustomer(c => ({ ...c, customer_name: e.target.value }))} />
          <input className={inputCls} placeholder="Email" value={customer.customer_email}
            onChange={(e) => setCustomer(c => ({ ...c, customer_email: e.target.value }))} />
          <input className={inputCls} placeholder="Phone" value={customer.customer_phone}
            onChange={(e) => setCustomer(c => ({ ...c, customer_phone: e.target.value }))} />
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_70px_100px_32px] gap-2 text-xs text-gray-500 px-1">
            <span>Description</span><span>Qty</span><span>Unit price</span><span />
          </div>
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_70px_100px_32px] gap-2">
              <input className={inputCls} placeholder="Service or product" value={item.description}
                onChange={(e) => setItem(i, { description: e.target.value })} />
              <input className={inputCls} type="number" min={1} value={item.quantity}
                onChange={(e) => setItem(i, { quantity: Number(e.target.value) })} />
              <input className={inputCls} type="number" min={0} step="0.01" value={item.unit_price}
                onChange={(e) => setItem(i, { unit_price: Number(e.target.value) })} />
              <button onClick={() => setItems(l => l.filter((_, j) => j !== i))}
                disabled={items.length === 1}
                className="text-gray-500 hover:text-red-400 disabled:opacity-30"><Trash2 className="w-4 h-4 mx-auto" /></button>
            </div>
          ))}
          <button onClick={() => setItems(l => [...l, { description: "", quantity: 1, unit_price: 0 }])}
            className={btnGhost}><Plus className="w-4 h-4" /> Line item</button>
        </div>

        <div className="grid sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-500">Discount</label>
            <input className={inputCls} type="number" min={0} step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Tax</label>
            <input className={inputCls} type="number" min={0} step="0.01" value={tax} onChange={(e) => setTax(Number(e.target.value) || 0)} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Currency</label>
            <input className={inputCls} value={currency} maxLength={3} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Due date</label>
            <input className={inputCls} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        <textarea className={inputCls} rows={2} placeholder="Notes (payment terms, thank-you…)" value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <span className="text-sm text-gray-400">Total: <span className="text-white font-bold">{money(total, currency)}</span></span>
          <div className="flex items-center gap-3">
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button onClick={save} disabled={saving} className={btnPrimary}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Create invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvoicesClient({ initialInvoices, baseCurrency }: {
  initialInvoices: Invoice[]; baseCurrency: string;
}) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [filter, setFilter] = useState<string>("all");
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const patchLocal = (inv: Invoice) => setInvoices(l => l.map(i => i.id === inv.id ? inv : i));

  async function action(inv: Invoice, body: Record<string, unknown>) {
    setBusy(inv.id);
    const res = await fetch(`/api/invoices/${inv.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (res.ok) patchLocal(await res.json());
    else alert((await res.json()).error ?? "Failed");
    setBusy(null);
  }

  async function del(inv: Invoice) {
    if (!confirm(`Delete invoice ${inv.invoice_number}?`)) return;
    const res = await fetch(`/api/invoices/${inv.id}`, { method: "DELETE" });
    if (res.ok) setInvoices(l => l.filter(i => i.id !== inv.id));
  }

  function copyLink(inv: Invoice) {
    navigator.clipboard.writeText(`${window.location.origin}/invoice/${inv.public_token}`);
    setCopied(inv.id);
    setTimeout(() => setCopied(null), 1500);
  }

  const shown = filter === "all" ? invoices : invoices.filter(i => i.status === filter);
  const outstanding = invoices.filter(i => ["sent", "overdue"].includes(i.status))
    .reduce((s, i) => s + Number(i.total), 0);
  const paidThisMonth = invoices.filter(i =>
    i.status === "paid" && i.paid_at && new Date(i.paid_at).getMonth() === new Date().getMonth()
    && new Date(i.paid_at).getFullYear() === new Date().getFullYear())
    .reduce((s, i) => s + Number(i.total), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-400" /> Invoices
        </h1>
        <button onClick={() => setShowNew(true)} className={btnPrimary}><Plus className="w-4 h-4" /> New invoice</button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Outstanding</p>
          <p className="text-xl font-bold text-white">{money(outstanding, baseCurrency)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Paid this month</p>
          <p className="text-xl font-bold text-green-400">{money(paidThisMonth, baseCurrency)}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "draft", "sent", "paid", "overdue", "cancelled"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
              filter === s ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-700 text-gray-400 hover:border-gray-500"
            }`}>{s}</button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {shown.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">No invoices here yet.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {shown.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{inv.invoice_number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[inv.status]}`}>{inv.status}</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {inv.customer_name}{inv.due_date ? ` · due ${inv.due_date}` : ""}
                  </div>
                </div>
                <span className="text-sm font-semibold text-white shrink-0">{money(inv.total, inv.currency)}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {inv.status !== "paid" && inv.status !== "cancelled" && (
                    <>
                      {inv.customer_email && (
                        <button title={inv.sent_at ? "Resend" : "Send to customer"} disabled={busy === inv.id}
                          onClick={() => action(inv, { action: "send" })}
                          className="p-2 text-gray-500 hover:text-indigo-400 rounded-lg hover:bg-gray-800">
                          {busy === inv.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      )}
                      <button title="Mark paid" disabled={busy === inv.id}
                        onClick={() => action(inv, { status: "paid" })}
                        className="p-2 text-gray-500 hover:text-green-400 rounded-lg hover:bg-gray-800">
                        <Check className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button title={copied === inv.id ? "Copied!" : "Copy public link"}
                    onClick={() => copyLink(inv)}
                    className={`p-2 rounded-lg hover:bg-gray-800 ${copied === inv.id ? "text-green-400" : "text-gray-500 hover:text-white"}`}>
                    <Copy className="w-4 h-4" />
                  </button>
                  <a title="Open public view" href={`/invoice/${inv.public_token}`} target="_blank" rel="noopener noreferrer"
                    className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button title="Delete" onClick={() => del(inv)}
                    className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-gray-800">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNew && (
        <NewInvoiceModal baseCurrency={baseCurrency} onClose={() => setShowNew(false)}
          onCreated={(inv) => setInvoices(l => [inv, ...l])} />
      )}
    </div>
  );
}
