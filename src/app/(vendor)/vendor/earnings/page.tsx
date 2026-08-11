import { Wallet } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { currentVendor } from "@/lib/marketplace-ecom/vendor-auth";
import { vendorBalance } from "@/lib/marketplace-ecom/ledger";

export const metadata = { title: "Earnings — Seller Centre" };

const tk = (n: number) =>
  `৳${Math.abs(Number(n)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TYPE_LABEL: Record<string, string> = {
  sale: "Order delivered",
  commission: "Marketplace commission",
  cod_fee: "COD collection fee",
  refund: "Refund",
  return: "Returned order",
  adjustment: "Adjustment",
  payout: "Paid out to you",
};

export default async function EarningsPage() {
  const vendor = await currentVendor();
  if (!vendor) return null;

  const admin = await createAdminClient();
  const [{ data: entries }, { data: payouts }, balance] = await Promise.all([
    admin
      .from("vendor_ledger")
      .select("seq, type, amount, balance_after, note, created_at")
      .eq("vendor_id", vendor.vendor_id)
      .order("seq", { ascending: false })
      .limit(100),
    admin
      .from("vendor_payouts")
      .select("id, net, status, reference, paid_at, period_start, period_end")
      .eq("vendor_id", vendor.vendor_id)
      .order("created_at", { ascending: false })
      .limit(20),
    vendorBalance(admin, vendor.vendor_id),
  ]);

  const rows = entries ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Earnings</h1>
        <p className="text-sm text-gray-400 mt-1">
          Every rupee in and out of your seller account.
        </p>
      </div>

      <div className="border border-gray-800 rounded-xl p-5 bg-gray-900/40">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Wallet className="w-4 h-4" /> Current balance
        </div>
        <p className="text-3xl font-bold text-white mt-2">{tk(balance)}</p>
        <p className="text-xs text-gray-500 mt-2">
          Payouts are sent to your bKash after each order clears its return-hold window.
        </p>
      </div>

      {(payouts ?? []).length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Payouts</h2>
          <div className="border border-gray-800 rounded-xl divide-y divide-gray-800">
            {(payouts ?? []).map((p) => (
              <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-white">{tk(p.net)}</p>
                  <p className="text-xs text-gray-500">
                    {p.period_start} → {p.period_end}
                    {p.reference ? ` · ${p.reference}` : ""}
                  </p>
                </div>
                <span
                  className={`ml-auto text-xs px-2 py-0.5 rounded-full border capitalize ${
                    p.status === "paid"
                      ? "bg-green-900/50 text-green-300 border-green-700/50"
                      : "bg-amber-900/50 text-amber-300 border-amber-700/50"
                  }`}
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Statement</h2>
        {rows.length === 0 ? (
          <div className="border border-gray-800 rounded-xl p-8 text-center text-gray-500 text-sm">
            Nothing yet. Entries appear once your first order is delivered.
          </div>
        ) : (
          <div className="border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900/60 text-gray-400">
                  <tr>
                    <th className="text-left font-medium px-4 py-2.5">Date</th>
                    <th className="text-left font-medium px-4 py-2.5">Detail</th>
                    <th className="text-right font-medium px-4 py-2.5">Amount</th>
                    <th className="text-right font-medium px-4 py-2.5">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {rows.map((e) => {
                    const credit = Number(e.amount) >= 0;
                    return (
                      <tr key={e.seq} className="text-gray-300">
                        <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                          {new Date(e.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-gray-200">{TYPE_LABEL[e.type] ?? e.type}</span>
                          {e.note && <span className="block text-xs text-gray-500">{e.note}</span>}
                        </td>
                        <td className={`px-4 py-2.5 text-right whitespace-nowrap ${credit ? "text-green-400" : "text-gray-400"}`}>
                          {credit ? "+" : "−"}{tk(e.amount)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-white whitespace-nowrap">
                          {tk(e.balance_after)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
