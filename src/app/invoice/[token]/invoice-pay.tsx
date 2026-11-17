"use client";

import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

/**
 * "How to pay" on the public invoice: the business's payment methods with
 * their account details, and a form for the customer to report the payment
 * (method + transaction reference). The business sees "Payment reported" on
 * the invoice and marks it paid.
 */
type Method = { slug: string; name: string; settings: Record<string, string> };
const LABEL: Record<string, string> = {
  number: "Number", account_type: "Account type", bank_name: "Bank", account_title: "Account title", account_number: "Account number",
  iban: "IBAN", swift: "SWIFT", branch: "Branch", instructions: "", account_details: "",
};

export function InvoicePay({ token, methods, invoiceNumber, total, reported }: {
  token: string; methods: Method[]; invoiceNumber: string; total: string; reported: { reference: string; method: string } | null;
}) {
  const [done, setDone] = useState(reported);
  const [method, setMethod] = useState(methods[0]?.name ?? "");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const r = await fetch("/api/invoices/public", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, method, reference }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(j.error ?? "Could not send"); return; }
    setDone({ reference, method });
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4 mb-6 print:hidden">
      <p className="text-sm font-semibold text-gray-900 mb-2">How to pay {total}</p>
      {methods.length ? (
        <ul className="space-y-2 mb-3">
          {methods.map((m) => (
            <li key={m.slug} className="rounded-lg bg-white border border-gray-200 p-3 text-sm">
              <p className="font-medium text-gray-800">{m.name}</p>
              {Object.entries(m.settings).filter(([, v]) => v).map(([k, v]) => (
                <p key={k} className="text-gray-600">{LABEL[k] ? <>{LABEL[k]}: <span className="font-medium text-gray-900">{v}</span></> : <span className="whitespace-pre-line">{v}</span>}</p>
              ))}
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-gray-600 mb-3">Contact us for payment details.</p>}
      <p className="text-xs text-gray-500 mb-3">Reference invoice {invoiceNumber} with your payment.</p>
      {done ? (
        <p className="flex items-center gap-2 text-sm text-green-700"><CheckCircle className="h-4 w-4" /> Payment reported{done.method ? ` by ${done.method}` : ""}{done.reference ? ` (${done.reference})` : ""}. We will confirm once it arrives.</p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
          {methods.length > 1 && (
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
              {methods.map((m) => <option key={m.slug}>{m.name}</option>)}
            </select>
          )}
          <input value={reference} onChange={(e) => setReference(e.target.value)} required placeholder="Transaction ID or reference" className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" />
          <button type="submit" disabled={busy || !reference.trim()} className="flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} I have paid
          </button>
        </form>
      )}
      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
    </div>
  );
}
