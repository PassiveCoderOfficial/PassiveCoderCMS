"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ShieldCheck, Loader2, ArrowLeft, Droplet } from "lucide-react";
import { inputCls, btnCls, Field, donorApi } from "../../ui";
import { BLOOD_GROUPS, BD_DISTRICTS, BD_LOCATIONS, RELIGIONS, GENDERS } from "@/lib/donors/bd-locations";

const MapPicker = dynamic(() => import("@/components/donors/donor-map").then(m => m.MapPicker), { ssr: false });

interface AdminDonor {
  id: string; name: string; phone: string; whatsapp: string;
  blood_group: string; gender: string | null; religion: string | null;
  district: string | null; police_station: string | null; area: string | null;
  age_years: number | null; birthdate: string | null;
  last_donated_on: string | null; is_available: boolean;
  lat: number | null; lng: number | null;
  is_claimed: boolean; is_admin: boolean; is_active: boolean;
}

export default function AdminEditDonorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [donor, setDonor] = useState<AdminDonor | null>(null);
  const [f, setF] = useState({
    name: "", phone: "", whatsapp: "", blood_group: "O+", gender: "", religion: "",
    district: "", police_station: "", area: "", age_years: "", birthdate: "",
    last_donated_on: "", is_active: true, is_admin: false, is_available: true, new_password: "",
  });
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await donorApi(`/api/donors/admin?q=&page=0`, "GET");
    if (r.status === 403 || r.status === 401) { setAuthorized(false); return; }
    setAuthorized(true);
    const found = (r.data.donors ?? []).find((d: AdminDonor) => d.id === id);
    if (found) {
      setDonor(found);
      setF({
        name: found.name, phone: found.phone, whatsapp: found.whatsapp,
        blood_group: found.blood_group, gender: found.gender ?? "", religion: found.religion ?? "",
        district: found.district ?? "", police_station: found.police_station ?? "", area: found.area ?? "",
        age_years: found.age_years ? String(found.age_years) : "", birthdate: found.birthdate ?? "",
        last_donated_on: found.last_donated_on ?? "",
        is_active: found.is_active, is_admin: found.is_admin, is_available: found.is_available,
        new_password: "",
      });
      if (found.lat != null && found.lng != null) setGeo({ lat: found.lat, lng: found.lng });
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setBusy(true); setError(null);
    const payload: Record<string, unknown> = { id, ...f, age_years: f.age_years ? Number(f.age_years) : null, ...(geo ? { lat: geo.lat, lng: geo.lng } : {}) };
    if (!f.new_password) delete payload.new_password;
    const r = await donorApi("/api/donors/admin", "PATCH", payload);
    setBusy(false);
    if (!r.ok) { setError(r.data.error ?? "Failed"); return; }
    router.push("/donors/admin");
  }

  if (authorized === null || (authorized && !donor)) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }
  if (!authorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center space-y-3 max-w-sm">
          <ShieldCheck className="w-10 h-10 text-red-600 mx-auto" />
          <p className="text-sm text-gray-500">Admin access only.</p>
          <Link href="/donors/auth?next=/donors/admin" className={btnCls}>Log in</Link>
        </div>
      </div>
    );
  }

  const thanas = f.district ? BD_LOCATIONS[f.district] ?? [] : [];

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-4">
      <Link href="/donors/admin" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to admin panel
      </Link>

      <div className="text-center">
        <Droplet className="w-8 h-8 text-red-600 mx-auto mb-1.5" />
        <h1 className="text-xl font-bold">Edit {donor!.name}</h1>
      </div>

      <div className="bg-white border rounded-2xl p-5 space-y-3">
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
          {showMap && <div className="mt-2"><MapPicker value={geo} onChange={setGeo} height={220} /></div>}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Age"><input className={inputCls} type="number" value={f.age_years} onChange={e => setF(p => ({ ...p, age_years: e.target.value }))} /></Field>
          <Field label="Birth date"><input className={inputCls} type="date" value={f.birthdate} onChange={e => setF(p => ({ ...p, birthdate: e.target.value }))} /></Field>
          <Field label="Last donated"><input className={inputCls} type="date" value={f.last_donated_on} onChange={e => setF(p => ({ ...p, last_donated_on: e.target.value }))} /></Field>
        </div>

        <div className="border-t pt-3 space-y-3">
          <div className="flex items-center gap-5 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={f.is_active} onChange={e => setF(p => ({ ...p, is_active: e.target.checked }))} className="accent-red-600" />
              Active (visible)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={f.is_admin} onChange={e => setF(p => ({ ...p, is_admin: e.target.checked }))} className="accent-red-600" />
              Admin
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={!f.is_available} onChange={e => setF(p => ({ ...p, is_available: !e.target.checked }))} className="accent-gray-600" />
              Temporarily unavailable
            </label>
          </div>
          <Field label="Reset password (leave blank to keep)">
            <input className={inputCls} value={f.new_password} onChange={e => setF(p => ({ ...p, new_password: e.target.value }))} placeholder="New password" />
          </Field>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button onClick={save} disabled={busy} className={btnCls}>
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Save changes
        </button>
      </div>
    </div>
  );
}
