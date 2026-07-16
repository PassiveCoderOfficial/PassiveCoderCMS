"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Siren, Loader2, Plus, Phone, MapPin, Clock, Check, X } from "lucide-react";
import { btnCls, donorApi } from "../ui";
import { BLOOD_GROUPS, BD_DISTRICTS } from "@/lib/donors/bd-locations";

interface BloodRequest {
  id: string; patient_name: string | null; blood_group: string;
  bags_needed: number; hospital: string | null;
  district: string | null; police_station: string | null; area: string | null;
  contact_phone: string; note: string | null;
  needed_by: string | null; status: string; created_at: string;
}

const selectCls = "border border-gray-300 rounded-lg px-2.5 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/30";

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState("");
  const [district, setDistrict] = useState("");
  const [me, setMe] = useState<{ id: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ status: "open" });
    if (group) p.set("blood_group", group);
    if (district) p.set("district", district);
    const r = await donorApi(`/api/donors/requests?${p}`, "GET");
    if (r.ok) setRequests(r.data.requests ?? []);
    setLoading(false);
  }, [group, district]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    donorApi("/api/donors/auth/me", "GET").then(r => setMe(r.data.donor ?? null));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Siren className="w-6 h-6 text-red-600" /> Urgent Blood Requests
        </h1>
        <Link href="/donors/requests/new" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Post a request
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        <select className={selectCls} value={group} onChange={e => setGroup(e.target.value)}>
          <option value="">All groups</option>
          {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select className={selectCls} value={district} onChange={e => setDistrict(e.target.value)}>
          <option value="">All districts</option>
          {BD_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm bg-white border rounded-2xl">
          No open requests right now.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <RequestCard key={r.id} req={r} isMine={false} onChanged={load} me={me} />
          ))}
        </div>
      )}

      <p className="text-center">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← Back to home</Link>
      </p>
    </div>
  );
}

function RequestCard({ req, onChanged, me }: {
  req: BloodRequest; isMine: boolean; me: { id: string } | null; onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const where = [req.hospital, req.area, req.police_station, req.district].filter(Boolean).join(", ");

  async function close(status: "fulfilled" | "cancelled") {
    setBusy(true);
    const r = await donorApi("/api/donors/requests", "PATCH", { id: req.id, status });
    setBusy(false);
    if (r.ok) onChanged();
    else alert(r.data.error ?? "Failed");
  }

  return (
    <div className="bg-white border border-red-100 rounded-2xl p-4 space-y-2">
      <div className="flex items-start gap-3">
        <span className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 text-white font-extrabold text-sm shrink-0">
          {req.blood_group}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-gray-900">
            {req.bags_needed} bag{req.bags_needed > 1 ? "s" : ""} needed
            {req.patient_name ? ` for ${req.patient_name}` : ""}
          </p>
          {where && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" /> {where}
            </p>
          )}
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" /> {timeAgo(req.created_at)}
            {req.needed_by && ` · needed by ${new Date(req.needed_by).toLocaleString()}`}
          </p>
        </div>
      </div>

      {req.note && <p className="text-sm text-gray-600">{req.note}</p>}

      <div className="flex items-center gap-2 pt-1">
        <a href={`tel:${req.contact_phone}`}
          className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          <Phone className="w-4 h-4" /> Call
        </a>
        <a href={`https://wa.me/${req.contact_phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          WhatsApp
        </a>
        {me && (
          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={() => close("fulfilled")} disabled={busy}
              className="inline-flex items-center gap-1 text-xs text-green-700 border border-green-200 hover:bg-green-50 px-2.5 py-1.5 rounded-lg">
              <Check className="w-3.5 h-3.5" /> Fulfilled
            </button>
            <button onClick={() => close("cancelled")} disabled={busy}
              className="inline-flex items-center gap-1 text-xs text-gray-500 border border-gray-200 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
