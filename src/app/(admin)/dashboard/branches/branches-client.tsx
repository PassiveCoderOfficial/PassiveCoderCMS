"use client";

import React, { useState } from "react";
import { Store, Plus, QrCode, Trash2, Copy, Check, Printer } from "lucide-react";

interface TableRow { id: string; table_number: string; qr_token: string; is_active: boolean }
interface Branch { id: string; name: string; address: string | null; phone: string | null; is_active: boolean; restaurant_tables: TableRow[] }

const inputCls = "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40";

function qrImageUrl(url: string) {
  // No QR library added for one feature — a public, keyless QR image
  // service returns a PNG directly, which is all a printable table-tent
  // needs. If this endpoint ever becomes unreliable, swap for a real
  // library then; not worth the dependency weight until it is.
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
}

export default function BranchesClient({ branches: initial, siteUrl }: { branches: Branch[]; siteUrl: string }) {
  const [branches, setBranches] = useState(initial);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: "", address: "", phone: "" });
  const [tableDraft, setTableDraft] = useState<Record<string, string>>({});
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [printTable, setPrintTable] = useState<{ branchName: string; table: TableRow } | null>(null);

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
      alert(data.error ?? "Could not add table");
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

  function tableUrl(qrToken: string) {
    return `${siteUrl}/table/${qrToken}`;
  }

  function copyLink(qrToken: string) {
    navigator.clipboard?.writeText(tableUrl(qrToken)).then(() => {
      setCopiedToken(qrToken);
      setTimeout(() => setCopiedToken(null), 1500);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Store className="w-6 h-6 text-indigo-400" /> Branches
        </h1>
        <button onClick={() => setShowAddBranch(v => !v)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add branch
        </button>
      </div>

      {showAddBranch && (
        <form onSubmit={addBranch} className="bg-gray-900 border border-gray-800 rounded-xl p-4 grid sm:grid-cols-3 gap-3">
          <input required placeholder="Branch name" value={newBranch.name}
            onChange={(e) => setNewBranch(v => ({ ...v, name: e.target.value }))} className={inputCls} />
          <input placeholder="Address (optional)" value={newBranch.address}
            onChange={(e) => setNewBranch(v => ({ ...v, address: e.target.value }))} className={inputCls} />
          <div className="flex gap-2">
            <input placeholder="Phone (optional)" value={newBranch.phone}
              onChange={(e) => setNewBranch(v => ({ ...v, phone: e.target.value }))} className={`${inputCls} flex-1`} />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
              Save
            </button>
          </div>
        </form>
      )}

      {branches.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Store className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No branches yet. Add your first location to start taking dine-in orders.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {branches.map(branch => (
            <div key={branch.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
              <div>
                <h2 className="font-semibold text-white">{branch.name}</h2>
                {branch.address && <p className="text-xs text-gray-500">{branch.address}</p>}
              </div>

              <div className="flex flex-wrap gap-2">
                {branch.restaurant_tables.filter(t => t.is_active).map(t => (
                  <div key={t.id} className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg pl-3 pr-1 py-1">
                    <span className="text-xs text-white">Table {t.table_number}</span>
                    <button onClick={() => setPrintTable({ branchName: branch.name, table: t })} title="Show QR code"
                      className="p-1 text-gray-500 hover:text-indigo-400 rounded"><QrCode className="w-3.5 h-3.5" /></button>
                    <button onClick={() => copyLink(t.qr_token)} title="Copy order link"
                      className="p-1 text-gray-500 hover:text-white rounded">
                      {copiedToken === t.qr_token ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => removeTable(branch.id, t.id)} title="Remove table"
                      className="p-1 text-gray-500 hover:text-red-400 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                <div className="flex items-center gap-1">
                  <input placeholder="Table #" value={tableDraft[branch.id] ?? ""}
                    onChange={(e) => setTableDraft(prev => ({ ...prev, [branch.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addTable(branch.id)}
                    className={`${inputCls} w-24 py-1.5`} />
                  <button onClick={() => addTable(branch.id)}
                    className="p-1.5 text-gray-500 hover:text-indigo-400 rounded-lg border border-dashed border-gray-700 hover:border-indigo-600/60">
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
            <p className="text-sm text-gray-500">{printTable.branchName}</p>
            <p className="text-xl font-bold text-gray-900">Table {printTable.table.table_number}</p>
            {/* eslint-disable-next-line @next/next/no-img-element -- external
                QR image service, not a project asset next/image can optimize */}
            <img src={qrImageUrl(tableUrl(printTable.table.qr_token))} alt="Scan to order" className="mx-auto" width={220} height={220} />
            <p className="text-xs text-gray-500">Scan to view the menu and order</p>
            <div className="flex gap-2 print:hidden">
              <button onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-2 text-sm font-medium">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={() => setPrintTable(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
