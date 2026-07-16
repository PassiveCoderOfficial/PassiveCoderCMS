"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, Loader2, Search, Plus, Pencil, Trash2, ChevronLeft,
  ChevronRight, Settings2, KeyRound,
} from "lucide-react";
import { btnCls, donorApi } from "../ui";
import { DonorAvatar } from "@/components/donors/donor-avatar";
import { AVAILABILITY_META, type Availability } from "@/lib/donors/availability";

interface AdminDonor {
  id: string; name: string; phone: string;
  blood_group: string; district: string | null; area: string | null;
  availability: Availability; photo_url: string | null;
  is_claimed: boolean; is_admin: boolean; is_active: boolean; has_password: boolean;
}

const inputCls = "bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30";

export default function DonorAdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
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
    const r = await donorApi(`/api/donors/admin?${params}`, "GET");
    if (r.status === 403 || r.status === 401) { setAuthorized(false); return; }
    if (r.ok) {
      setAuthorized(true);
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
    const r = await donorApi("/api/donors/admin", "PATCH", { _type: "settings", otp_required: next });
    if (!r.ok) { setOtpRequired(!next); alert(r.data.error ?? "Failed"); }
  }

  async function del(d: AdminDonor) {
    if (!confirm(`Permanently delete ${d.name} (${d.phone})?`)) return;
    const r = await donorApi(`/api/donors/admin?id=${d.id}`, "DELETE");
    if (r.ok) { setDonors(l => l.filter(x => x.id !== d.id)); setTotal(t => t - 1); }
    else alert(r.data.error ?? "Failed");
  }

  if (authorized === null) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }
  if (!authorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center space-y-3 max-w-sm">
          <ShieldCheck className="w-10 h-10 text-red-600 mx-auto" />
          <p className="text-sm text-gray-500">Admin access only. Log in with an admin account.</p>
          <Link href="/donors/auth?next=/donors/admin" className={btnCls}>Log in</Link>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / 30));

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-red-600" /> Donor Admin
        </h1>
        <Link href="/donors/admin/new" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add entry
        </Link>
      </div>

      <div className="bg-white border rounded-2xl p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold flex items-center gap-1.5"><Settings2 className="w-4 h-4 text-gray-400" /> OTP verification</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {otpRequired
              ? "ON — signup, claim and password reset require SMS codes (needs BDBULKSMS_TOKEN)."
              : "OFF — open signup with phone + password, no SMS. Turn on after SMS token is configured."}
          </p>
        </div>
        <button onClick={toggleOtp}
          className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${otpRequired ? "bg-red-600" : "bg-gray-300"}`}>
          <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${otpRequired ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input className={`${inputCls} pl-9 w-full`} placeholder="Search name, phone, location…" value={q} onChange={e => onSearch(e.target.value)} />
      </div>

      <div className="bg-white border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : donors.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">No entries.</div>
        ) : (
          <div className="divide-y">
            {donors.map((d) => {
              const meta = AVAILABILITY_META[d.availability];
              return (
                <div key={d.id} className={`flex items-center gap-3 px-4 py-3 ${!d.is_active ? "opacity-50" : ""}`}>
                  <DonorAvatar photoUrl={d.photo_url} name={d.name} size={40} />
                  <span className="flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold bg-red-50 text-red-600 shrink-0">
                    {d.blood_group}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/donors/${d.id}`} className="text-sm font-semibold hover:underline truncate">{d.name}</Link>
                      {d.is_admin && <ShieldCheck className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                      {d.is_claimed && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 shrink-0">claimed</span>}
                      {d.has_password && !d.is_claimed && <KeyRound className="w-3 h-3 text-gray-400 shrink-0" />}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {d.phone} · {[d.area, d.district].filter(Boolean).join(", ") || "no location"}
                      {" · "}
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: meta.bg, color: meta.text }}>{meta.label}</span>
                    </div>
                  </div>
                  <Link href={`/donors/admin/${d.id}`} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50"><Pencil className="w-4 h-4" /></Link>
                  <button onClick={() => del(d)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-50"><Trash2 className="w-4 h-4" /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button disabled={page === 0} onClick={() => { const p = page - 1; setPage(p); load(q, p); }}
            className="p-2 border rounded-lg disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-gray-500">{page + 1} / {totalPages} · {total} entries</span>
          <button disabled={page >= totalPages - 1} onClick={() => { const p = page + 1; setPage(p); load(q, p); }}
            className="p-2 border rounded-lg disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}

      <p className="text-center">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← Back to home</Link>
      </p>
    </div>
  );
}
