"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Pencil, Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { inputCls, btnCls, Field, donorApi } from "../../ui";
import { BLOOD_GROUPS, BD_DISTRICTS, BD_LOCATIONS } from "@/lib/donors/bd-locations";

const MapPicker = dynamic(() => import("@/components/donors/donor-map").then(m => m.MapPicker), { ssr: false });

interface Profile {
  id: string; name: string; blood_group: string;
  district: string | null; police_station: string | null; area: string | null;
  last_donated_on: string | null; is_available: boolean;
  lat: number | null; lng: number | null;
}

export default function EditDonorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [canManage, setCanManage] = useState<boolean | null>(null);
  const [f, setF] = useState({ name: "", blood_group: "O+", district: "", police_station: "", area: "", last_donated_on: "" });
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const r = await donorApi(`/api/donors/${id}`, "GET");
    if (r.ok) {
      const p: Profile = r.data.donor;
      setProfile(p);
      setCanManage(!!r.data.viewer?.can_manage);
      setF({
        name: p.name, blood_group: p.blood_group,
        district: p.district ?? "", police_station: p.police_station ?? "",
        area: p.area ?? "", last_donated_on: p.last_donated_on ?? "",
      });
      if (p.lat != null && p.lng != null) setGeo({ lat: p.lat, lng: p.lng });
    } else {
      setCanManage(false);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true); setError(null);
    const r = await donorApi(`/api/donors/${id}`, "PATCH", { ...f, ...(geo ? { lat: geo.lat, lng: geo.lng } : {}) });
    setSaving(false);
    if (!r.ok) { setError(r.data.error ?? "Failed"); return; }
    router.push(`/donors/${id}`);
  }

  async function del() {
    if (!profile || !confirm(`Delete ${profile.name}'s profile? This cannot be undone.`)) return;
    setError(null);
    const r = await donorApi(`/api/donors/${id}`, "DELETE");
    if (!r.ok) { setError(r.data.error ?? "Failed to delete"); return; }
    router.push("/");
  }

  if (loading || canManage === null) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }
  if (!canManage || !profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 text-center">
        <p className="text-sm text-gray-500">You don&apos;t have permission to edit this profile.</p>
      </div>
    );
  }

  const thanas = f.district ? BD_LOCATIONS[f.district] ?? [] : [];

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-4">
      <Link href={`/donors/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to profile
      </Link>

      <div className="text-center">
        <Pencil className="w-8 h-8 text-red-600 mx-auto mb-1.5" />
        <h1 className="text-xl font-bold">Edit {profile.name}</h1>
      </div>

      <div className="bg-white border rounded-2xl p-5 space-y-3">
        <Field label="Name"><input className={inputCls} value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} /></Field>
        <Field label="Blood group">
          <select className={inputCls} value={f.blood_group} onChange={e => setF(p => ({ ...p, blood_group: e.target.value }))}>
            {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
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
        <Field label="Last donated date">
          <input type="date" className={inputCls} value={f.last_donated_on} onChange={e => setF(p => ({ ...p, last_donated_on: e.target.value }))} />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button onClick={save} disabled={saving} className={btnCls}>
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save changes
        </button>
        <button onClick={del}
          className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <Trash2 className="w-4 h-4" /> Delete this profile
        </button>
      </div>
    </div>
  );
}
