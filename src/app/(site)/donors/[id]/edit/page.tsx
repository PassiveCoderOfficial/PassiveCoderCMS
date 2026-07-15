"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Pencil, Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { inputCls, btnCls, Field, donorApi } from "../../ui";
import { SocialLinksEditor } from "@/components/donors/social-links";
import { BLOOD_GROUPS, BD_DISTRICTS, BD_LOCATIONS } from "@/lib/donors/bd-locations";

const MapPicker = dynamic(() => import("@/components/donors/donor-map").then(m => m.MapPicker), { ssr: false });

interface Profile {
  id: string; name: string; blood_group: string;
  district: string | null; police_station: string | null; area: string | null;
  last_donated_on: string | null; never_donated: boolean; is_available: boolean;
  lat: number | null; lng: number | null; socials: Record<string, string>;
}

export default function EditDonorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [canManage, setCanManage] = useState<boolean | null>(null);
  const [f, setF] = useState({ name: "", blood_group: "O+", district: "", police_station: "", area: "", last_donated_on: "", never_donated: false, date_unknown: false });
  const [socials, setSocials] = useState<Record<string, string>>({});
  const [areas, setAreas] = useState<string[]>([]);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
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
        never_donated: p.never_donated,
        date_unknown: !p.last_donated_on && !p.never_donated,
      });
      setSocials(p.socials ?? {});
      if (p.lat != null && p.lng != null) setGeo({ lat: p.lat, lng: p.lng });
    } else {
      setCanManage(false);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (f.district && f.police_station) {
      donorApi(`/api/donors/meta?what=areas&district=${encodeURIComponent(f.district)}&police_station=${encodeURIComponent(f.police_station)}`, "GET")
        .then(r => setAreas(r.data.areas ?? []));
    } else setAreas([]);
  }, [f.district, f.police_station]);

  async function save() {
    setSaving(true); setError(null);
    const r = await donorApi(`/api/donors/${id}`, "PATCH", {
      name: f.name, blood_group: f.blood_group,
      district: f.district, police_station: f.police_station, area: f.area,
      last_donated_on: (f.never_donated || f.date_unknown) ? "" : f.last_donated_on,
      never_donated: f.never_donated,
      socials,
      ...(geo ? { lat: geo.lat, lng: geo.lng } : {}),
    });
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
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
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
            <select className={inputCls} value={f.district} onChange={e => setF(p => ({ ...p, district: e.target.value, police_station: "", area: "" }))}>
              <option value="">—</option>
              {BD_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Thana">
            <select className={inputCls} value={f.police_station} onChange={e => setF(p => ({ ...p, police_station: e.target.value, area: "" }))} disabled={!f.district}>
              <option value="">—</option>
              {thanas.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Area">
          <input className={inputCls} list="edit-areas" value={f.area}
            onChange={e => setF(p => ({ ...p, area: e.target.value }))}
            disabled={!f.district || !f.police_station}
            placeholder={f.district && f.police_station ? "e.g. Mirpur DOHS" : "Pick district & thana first"} />
          {f.district && f.police_station && <datalist id="edit-areas">{areas.map(a => <option key={a} value={a} />)}</datalist>}
        </Field>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Pin location on map</label>
          <MapPicker value={geo} onChange={setGeo} height={220} autoGps={!geo} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Last donated date</label>
          <input type="date" className={inputCls} disabled={f.never_donated || f.date_unknown}
            value={f.last_donated_on} onChange={e => setF(p => ({ ...p, last_donated_on: e.target.value }))} />
          <div className="flex flex-col gap-1.5 mt-2">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={f.never_donated}
                onChange={e => setF(p => ({ ...p, never_donated: e.target.checked, date_unknown: e.target.checked ? false : p.date_unknown }))}
                className="accent-green-600" />
              Never donated <span className="text-[11px] text-green-700">(green)</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={f.date_unknown}
                onChange={e => setF(p => ({ ...p, date_unknown: e.target.checked, never_donated: e.target.checked ? false : p.never_donated }))}
                className="accent-yellow-500" />
              Date unknown <span className="text-[11px] text-yellow-700">(yellow)</span>
            </label>
          </div>
        </div>
        <Field label="Social / contact links">
          <SocialLinksEditor socials={socials} onChange={setSocials} />
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
