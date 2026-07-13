import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { BarChart3 } from "lucide-react";

export const metadata = { title: "P&L Report — Dashboard" };

interface Tx { type: string; amount: number; category: string | null; date: string }

function monthKey(d: string) { return d.slice(0, 7); }
function monthLabel(key: string) {
  return new Date(key + "-01T00:00:00").toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export default async function ReportPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();

  const since = new Date();
  since.setMonth(since.getMonth() - 11);
  since.setDate(1);

  const { data: txs } = await supabase.from("transactions")
    .select("type, amount, category, date")
    .eq("tenant_id", tid)
    .eq("status", "completed")
    .gte("date", since.toISOString().slice(0, 10))
    .order("date");

  const { data: settings } = await supabase.from("site_settings")
    .select("currency").eq("tenant_id", tid).maybeSingle();
  const currency = settings?.currency || "USD";
  const money = (n: number) => {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n); }
    catch { return `${currency} ${n.toFixed(2)}`; }
  };

  // Monthly aggregation
  const months = new Map<string, { income: number; expense: number }>();
  for (let i = 0; i < 12; i++) {
    const d = new Date(since);
    d.setMonth(since.getMonth() + i);
    months.set(d.toISOString().slice(0, 7), { income: 0, expense: 0 });
  }
  const byCategory = new Map<string, { income: number; expense: number }>();

  for (const t of (txs ?? []) as Tx[]) {
    const m = months.get(monthKey(t.date));
    const amt = Number(t.amount) || 0;
    const isIncome = t.type === "income";
    if (m) isIncome ? (m.income += amt) : (m.expense += amt);
    const cat = t.category || "uncategorized";
    const c = byCategory.get(cat) ?? { income: 0, expense: 0 };
    isIncome ? (c.income += amt) : (c.expense += amt);
    byCategory.set(cat, c);
  }

  const rows = [...months.entries()];
  const totalIncome = rows.reduce((s, [, v]) => s + v.income, 0);
  const totalExpense = rows.reduce((s, [, v]) => s + v.expense, 0);
  const net = totalIncome - totalExpense;
  const maxBar = Math.max(1, ...rows.map(([, v]) => Math.max(v.income, v.expense)));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-indigo-400" /> Profit &amp; Loss — last 12 months
      </h1>

      <div className="grid sm:grid-cols-3 gap-4 max-w-2xl">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Income</p>
          <p className="text-xl font-bold text-green-400">{money(totalIncome)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Expenses</p>
          <p className="text-xl font-bold text-red-400">{money(totalExpense)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Net profit</p>
          <p className={`text-xl font-bold ${net >= 0 ? "text-white" : "text-red-400"}`}>{money(net)}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 overflow-x-auto">
        <table className="w-full text-sm min-w-[540px]">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-800">
              <th className="py-2 pr-4">Month</th>
              <th className="py-2 pr-4">Income</th>
              <th className="py-2 pr-4">Expenses</th>
              <th className="py-2 pr-4">Net</th>
              <th className="py-2 w-1/3" />
            </tr>
          </thead>
          <tbody>
            {rows.map(([key, v]) => {
              const rowNet = v.income - v.expense;
              return (
                <tr key={key} className="border-b border-gray-800/60">
                  <td className="py-2.5 pr-4 text-gray-300">{monthLabel(key)}</td>
                  <td className="py-2.5 pr-4 text-green-400">{v.income ? money(v.income) : "—"}</td>
                  <td className="py-2.5 pr-4 text-red-400">{v.expense ? money(v.expense) : "—"}</td>
                  <td className={`py-2.5 pr-4 font-medium ${rowNet >= 0 ? "text-gray-200" : "text-red-400"}`}>
                    {v.income || v.expense ? money(rowNet) : "—"}
                  </td>
                  <td className="py-2.5">
                    <div className="space-y-1">
                      <div className="h-1.5 rounded bg-green-500/80" style={{ width: `${(v.income / maxBar) * 100}%` }} />
                      <div className="h-1.5 rounded bg-red-500/70" style={{ width: `${(v.expense / maxBar) * 100}%` }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {byCategory.size > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 max-w-2xl">
          <h2 className="text-sm font-semibold text-white mb-3">By category</h2>
          <div className="space-y-2">
            {[...byCategory.entries()]
              .sort((a, b) => (b[1].income + b[1].expense) - (a[1].income + a[1].expense))
              .map(([cat, v]) => (
                <div key={cat} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 capitalize">{cat}</span>
                  <span>
                    {v.income > 0 && <span className="text-green-400 mr-3">+{money(v.income)}</span>}
                    {v.expense > 0 && <span className="text-red-400">−{money(v.expense)}</span>}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-600">
        Built from completed transactions in Accounting. POS sales and completed jobs post here automatically.
      </p>
    </div>
  );
}
