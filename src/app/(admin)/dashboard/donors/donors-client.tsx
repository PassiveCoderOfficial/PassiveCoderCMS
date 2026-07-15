"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Droplet, Loader2, Search, Plus, Pencil, Trash2, ChevronLeft,
  ChevronRight, Settings2, KeyRound, ShieldCheck,
} from "lucide-react";
import { DonorAvatar } from "@/components/donors/donor-avatar";
import { AVAILABILITY_META, type Availability } from "@/lib/donors/availability";

interface AdminDonor {
  id: string; name: string; phone: string;
  blood_group: string; district: string | null; area: string | null;
  availability: Availability; photo_url: string | null;
  is_claimed: boolean; is_admin: boolean; is_active: boolean; has_password: boolean;
}

async function api(path: string, method: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
}

export default function DonorsDashboardClient() {
  const [donors, setDonors] = useState<AdminDonor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpRequired, setOtpRequired] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (query: string, pg: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(pg) });
    if (query) params.set("q", query);
    const r = await api(`/api/donors/admin?${params}`, "GET");
    if (r.ok) {
      setDonors(r.data.donors ?? []); setTotal(r.data.total ?? 0);
      setOtpRequired(!!r.data.settings?.otp_required);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load("", 0); }, [load]);

  function onSearch(v: string) {
    setQ(v); setPage(0);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(v, 0), 300);
  }

  async function toggleOtp() {
    const next = !otpRequired;
    setOtpRequired(next);
    const r = await api("/api/donors/admin", "PATCH", { _type: "settings", otp_required: next });
    if (!r.ok) { setOtpRequired(!next); alert(r.data.error ?? "Failed"); }
  }

  async function del(d: AdminDonor) {
    if (!confirm(`Permanently delete ${d.name} (${d.phone})?`)) return;
    const r = await api(`/api/donors/admin?id=${d.id}`, "DELETE");
    if (r.ok) { setDonors(l => l.filter(x => x.id !== d.id)); setTotal(t => t - 1); }
    else alert(r.data.error ?? "Failed");
  }

  const totalPages = Math.max(1, Math.ceil(total / 30));

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Droplet className="w-6 h-6 text-red-500" fill="currentColor" /> Donors
        </h1>
        <Link href="/dashboard/donors/new"
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add donor
        </Link>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white flex items-center gap-1.5"><Settings2 className="w-4 h-4 text-gray-400" /> OTP verification</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {otpRequired
              ? "ON — signup, claim and password reset require SMS codes (needs BDBULKSMS_TOKEN)."
              : "OFF — open signup with phone + password, no SMS. Turn on after SMS token is configured."}
          </p>
        </div>
        <button onClick={toggleOtp}
          className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${otpRequired ? "bg-red-600" : "bg-gray-600"}`}>
          <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${otpRequired ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input className="bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white w-full placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/30"
          placeholder="Search name, phone, location…" value={q} onChange={e => onSearch(e.target.value)} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 bg-gray-950/50 border-b border-gray-800 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          <span className="w-10 shrink-0" />
          <span className="w-9 shrink-0 text-center">Group</span>
          <span className="min-w-0 flex-1">Name &amp; location</span>
          <span className="shrink-0 w-24 text-center">Status</span>
          <span className="shrink-0 w-16 text-center">Actions</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
        ) : donors.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">No entries.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {donors.map((d) => {
              const meta = AVAILABILITY_META[d.availability];
              return (
                <div key={d.id} className={`flex items-center gap-3 px-4 py-3 ${!d.is_active ? "opacity-50" : ""}`}>
                  <DonorAvatar photoUrl={d.photo_url} name={d.name} size={40} />
                  <span className="flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold bg-red-950 text-red-300 shrink-0">
                    {d.blood_group}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/dashboard/donors/${d.id}`} className="text-sm font-semibold text-white hover:underline truncate">{d.name}</Link>
                      {d.is_admin && <ShieldCheck className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                      {d.is_claimed && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-950 text-green-300 shrink-0">claimed</span>}
                      {d.has_password && !d.is_claimed && <KeyRound className="w-3 h-3 text-gray-500 shrink-0" />}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {d.phone} · {[d.area, d.district].filter(Boolean).join(", ") || "no location"}
                    </div>
                  </div>
                  <span className="shrink-0 w-24 flex justify-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: meta.bg, color: meta.text }}>{meta.label}</span>
                  </span>
                  <div className="shrink-0 w-16 flex items-center justify-center gap-1">
                    <Link href={`/dashboard/donors/${d.id}`} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"><Pencil className="w-4 h-4" /></Link>
                    <button onClick={() => del(d)} className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm text-gray-400">
          <button disabled={page === 0} onClick={() => { const p = page - 1; setPage(p); load(q, p); }}
            className="p-2 border border-gray-700 rounded-lg disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
          <span>{page + 1} / {totalPages} · {total} entries</span>
          <button disabled={page >= totalPages - 1} onClick={() => { const p = page + 1; setPage(p); load(q, p); }}
            className="p-2 border border-gray-700 rounded-lg disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}
