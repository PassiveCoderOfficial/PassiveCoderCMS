"use client";

// page.tsx (Accounting dashboard), transactions/page.tsx, and
// report/page.tsx are all server components (query Supabase directly) —
// same client/server split as pages/pages-header.tsx. Values that need
// translation but are computed server-side (stat card data, transaction
// rows) get passed the raw numbers/data and render their own labels here.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, DollarSign, ArrowUpRight } from "lucide-react";
import { useT } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/locales/en";

export function AccountingDashHeader() {
  const t = useT();
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">{t("acctDash.title")}</h1>
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm"><Link href="/dashboard/accounting/transactions">{t("acctDash.allTransactions")}</Link></Button>
        <Button asChild size="sm"><Link href="/dashboard/accounting/transactions/new">{t("acctDash.addTransaction")}</Link></Button>
      </div>
    </div>
  );
}

const STAT_META: { labelKey: TranslationKey; icon: typeof TrendingUp; color: string; bg: string }[] = [
  { labelKey: "acctDash.monthlyIncome", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
  { labelKey: "acctDash.monthlyExpenses", icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
  { labelKey: "acctDash.netProfit", icon: DollarSign, color: "", bg: "bg-blue-50" },
  { labelKey: "acctDash.todaysRevenue", icon: ArrowUpRight, color: "text-purple-600", bg: "bg-purple-50" },
];

/** Stat cards grid — takes the already-formatted currency strings from the
 *  server component, renders its own translated labels/icons/colors. */
export function AccountingStatCards({ values, profitPositive }: { values: [string, string, string, string]; profitPositive: boolean }) {
  const t = useT();
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STAT_META.map((meta, i) => {
        const color = meta.labelKey === "acctDash.netProfit" ? (profitPositive ? "text-blue-600" : "text-red-600") : meta.color;
        return (
          <div key={meta.labelKey} className="rounded-xl border bg-card p-4">
            <div className={`inline-flex p-2 rounded-lg ${meta.bg} mb-3`}>
              <meta.icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold">{values[i]}</p>
            <p className="text-xs text-muted-foreground mt-1">{t(meta.labelKey)}</p>
          </div>
        );
      })}
    </div>
  );
}

export function AccountingRecentTxHeader() {
  const t = useT();
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold">{t("acctDash.recentTransactions")}</p>
      <Link href="/dashboard/accounting/transactions" className="text-xs text-muted-foreground hover:text-foreground">{t("acctDash.viewAll")}</Link>
    </div>
  );
}

export function NoTransactionsMessage({ variant = "dashboard" }: { variant?: "dashboard" | "list" }) {
  const t = useT();
  return variant === "dashboard"
    ? <p className="text-sm text-center text-muted-foreground py-8">{t("acctDash.noTransactionsYet")}</p>
    : <p className="text-center text-muted-foreground text-sm py-12">{t("acctTx.noTransactionsYet")}</p>;
}

export function TransactionsHeader() {
  const t = useT();
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">{t("acctTx.title")}</h1>
      <Button asChild size="sm"><Link href="/dashboard/accounting/transactions/new"><Plus className="h-4 w-4 mr-2" /> {t("acctTx.addTransaction")}</Link></Button>
    </div>
  );
}

export function TransactionsTableHead() {
  const t = useT();
  return (
    <tr className="border-b text-xs text-muted-foreground">
      <th className="px-4 py-3 text-left font-medium">{t("acctTx.colDescription")}</th>
      <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">{t("acctTx.colType")}</th>
      <th className="px-4 py-3 text-left font-medium hidden md:table-cell">{t("acctTx.colDate")}</th>
      <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">{t("acctTx.colFromTo")}</th>
      <th className="px-4 py-3 text-right font-medium">{t("acctTx.colAmount")}</th>
      <th className="px-4 py-3 text-center font-medium hidden md:table-cell">{t("acctTx.colPublic")}</th>
    </tr>
  );
}

const TX_TYPE_KEY: Record<string, TranslationKey> = {
  income: "acctTx.typeIncome", expense: "acctTx.typeExpense", donation: "acctTx.typeDonation",
  transfer: "acctTx.typeTransfer", refund: "acctTx.typeRefund",
};

export function TxTypeLabel({ type }: { type: string }) {
  const t = useT();
  const key = TX_TYPE_KEY[type];
  return <>{key ? t(key) : type}</>;
}

export function NewTransactionHeader() {
  const t = useT();
  return <h1 className="text-2xl font-bold mb-6">{t("txForm.addTransaction")}</h1>;
}

export function ReportHeading() {
  const t = useT();
  return <>{t("report.title")}</>;
}

/** Tiny inline-text component so the report's plain <p>/<th> tags (styled
 *  individually with their own classNames server-side) can each translate
 *  their own text without needing a bigger wrapper per section. */
export function T({ k }: { k: TranslationKey }) {
  const t = useT();
  return <>{t(k)}</>;
}
