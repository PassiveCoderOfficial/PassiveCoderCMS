"use client";

import { useState } from "react";
import {
  AlertTriangle, MapPin, Phone, MessageCircle, CheckCircle2, Ban, Store, Clock,
} from "lucide-react";

interface Vendor { id: string; name: string; phone: string | null; }
interface ServiceRequest {
  id: string; description: string | null; customer_name: string | null; customer_phone: string | null;
  address: string | null; urgency: "regular" | "urgent";
  status: "open" | "claimed" | "fulfilled" | "cancelled" | "archived";
  claimed_by_vendor_id: string | null; notified_count: number; created_at: string;
  service_subcategories?: { id: string; name: string } | null;
  vendors?: { id: string; name: string; phone: string | null } | null;
}

const STATUS_META: Record<ServiceRequest["status"], { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-gray-800 text-gray-400 border-gray-700" },
  claimed: { label: "Claimed", cls: "bg-blue-900/50 text-blue-300 border-blue-700/50" },
  fulfilled: { label: "Fulfilled", cls: "bg-green-900/50 text-green-300 border-green-700/50" },
  cancelled: { label: "Cancelled", cls: "bg-gray-800 text-gray-500 border-gray-700" },
  archived: { label: "Archived", cls: "bg-gray-800 text-gray-500 border-gray-700" },
};

const btnGhost = "inline-flex items-center gap-1.5 border border-gray-700 hover:bg-gray-800 text-gray-300 px-2.5 py-1.5 rounded-lg text-xs transition-colors";

/** wa.me deep link with the request brief prefilled — no WhatsApp API needed,
 *  same pattern as staffWaLink() in src/app/(admin)/dashboard/jobs/jobs-client.tsx. */
function buyerWaLink(r: ServiceRequest) {
  const lines = [
    `Hi ${r.customer_name ?? "there"}, regarding your ${r.service_subcategories?.name ?? "service"} request`,
    r.address ? `at ${r.address}` : null,
    r.description ? `— ${r.description}` : null,
  ].filter(Boolean).join(" ");
  return `https://wa.me/${(r.customer_phone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(lines)}`;
}

export default function RequestsClient({ initialRequests, vendors }: { initialRequests: ServiceRequest[]; vendors: Vendor[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState<string>("open");
  const [busy, setBusy] = useState<string | null>(null);

  async function patch(r: ServiceRequest, fields: Record<string, unknown>) {
    setBusy(r.id);
    const res = await fetch("/api/marketplace/requests", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, ...fields }),
    });
    if (res.ok) { const d = await res.json(); setRequests(l => l.map(x => x.id === r.id ? d : x)); }
    setBusy(null);
  }

  const shown = requests.filter(r => filter === "all" || r.status === filter);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <AlertTriangle className="w-6 h-6 text-indigo-400" /> Service Requests
      </h1>
      <p className="text-sm text-gray-500">Open jobs buyers posted without picking a vendor. Urgent ones auto-notify nearby vendors every 10 minutes until claimed.</p>

      <div className="flex gap-2 flex-wrap">
        {(["open", "claimed", "fulfilled", "cancelled", "all"] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
              filter === s ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-700 text-gray-400 hover:border-gray-500"
            }`}>{s}</button>
        ))}
      </div>

      <div className="space-y-3">
        {shown.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl text-center py-16 text-gray-500 text-sm">
            No requests here.
          </div>
        )}
        {shown.map((r) => (
          <div key={r.id} className={`bg-gray-900 border rounded-xl p-4 space-y-3 ${r.urgency === "urgent" ? "border-red-700/50" : "border-gray-800"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {r.urgency === "urgent" && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-900/50 text-red-300 border border-red-700/50">
                      <AlertTriangle className="w-3 h-3" /> Urgent
                    </span>
                  )}
                  <span className="text-sm font-semibold text-white">{r.service_subcategories?.name ?? "Service"}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_META[r.status].cls}`}>{STATUS_META[r.status].label}</span>
                  {r.urgency === "urgent" && r.notified_count > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3 h-3" /> {r.notified_count} notified</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
                  {r.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.address}</span>}
                  {r.customer_name && <span>{r.customer_name}</span>}
                </div>
                {r.description && <p className="text-xs text-gray-400 mt-1.5">{r.description}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {r.customer_phone && (
                <>
                  <a href={buyerWaLink(r)} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-green-600/20 border border-green-700/50 text-green-300 hover:bg-green-600/30 px-2.5 py-1.5 rounded-lg text-xs transition-colors">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp buyer
                  </a>
                  <a href={`tel:${r.customer_phone}`} className={btnGhost}>
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                </>
              )}

              <select className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                value={r.claimed_by_vendor_id ?? ""} disabled={busy === r.id}
                onChange={(e) => patch(r, { claimed_by_vendor_id: e.target.value || null })}>
                <option value="">Unclaimed</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              {r.vendors?.phone && (
                <a href={`https://wa.me/${r.vendors.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className={btnGhost}>
                  <Store className="w-3.5 h-3.5" /> Message vendor
                </a>
              )}

              <div className="ml-auto flex items-center gap-1.5">
                {["open", "claimed"].includes(r.status) && (
                  <button disabled={busy === r.id} onClick={() => patch(r, { status: "fulfilled" })}
                    className="inline-flex items-center gap-1.5 text-xs text-green-300 border border-green-700/50 bg-green-900/30 hover:bg-green-900/50 px-2.5 py-1.5 rounded-lg transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Fulfilled
                  </button>
                )}
                {!["fulfilled", "cancelled"].includes(r.status) && (
                  <button disabled={busy === r.id} onClick={() => patch(r, { status: "cancelled" })}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-400 border border-gray-700 hover:bg-gray-800 px-2.5 py-1.5 rounded-lg transition-colors">
                    <Ban className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
