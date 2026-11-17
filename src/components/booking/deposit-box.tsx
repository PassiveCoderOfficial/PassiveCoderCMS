"use client";

import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

/**
 * Deposit instructions for a booking: the amount, the business's own
 * payment methods (bKash, Nagad, bank, as set in Shop > Payments) and a box
 * for the customer's transaction reference. Shown right after booking and on
 * the manage page.
 */
export type DepositView = {
  amount: number | null; currency: string | null; note: string | null; label: string;
  methods: { slug: string; name: string; settings: Record<string, string> }[];
};

const FIELD_LABEL: Record<string, string> = {
  number: "Number", account_type: "Account type", bank_name: "Bank", account_title: "Account title", account_number: "Account number",
  iban: "IBAN", swift: "SWIFT", branch: "Branch", instructions: "", account_details: "",
};

export function DepositBox({ deposit, status, reference, onReport }: {
  deposit: DepositView; status: string; reference: string | null; onReport: (reference: string) => Promise<boolean>;
}) {
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  if (status === "received") return <p className="mt-2 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle className="h-4 w-4" /> Deposit of {deposit.label} received. Thank you.</p>;
  return (
    <div className="mt-2 space-y-3 text-sm">
      <p>A deposit of <strong>{deposit.label}</strong> secures this booking.{deposit.note ? ` ${deposit.note}` : ""}</p>
      {deposit.methods.length > 0 && (
        <ul className="space-y-2">
          {deposit.methods.map((m) => (
            <li key={m.slug} className="rounded-lg border bg-muted/40 p-3">
              <p className="font-semibold">{m.name}</p>
              {Object.entries(m.settings).filter(([, v]) => v).map(([k, v]) => (
                <p key={k} className="text-muted-foreground">{FIELD_LABEL[k] ? <>{FIELD_LABEL[k]}: <span className="font-medium text-foreground">{v}</span></> : <span className="whitespace-pre-line">{v}</span>}</p>
              ))}
            </li>
          ))}
        </ul>
      )}
      {status === "reported" ? (
        <p className="flex items-center gap-2 text-emerald-700"><CheckCircle className="h-4 w-4" /> Payment reported{reference ? ` (${reference})` : ""}. We will confirm once it arrives.</p>
      ) : (
        <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (!ref.trim()) return; setBusy(true); await onReport(ref.trim()); setBusy(false); }}>
          <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Transaction ID or reference" className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2" />
          <button type="submit" disabled={busy || !ref.trim()} className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />} I have paid</button>
        </form>
      )}
    </div>
  );
}
