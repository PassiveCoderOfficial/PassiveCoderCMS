"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Siren, Loader2, Plus, RotateCcw } from "lucide-react";
import { donorApi } from "../ui";
import { RequestCard, type BloodRequest } from "@/components/donors/request-card";
import { BLOOD_GROUPS, BD_DISTRICTS, BD_LOCATIONS } from "@/lib/donors/bd-locations";

type View = "open" | "deadline_over" | "mine";

const TABS: Array<{ id: View; label: string }> = [
  { id: "open", label: "Open" },
  { id: "deadline_over", label: "Deadline over" },
  { id: "mine", label: "My requests" },
];

const selectCls = "border border-gray-300 rounded-lg px-2.5 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/30";

export default function RequestsPage() {
  const [view, setView] = useState<View>("open");
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [f, setF] = useState({ blood_group: "", district: "", police_station: "" });

  const load = useCallback(async () => {
    setLoading(true); setNeedsLogin(false);
    const p = new URLSearchParams({ view });
    if (f.blood_group) p.set("blood_group", f.blood_group);
    if (f.district) p.set("district", f.district);
    if (f.police_station) p.set("police_station", f.police_station);
    const r = await donorApi(`/api/donors/requests?${p}`, "GET");
    if (r.status === 401) { setNeedsLogin(true); setRequests([]); }
    else if (r.ok) setRequests(r.data.requests ?? []);
    setLoading(false);
  }, [view, f]);

  useEffect(() => { load(); }, [load]);

  const thanas = f.district ? BD_LOCATIONS[f.district] ?? [] : [];
  const hasFilter = !!(f.blood_group || f.district || f.police_station);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Siren className="w-6 h-6 text-red-600" /> Urgent Blood Requests
        </h1>
        <Link href="/donors/requests/new"
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700">
          <Plus className="w-4 h-4" /> Post a request
        </Link>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setView(t.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              view === t.id
                ? "border-red-600 text-red-700"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <select className={selectCls} value={f.blood_group}
          onChange={e => setF(p => ({ ...p, blood_group: e.target.value }))}>
          <option value="">All groups</option>
          {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select className={selectCls} value={f.district}
          onChange={e => setF(p => ({ ...p, district: e.target.value, police_station: "" }))}>
          <option value="">All districts</option>
          {BD_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className={selectCls} value={f.police_station} disabled={!f.district}
          onChange={e => setF(p => ({ ...p, police_station: e.target.value }))}>
          <option value="">{f.district ? "All thanas" : "Pick district first"}</option>
          {thanas.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {hasFilter && (
          <button onClick={() => setF({ blood_group: "", district: "", police_station: "" })}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-800">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : needsLogin ? (
        <div className="rounded-2xl border bg-white py-16 text-center">
          <p className="text-sm text-gray-500 mb-3">Log in to see the requests you posted.</p>
          <Link href="/donors/auth?next=/donors/requests"
            className="inline-flex rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">
            Log in
          </Link>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border bg-white py-16 text-center text-sm text-gray-500">
          {view === "mine" ? "You haven't posted any requests yet."
            : view === "deadline_over" ? "No requests are past their deadline."
            : "No open requests right now."}
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <RequestCard key={r.id} req={r} onChanged={load} />
          ))}
        </div>
      )}

      <p className="text-center">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← Back to home</Link>
      </p>
    </div>
  );
}
