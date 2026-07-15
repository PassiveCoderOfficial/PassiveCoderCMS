"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Loader2, ArrowLeft, Droplet } from "lucide-react";
import { BLOOD_GROUPS, BD_DISTRICTS, BD_LOCATIONS, RELIGIONS, GENDERS } from "@/lib/donors/bd-locations";
import { SocialLinksEditor } from "@/components/donors/social-links";

const MapPicker = dynamic(() => import("@/components/donors/donor-map").then(m => m.MapPicker), { ssr: false });

const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/30";
const labelCls = "block text-xs font-medium text-gray-400 mb-1";

async function api(path: string, method: string, body?: unknown) {
  const res = await fetch(path, {
    method, headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
}

export function DonorDashboardForm({ donorId }: { donorId?: string }) {
  const router = useRouter();
  const [ready, setReady] = useState(!donorId);
  const [f, setF] = useState({
    name: "", phone: "", whatsapp: "", blood_group: "O+", gender: "", religion: "",
    district: "", police_station: "", area: "", age_years: "", birthdate: "",
    last_donated_on: "", never_donated: false, date_unknown: false,
    is_active: true, is_admin: false, is_available: true, new_password: "",
  });
  const [socials, setSocials] = useState<Record<string, string>>({});
  const [areas, setAreas] = useState<string[]>([]);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!donorId) return;
    const r = await api(`/api/donors/admin?q=&page=0`, "GET");
    const d = (r.data.donors ?? []).find((x: { id: string }) => x.id === donorId);
    if (d) {
      setF({
        name: d.name, phone: d.phone, whatsapp: d.whatsapp,
        blood_group: d.blood_group, gender: d.gender ?? "", religion: d.religion ?? "",
        district: d.district ?? "", police_station: d.police_station ?? "", area: d.area ?? "",
        age_years: d.age_years ? String(d.age_years) : "", birthdate: d.birthdate ?? "",
        last_donated_on: d.last_donated_on ?? "",
        never_donated: d.never_donated, date_unknown: !d.last_donated_on && !d.never_donated,
        is_active: d.is_active, is_admin: d.is_admin, is_available: d.is_available, new_password: "",
      });
      setSocials(d.socials ?? {});
      if (d.lat != null && d.lng != null) setGeo({ lat: d.lat, lng: d.lng });
    }
    setReady(true);
  }, [donorId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (f.district && f.police_station) {
      api(`/api/donors/meta?what=areas&district=${encodeURIComponent(f.district)}&police_station=${encodeURIComponent(f.police_station)}`, "GET")
        .then(r => setAreas(r.data.areas ?? []));
    } else setAreas([]);
  }, [f.district, f.police_station]);

  const set = (k: string, v: unknown) => { setF(p => ({ ...p, [k]: v })); setError(null); };

  async function save() {
    setBusy(true); setError(null);
    const payload: Record<string, unknown> = {
      ...f,
      age_years: f.age_years ? Number(f.age_years) : null,
      last_donated_on: (f.never_donated || f.date_unknown) ? "" : f.last_donated_on,
      socials,
      ...(geo ? { lat: geo.lat, lng: geo.lng } : {}),
    };
    delete (payload as { date_unknown?: unknown }).date_unknown;
    if (!f.new_password) delete payload.new_password;
    const r = donorId
      ? await api("/api/donors/admin", "PATCH", { id: donorId, ...payload })
      : await api("/api/donors/admin", "POST", payload);
    setBusy(false);
    if (!r.ok) { setError(r.data.error ?? "Failed"); return; }
    router.push("/dashboard/donors");
  }

  if (!ready) return <div className="p-6 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>;

  const thanas = f.district ? BD_LOCATIONS[f.district] ?? [] : [];

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <Link href="/dashboard/donors" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to donors
      </Link>
      <h1 className="text-xl font-bold text-white flex items-center gap-2">
        <Droplet className="w-5 h-5 text-red-500" fill="currentColor" /> {donorId ? `Edit ${f.name}` : "New donor"}
      </h1>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <div><label className={labelCls}>Name *</label><input className={inputCls} value={f.name} onChange={e => set("name", e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Phone *</label><input className={inputCls} placeholder="01XXXXXXXXX" value={f.phone} onChange={e => set("phone", e.target.value)} /></div>
          <div><label className={labelCls}>WhatsApp</label><input className={inputCls} placeholder="01XXXXXXXXX" value={f.whatsapp} onChange={e => set("whatsapp", e.target.value)} /></div>
        </div>
        <div><label className={labelCls}>Blood group *</label>
          <select className={inputCls} value={f.blood_group} onChange={e => set("blood_group", e.target.value)}>
            {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Gender</label>
            <select className={inputCls} value={f.gender} onChange={e => set("gender", e.target.value)}>
              <option value="">—</option>{GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Religion</label>
            <select className={inputCls} value={f.religion} onChange={e => set("religion", e.target.value)}>
              <option value="">—</option>{RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>District</label>
            <select className={inputCls} value={f.district} onChange={e => { set("district", e.target.value); set("police_station", ""); set("area", ""); }}>
              <option value="">—</option>{BD_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Thana</label>
            <select className={inputCls} value={f.police_station} onChange={e => { set("police_station", e.target.value); set("area", ""); }} disabled={!f.district}>
              <option value="">—</option>{thanas.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div><label className={labelCls}>Area</label>
          <input className={inputCls} list="dash-areas" value={f.area} onChange={e => set("area", e.target.value)}
            disabled={!f.district || !f.police_station}
            placeholder={f.district && f.police_station ? "e.g. Mirpur DOHS" : "Pick district & thana first"} />
          {f.district && f.police_station && <datalist id="dash-areas">{areas.map(a => <option key={a} value={a} />)}</datalist>}
        </div>
        <div>
          <label className={labelCls}>Pin location on map</label>
          <MapPicker value={geo} onChange={setGeo} height={220} autoGps={!geo} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Age</label><input className={inputCls} type="number" value={f.age_years} onChange={e => set("age_years", e.target.value)} /></div>
          <div><label className={labelCls}>Birth date</label><input className={inputCls} type="date" value={f.birthdate} onChange={e => set("birthdate", e.target.value)} /></div>
        </div>
        <div>
          <label className={labelCls}>Last donated date</label>
          <input className={inputCls} type="date" disabled={f.never_donated || f.date_unknown}
            value={f.last_donated_on} onChange={e => set("last_donated_on", e.target.value)} />
          <div className="flex flex-col gap-1.5 mt-2">
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <input type="checkbox" checked={f.never_donated} onChange={e => { set("never_donated", e.target.checked); if (e.target.checked) set("date_unknown", false); }} className="accent-green-600" />
              Never donated <span className="text-[11px] text-green-400">(green)</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <input type="checkbox" checked={f.date_unknown} onChange={e => { set("date_unknown", e.target.checked); if (e.target.checked) set("never_donated", false); }} className="accent-yellow-500" />
              Date unknown <span className="text-[11px] text-yellow-400">(yellow)</span>
            </label>
          </div>
        </div>
        <div><label className={labelCls}>Social / contact links</label><SocialLinksEditor socials={socials} onChange={setSocials} /></div>

        <div className="border-t border-gray-800 pt-3 space-y-3">
          <div className="flex items-center gap-5 flex-wrap text-sm text-gray-400">
            <label className="flex items-center gap-2"><input type="checkbox" checked={f.is_active} onChange={e => set("is_active", e.target.checked)} className="accent-red-600" /> Active (visible)</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={f.is_admin} onChange={e => set("is_admin", e.target.checked)} className="accent-red-600" /> Admin</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!f.is_available} onChange={e => set("is_available", !e.target.checked)} className="accent-gray-500" /> Temporarily unavailable</label>
          </div>
          {donorId && (
            <div><label className={labelCls}>Reset password (blank = keep)</label><input className={inputCls} value={f.new_password} onChange={e => set("new_password", e.target.value)} placeholder="New password" /></div>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <button onClick={save} disabled={busy}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} {donorId ? "Save changes" : "Create donor"}
        </button>
      </div>
    </div>
  );
}
