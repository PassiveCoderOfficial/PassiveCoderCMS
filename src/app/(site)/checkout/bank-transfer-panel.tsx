"use client";

import React, { useState } from "react";
import { Copy, Check, Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export type PaymentProof = { transaction_id: string; bank: string; note: string; file_url: string };
export const EMPTY_PROOF: PaymentProof = { transaction_id: "", bank: "", note: "", file_url: "" };

const ROWS: [string, string][] = [
  ["bank_name", "Bank"], ["account_title", "Account title"], ["account_number", "Account number"],
  ["iban", "IBAN"], ["swift", "SWIFT / BIC"], ["branch", "Branch"],
];

/**
 * Bank transfer at checkout: the store's account details (with copy buttons)
 * and optional proof fields — transaction id, paying bank, note and a
 * screenshot / PDF of the transfer. Nothing here blocks placing the order.
 */
export function BankTransferPanel({ settings, total, proof, onChange }: {
  settings: Record<string, string>; total: string; proof: PaymentProof; onChange: (p: PaymentProof) => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const copy = async (k: string, v: string) => {
    try { await navigator.clipboard.writeText(v); setCopied(k); setTimeout(() => setCopied(null), 1500); } catch { /* clipboard blocked */ }
  };
  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/ecommerce/payment-proof", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Upload failed"); return; }
      onChange({ ...proof, file_url: data.url });
    } finally { setUploading(false); }
  };
  const input = "w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 bg-background";
  return (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
        <p className="font-semibold">Transfer {total} to:</p>
        <dl className="space-y-1.5">
          {ROWS.filter(([k]) => settings[k]).map(([k, label]) => (
            <div key={k} className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground shrink-0">{label}</dt>
              <dd className="flex items-center gap-1.5 font-medium text-right break-all">
                {settings[k]}
                <button type="button" onClick={() => copy(k, settings[k])} aria-label={`Copy ${label}`} className="p-1 rounded hover:bg-background">
                  {copied === k ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>
              </dd>
            </div>
          ))}
        </dl>
        {settings.instructions && <p className="text-muted-foreground whitespace-pre-wrap pt-1">{settings.instructions}</p>}
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium">Already paid? Add the transfer details <span className="text-muted-foreground font-normal">(optional)</span></p>
        <div className="grid sm:grid-cols-2 gap-3">
          <input className={input} placeholder="Transaction / reference ID" value={proof.transaction_id} onChange={(e) => onChange({ ...proof, transaction_id: e.target.value })} />
          <input className={input} placeholder="Your bank (optional)" value={proof.bank} onChange={(e) => onChange({ ...proof, bank: e.target.value })} />
        </div>
        <textarea className={input} rows={2} placeholder="Note (optional)" value={proof.note} onChange={(e) => onChange({ ...proof, note: e.target.value })} />
        {proof.file_url ? (
          <div className="flex items-center gap-2 text-sm">
            <a href={proof.file_url} target="_blank" rel="noopener noreferrer" className="underline truncate">Transfer receipt attached</a>
            <button type="button" onClick={() => onChange({ ...proof, file_url: "" })} aria-label="Remove receipt" className="p-1 rounded hover:bg-muted"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 border border-dashed rounded-lg px-3 py-3 text-sm cursor-pointer hover:bg-muted">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Uploading…" : "Upload transfer screenshot or PDF"}
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" disabled={uploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
          </label>
        )}
      </div>
    </div>
  );
}
