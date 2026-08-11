"use client";

import { useCallback, useEffect, useState } from "react";
import { Wallet, Loader2, Send, CheckCircle2, AlertCircle, Store, Clock } from "lucide-react";

interface Eligible {
  vendor_id: string;
  vendor_name: string;
  bkash_number: string | null;
  hold_days: number;
  sub_order_count: number;
  gross: number;
  commission: number;
  deductions: number;
  net: number;
  sub_orders: string[];
}

interface Payout {
  id: string;
  vendor_id: string;
  period_start: string;
  period_end: string;
  gross: number;
  commission: number;
  net: number;
  method: string;
  status: "pending" | "processing" | "paid" | "failed";
  reference: string | null;
  paid_at: string | null;
  created_at: string;
  vendors: { name: string; bkash_number: string | null } | null;
}

const STATUS_CLS: Record<Payout["status"], string> = {
  pending: "bg-yellow-900/50 text-yellow-300 border-yellow-700/50",
  processing: "bg-blue-900/50 text-blue-300 border-blue-700/50",
  paid: "bg-green-900/50 text-green-300 border-green-700/50",
  failed: "bg-red-900/50 text-red-300 border-red-700/50",
};

const tk = (n: number) => `৳${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

export default function PayoutsClient() {
  const [eligible, setEligible] = useState<Eligible[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [paying, setPaying] = useState<Payout | null>(null);
  const [reference, setReference] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [a, b] = await Promise.all([
      fetch("/api/marketplace-ecom/payouts?preview=1").then((r) => r.json()),
      fetch("/api/marketplace-ecom/payouts").then((r) => r.json()),
    ]);
    setEligible(Array.isArray(a) ? a : []);
    setPayouts(Array.isArray(b) ? b : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createPayout(vendorId: string) {
    setBusy(vendorId);
    const res = await fetch("/api/marketplace-ecom/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendor_id: vendorId, method: "bkash" }),
    });
    setBusy(null);
    if (res.ok) load();
  }

  async function markPaid() {
    if (!paying) return;
    setBusy(paying.id);
    const res = await fetch("/api/marketplace-ecom/payouts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: paying.id, status: "paid", reference }),
    });
    setBusy(null);
    setPaying(null);
    setReference("");
    if (res.ok) load();
  }

  const totalDue = eligible.reduce((s, e) => s + e.net, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Wallet className="w-6 h-6 text-indigo-400" /> Seller payouts
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Delivered orders become payable once each seller&apos;s return-hold window has passed.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                Ready to pay
              </h2>
              {eligible.length > 0 && (
                <p className="text-sm text-gray-400">
                  Total due <span className="text-white font-semibold">{tk(totalDue)}</span>
                </p>
              )}
            </div>

            {eligible.length === 0 ? (
              <div className="border border-gray-800 rounded-xl p-8 text-center text-gray-500 text-sm">
                Nothing is payable yet. Orders appear here after delivery plus the hold period.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {eligible.map((e) => (
                  <div key={e.vendor_id} className="border border-gray-800 rounded-xl p-4 bg-gray-900/40 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white truncate flex items-center gap-1.5">
                          <Store className="w-4 h-4 text-gray-500 shrink-0" /> {e.vendor_name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {e.sub_order_count} order{e.sub_order_count === 1 ? "" : "s"}
                          {e.bkash_number ? ` · bKash ${e.bkash_number}` : " · no bKash number set"}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-white shrink-0">{tk(e.net)}</p>
                    </div>

                    <div className="text-xs text-gray-400 space-y-0.5">
                      <p>Gross {tk(e.gross)}</p>
                      <p>Commission −{tk(e.commission)}</p>
                      {e.deductions > 0 && <p>COD &amp; other fees −{tk(e.deductions)}</p>}
                    </div>

                    <button
                      onClick={() => createPayout(e.vendor_id)}
                      disabled={busy === e.vendor_id}
                      className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {busy === e.vendor_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Create payout
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Payout history
            </h2>
            {payouts.length === 0 ? (
              <div className="border border-gray-800 rounded-xl p-8 text-center text-gray-500 text-sm">
                No payouts created yet.
              </div>
            ) : (
              <div className="border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-900/60 text-gray-400">
                      <tr>
                        <th className="text-left font-medium px-4 py-2.5">Seller</th>
                        <th className="text-left font-medium px-4 py-2.5">Period</th>
                        <th className="text-right font-medium px-4 py-2.5">Gross</th>
                        <th className="text-right font-medium px-4 py-2.5">Commission</th>
                        <th className="text-right font-medium px-4 py-2.5">Net</th>
                        <th className="text-left font-medium px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {payouts.map((p) => (
                        <tr key={p.id} className="text-gray-300">
                          <td className="px-4 py-2.5">
                            <span className="text-white">{p.vendors?.name ?? "—"}</span>
                            {p.reference && (
                              <span className="block text-xs text-gray-500">Ref {p.reference}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">
                            {p.period_start} → {p.period_end}
                          </td>
                          <td className="px-4 py-2.5 text-right">{tk(p.gross)}</td>
                          <td className="px-4 py-2.5 text-right text-gray-400">−{tk(p.commission)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-white">{tk(p.net)}</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_CLS[p.status]}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {p.status !== "paid" && (
                              <button
                                onClick={() => { setPaying(p); setReference(""); }}
                                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-green-900/40 border border-green-700/50 text-green-300 hover:bg-green-900/60"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Mark paid
                              </button>
                            )}
                            {p.status === "paid" && p.paid_at && (
                              <span className="text-xs text-gray-500 flex items-center justify-end gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(p.paid_at).toLocaleDateString()}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {paying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setPaying(null)} />
          <div className="relative w-full max-w-md bg-gray-950 border border-gray-800 rounded-2xl p-5 space-y-3">
            <h2 className="text-lg font-semibold text-white">Mark payout paid</h2>
            <div className="flex items-start gap-2 text-sm text-amber-300 bg-amber-950/40 border border-amber-800/50 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Confirm the bKash transfer of {tk(paying.net)} to{" "}
                {paying.vendors?.name ?? "this seller"} has actually been sent. This posts the
                debit to their ledger.
              </p>
            </div>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="bKash transaction ID"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPaying(null)}
                className="inline-flex items-center gap-2 border border-gray-700 hover:bg-gray-800 text-gray-300 px-3 py-2 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={markPaid}
                disabled={busy === paying.id}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {busy === paying.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirm paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
