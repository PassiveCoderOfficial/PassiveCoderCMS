"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ShieldCheck, Loader2, Search, Plus, Pencil, Trash2, X, ChevronLeft,
  ChevronRight, Settings2, KeyRound, Droplet,
} from "lucide-react";
import { inputCls, btnCls, Field, donorApi } from "../ui";
import { DonorAvatar } from "@/components/donors/donor-avatar";
import { AVAILABILITY_META, type Availability } from "@/lib/donors/availability";
import { BLOOD_GROUPS, BD_DISTRICTS, BD_LOCATIONS, RELIGIONS, GENDERS } from "@/lib/donors/bd-locations";

const MapPicker = dynamic(() => import("@/components/donors/donor-map").then(m => m.MapPicker), { ssr: false });

interface AdminDonor {
  id: string; name: string; phone: string; whatsapp: string;
  blood_group: string; gender: string | null; religion: string | null;
  district: string | null; police_station: string | null; area: string | null;
  age: number | null; birthdate: string | null; age_years: number | null;
  last_donated_on: string | null; availability: Availability;
  photo_url: string | null; lat: number | null; lng: number | null;
  is_claimed: boolean; is_admin: boolean; is_active: boolean;
  has_password: boolean; created_at: string;
}

export default function DonorAdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [donors, setDonors] = useState<AdminDonor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpRequired, setOtpRequired] = useState(false);
  const [editing, setEditing] = useState<AdminDonor | "new" | null>(null);
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
        <button onClick={() => setEditing("new")} className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add entry
        </button>
      </div>

      {/* Settings */}
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
          className={`relative w-12 h-6.5 h-7 rounded-full transition-colors shrink-0 ${otpRequired ? "bg-red-600" : "bg-gray-300"}`}>
          <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${otpRequired ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input className={`${inputCls} pl-9`} placeholder="Search name, phone, location…" value={q} onChange={e => onSearch(e.target.value)} />
      </div>

      {/* Entries */}
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
                  <button onClick={() => setEditing(d)} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50"><Pencil className="w-4 h-4" /></button>
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

      {editing && (
        <AdminEditModal
          donor={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onDone={() => { setEditing(null); load(q, page); }}
        />
      )}
    </div>
  );
}

function AdminEditModal({ donor, onClose, onDone }: {
  donor: AdminDonor | null; onClose: () => void; onDone: () => void;
}) {
  const [f, setF] = useState({
    name: donor?.name ?? "", phone: donor?.phone ?? "", whatsapp: donor?.whatsapp ?? "",
    blood_group: donor?.blood_group ?? "O+", gender: donor?.gender ?? "", religion: donor?.religion ?? "",
    district: donor?.district ?? "", police_station: donor?.police_station ?? "", area: donor?.area ?? "",
    age_years: donor?.age_years ? String(donor.age_years) : "", birthdate: donor?.birthdate ?? "",
    last_donated_on: donor?.last_donated_on ?? "",
    is_active: donor?.is_active ?? true, is_admin: donor?.is_admin ?? false,
    new_password: "",
  });
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(
    donor?.lat != null && donor?.lng != null ? { lat: donor.lat, lng: donor.lng } : null);
  const [showMap, setShowMap] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const thanas = f.district ? BD_LOCATIONS[f.district] ?? [] : [];

  async function save() {
    setBusy(true); setError(null);
    const payload: Record<string, unknown> = {
      ...f,
      age_years: f.age_years ? Number(f.age_years) : null,
      ...(geo ? { lat: geo.lat, lng: geo.lng } : {}),
    };
    if (!f.new_password) delete payload.new_password;
    const r = donor
      ? await donorApi("/api/donors/admin", "PATCH", { id: donor.id, ...payload })
      : await donorApi("/api/donors/admin", "POST", payload);
    setBusy(false);
    if (!r.ok) { setError(r.data.error ?? "Failed"); return; }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl p-5 space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <Droplet className="w-4 h-4 text-red-600" /> {donor ? `Edit ${donor.name}` : "New entry"}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>

        <Field label="Name" required><input className={inputCls} value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone" required>
            <input className={inputCls} placeholder="01XXXXXXXXX" value={f.phone} onChange={e => setF(p => ({ ...p, phone: e.target.value }))} />
          </Field>
          <Field label="WhatsApp">
            <input className={inputCls} placeholder="01XXXXXXXXX" value={f.whatsapp} onChange={e => setF(p => ({ ...p, whatsapp: e.target.value }))} />
          </Field>
        </div>
        <Field label="Blood group" required>
          <select className={inputCls} value={f.blood_group} onChange={e => setF(p => ({ ...p, blood_group: e.target.value }))}>
            {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Gender">
            <select className={inputCls} value={f.gender} onChange={e => setF(p => ({ ...p, gender: e.target.value }))}>
              <option value="">—</option>
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Religion">
            <select className={inputCls} value={f.religion} onChange={e => setF(p => ({ ...p, religion: e.target.value }))}>
              <option value="">—</option>
              {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="District">
            <select className={inputCls} value={f.district} onChange={e => setF(p => ({ ...p, district: e.target.value, police_station: "" }))}>
              <option value="">—</option>
              {BD_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Thana">
            <select className={inputCls} value={f.police_station} onChange={e => setF(p => ({ ...p, police_station: e.target.value }))} disabled={!f.district}>
              <option value="">—</option>
              {thanas.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Location (area / village)"><input className={inputCls} value={f.area} onChange={e => setF(p => ({ ...p, area: e.target.value }))} /></Field>
        <div>
          <button type="button" className="text-xs text-red-600 underline" onClick={() => setShowMap(v => !v)}>
            {showMap ? "Hide map" : geo ? "Change map location" : "Pin location on map"}
          </button>
          {showMap && <div className="mt-2"><MapPicker value={geo} onChange={setGeo} height={200} /></div>}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Age"><input className={inputCls} type="number" value={f.age_years} onChange={e => setF(p => ({ ...p, age_years: e.target.value }))} /></Field>
          <Field label="Birth date"><input className={inputCls} type="date" value={f.birthdate} onChange={e => setF(p => ({ ...p, birthdate: e.target.value }))} /></Field>
          <Field label="Last donated"><input className={inputCls} type="date" value={f.last_donated_on} onChange={e => setF(p => ({ ...p, last_donated_on: e.target.value }))} /></Field>
        </div>

        {donor && (
          <div className="border-t pt-3 space-y-3">
            <div className="flex items-center gap-5">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={f.is_active} onChange={e => setF(p => ({ ...p, is_active: e.target.checked }))} className="accent-red-600" />
                Active (visible)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={f.is_admin} onChange={e => setF(p => ({ ...p, is_admin: e.target.checked }))} className="accent-red-600" />
                Admin
              </label>
            </div>
            <Field label="Reset password (leave blank to keep)">
              <input className={inputCls} value={f.new_password} onChange={e => setF(p => ({ ...p, new_password: e.target.value }))} placeholder="New password" />
            </Field>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button onClick={save} disabled={busy} className={btnCls}>
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} {donor ? "Save changes" : "Create entry"}
        </button>
      </div>
    </div>
  );
}
