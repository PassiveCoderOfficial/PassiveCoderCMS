"use client";

import React, { useState } from "react";
import { Store, Plus, QrCode, Trash2, Copy, Check, Printer, Tv, Tablet, ChefHat, KeyRound } from "lucide-react";
import { PrinterNotice } from "@/components/admin/printer-notice";
import { useT } from "@/lib/i18n/language-provider";

interface TableRow { id: string; table_number: string; qr_token: string; is_active: boolean; table_pin: string | null }
interface Branch {
  id: string; name: string; address: string | null; phone: string | null; is_active: boolean;
  kitchen_screen_enabled: boolean; monitor_screen_enabled: boolean; table_screen_enabled: boolean;
  restaurant_tables: TableRow[];
}

const inputCls = "bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40";

function qrImageUrl(url: string) {
  // No QR library added for one feature — a public, keyless QR image
  // service returns a PNG directly, which is all a printable table-tent
  // needs. If this endpoint ever becomes unreliable, swap for a real
  // library then; not worth the dependency weight until it is.
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
}

export default function BranchesClient({ branches: initial, siteUrl }: { branches: Branch[]; siteUrl: string }) {
  const t = useT();
  const [branches, setBranches] = useState(initial);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: "", address: "", phone: "" });
  const [tableDraft, setTableDraft] = useState<Record<string, string>>({});
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [printTable, setPrintTable] = useState<{ branchName: string; table: TableRow } | null>(null);
  const [pinDraft, setPinDraft] = useState<Record<string, string>>({});
  const [savingPin, setSavingPin] = useState<string | null>(null);
  const [savingToggle, setSavingToggle] = useState<string | null>(null);

  async function addBranch(e: React.FormEvent) {
    e.preventDefault();
    if (!newBranch.name.trim()) return;
    const res = await fetch("/api/ecommerce/branches", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newBranch),
    });
    const data = await res.json();
    if (res.ok) {
      setBranches(prev => [...prev, { ...data.branch, restaurant_tables: [] }]);
      setNewBranch({ name: "", address: "", phone: "" });
      setShowAddBranch(false);
    }
  }

  async function addTable(branchId: string) {
    const tableNumber = tableDraft[branchId]?.trim();
    if (!tableNumber) return;
    const res = await fetch("/api/ecommerce/restaurant-tables", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branch_id: branchId, table_number: tableNumber }),
    });
    const data = await res.json();
    if (res.ok) {
      setBranches(prev => prev.map(b => b.id === branchId ? { ...b, restaurant_tables: [...b.restaurant_tables, data.table] } : b));
      setTableDraft(prev => ({ ...prev, [branchId]: "" }));
    } else {
      alert(data.error ?? t("branches.couldNotAddTable"));
    }
  }

  async function removeTable(branchId: string, tableId: string) {
    const res = await fetch("/api/ecommerce/restaurant-tables", {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table_id: tableId }),
    });
    if (res.ok) {
      setBranches(prev => prev.map(b => b.id === branchId
        ? { ...b, restaurant_tables: b.restaurant_tables.filter(t => t.id !== tableId) }
        : b));
    }
  }

  async function toggleScreen(branchId: string, field: "kitchen_screen_enabled" | "monitor_screen_enabled" | "table_screen_enabled", value: boolean) {
    setSavingToggle(`${branchId}:${field}`);
    const res = await fetch("/api/ecommerce/branches", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branch_id: branchId, [field]: value }),
    });
    setSavingToggle(null);
    if (res.ok) {
      setBranches(prev => prev.map(b => b.id === branchId ? { ...b, [field]: value } : b));
    }
  }

  async function saveTablePin(branchId: string, tableId: string) {
    const pin = pinDraft[tableId]?.trim() ?? "";
    setSavingPin(tableId);
    const res = await fetch("/api/ecommerce/restaurant-tables", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table_id: tableId, table_pin: pin }),
    });
    const data = await res.json();
    setSavingPin(null);
    if (res.ok) {
      setBranches(prev => prev.map(b => b.id === branchId
        ? { ...b, restaurant_tables: b.restaurant_tables.map(t => t.id === tableId ? { ...t, table_pin: data.table_pin } : t) }
        : b));
      setPinDraft(prev => ({ ...prev, [tableId]: "" }));
    } else {
      alert(data.error ?? t("branches.couldNotSavePin"));
    }
  }

  function tableUrl(qrToken: string) {
    return `${siteUrl}/table/${qrToken}`;
  }

  function monitorUrl(branchId: string) {
    return `${siteUrl}/monitor/${branchId}`;
  }

  function tableScreenUrl(qrToken: string) {
    return `${siteUrl}/table-screen/${qrToken}`;
  }

  function copyLink(qrToken: string) {
    navigator.clipboard?.writeText(tableUrl(qrToken)).then(() => {
      setCopiedToken(qrToken);
      setTimeout(() => setCopiedToken(null), 1500);
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Store className="w-6 h-6 text-primary" /> {t("branches.title")}
        </h1>
        <button onClick={() => setShowAddBranch(v => !v)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> {t("branches.addBranch")}
        </button>
      </div>

      <PrinterNotice />

      {showAddBranch && (
        <form onSubmit={addBranch} className="bg-card border border-border rounded-xl p-4 grid sm:grid-cols-3 gap-3">
          <input required placeholder={t("branches.branchName")} value={newBranch.name}
            onChange={(e) => setNewBranch(v => ({ ...v, name: e.target.value }))} className={inputCls} />
          <input placeholder={t("branches.addressOptional")} value={newBranch.address}
            onChange={(e) => setNewBranch(v => ({ ...v, address: e.target.value }))} className={inputCls} />
          <div className="flex gap-2">
            <input placeholder={t("branches.phoneOptional")} value={newBranch.phone}
              onChange={(e) => setNewBranch(v => ({ ...v, phone: e.target.value }))} className={`${inputCls} flex-1`} />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
              {t("branches.save")}
            </button>
          </div>
        </form>
      )}

      {branches.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Store className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">{t("branches.noBranchesYet")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {branches.map(branch => (
            <div key={branch.id} className="bg-card border border-border rounded-xl p-4 space-y-4">
              <div>
                <h2 className="font-semibold text-foreground">{branch.name}</h2>
                {branch.address && <p className="text-xs text-muted-foreground">{branch.address}</p>}
              </div>

              {/* Screen toggles — which of KITCHEN/MONITOR/TABLE this branch
                  actually runs (migration 092). Manager picks per operational
                  reality: not every location has a spare screen for MONITOR
                  or tablets for TABLE. */}
              <div className="flex flex-wrap gap-3 pb-3 border-b border-border">
                {([
                  { key: "kitchen_screen_enabled" as const, label: t("branches.kitchen"), icon: ChefHat, href: "/dashboard/kitchen" },
                  { key: "monitor_screen_enabled" as const, label: t("branches.monitor"), icon: Tv, href: monitorUrl(branch.id) },
                  { key: "table_screen_enabled" as const, label: t("branches.tableScreen"), icon: Tablet, href: null },
                ]).map(({ key, label, icon: Icon, href }) => (
                  <div key={key} className="flex items-center gap-2">
                    <button
                      onClick={() => toggleScreen(branch.id, key, !branch[key])}
                      disabled={savingToggle === `${branch.id}:${key}`}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        branch[key]
                          ? "bg-indigo-600/20 border-indigo-600/40 text-indigo-300"
                          : "bg-muted border-border text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {label} {branch[key] ? t("branches.on") : t("branches.off")}
                    </button>
                    {branch[key] && href && (
                      <a href={href} target="_blank" rel="noopener noreferrer" title={t("branches.openLabel", { label })}
                        className="text-xs text-muted-foreground hover:text-primary underline">
                        {t("branches.open")}
                      </a>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {branch.restaurant_tables.filter(tbl => tbl.is_active).map(tbl => (
                  <div key={tbl.id} className="flex flex-wrap items-center gap-1 bg-muted border border-border rounded-lg pl-3 pr-1 py-1.5">
                    <span className="text-xs text-foreground w-20 shrink-0">{t("branches.table", { number: tbl.table_number })}</span>
                    <button onClick={() => setPrintTable({ branchName: branch.name, table: tbl })} title={t("branches.showQrCode")}
                      className="p-1 text-muted-foreground hover:text-primary rounded"><QrCode className="w-3.5 h-3.5" /></button>
                    <button onClick={() => copyLink(tbl.qr_token)} title={t("branches.copyOrderLink")}
                      className="p-1 text-muted-foreground hover:text-foreground rounded">
                      {copiedToken === tbl.qr_token ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => removeTable(branch.id, tbl.id)} title={t("branches.removeTable")}
                      className="p-1 text-muted-foreground hover:text-red-400 rounded"><Trash2 className="w-3.5 h-3.5" /></button>

                    {branch.table_screen_enabled && (
                      <div className="flex items-center gap-1 ml-2 pl-2 border-l border-border">
                        <KeyRound className="w-3 h-3 text-muted-foreground shrink-0" />
                        <input
                          placeholder={tbl.table_pin ? t("branches.pinLabel", { pin: tbl.table_pin }) : t("branches.setPin")}
                          value={pinDraft[tbl.id] ?? ""}
                          maxLength={6}
                          onChange={(e) => setPinDraft(prev => ({ ...prev, [tbl.id]: e.target.value.replace(/\D/g, "") }))}
                          onKeyDown={(e) => e.key === "Enter" && saveTablePin(branch.id, tbl.id)}
                          className={`${inputCls} w-24 py-1 text-xs`}
                        />
                        <button onClick={() => saveTablePin(branch.id, tbl.id)} disabled={savingPin === tbl.id}
                          className="text-xs text-primary hover:text-indigo-300 px-1.5 disabled:opacity-50">
                          {savingPin === tbl.id ? "…" : t("branches.set")}
                        </button>
                        {tbl.table_pin && (
                          <a href={tableScreenUrl(tbl.qr_token)} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary underline shrink-0">
                            {t("branches.openScreen")}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex items-center gap-1">
                  <input placeholder={t("branches.tablePlaceholder")} value={tableDraft[branch.id] ?? ""}
                    onChange={(e) => setTableDraft(prev => ({ ...prev, [branch.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addTable(branch.id)}
                    className={`${inputCls} w-24 py-1.5`} />
                  <button onClick={() => addTable(branch.id)}
                    className="p-1.5 text-muted-foreground hover:text-primary rounded-lg border border-dashed border-border hover:border-indigo-600/60">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {printTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:static print:bg-white">
          <div className="absolute inset-0 bg-black/60 print:hidden" onClick={() => setPrintTable(null)} />
          <div className="relative bg-white rounded-2xl p-8 text-center space-y-4 max-w-xs w-full">
            <p className="text-sm text-muted-foreground">{printTable.branchName}</p>
            <p className="text-xl font-bold text-gray-900">{t("branches.table", { number: printTable.table.table_number })}</p>
            {/* eslint-disable-next-line @next/next/no-img-element -- external
                QR image service, not a project asset next/image can optimize */}
            <img src={qrImageUrl(tableUrl(printTable.table.qr_token))} alt={t("branches.scanToOrder")} className="mx-auto" width={220} height={220} />
            <p className="text-xs text-muted-foreground">{t("branches.scanToOrder")}</p>
            <div className="flex gap-2 print:hidden">
              <button onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-2 text-sm font-medium">
                <Printer className="w-4 h-4" /> {t("branches.print")}
              </button>
              <button onClick={() => setPrintTable(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-muted-foreground/60 rounded-lg px-3 py-2 text-sm font-medium">
                {t("branches.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
