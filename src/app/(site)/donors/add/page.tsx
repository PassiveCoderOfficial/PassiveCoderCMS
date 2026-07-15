"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Droplet, Loader2, CheckCircle } from "lucide-react";

const MapPicker = dynamic(() => import("@/components/donors/donor-map").then(m => m.MapPicker), { ssr: false });
import { inputCls, btnCls, Field, donorApi } from "../ui";
import { BLOOD_GROUPS, BD_DISTRICTS, BD_LOCATIONS, RELIGIONS, GENDERS } from "@/lib/donors/bd-locations";

export default function AddDonorPage() {
  const router = useRouter();
  const [me, setMe] = useState<{ id: string; name: string } | null | undefined>(undefined);
  const [areas, setAreas] = useState<string[]>([]);
  const [f, setF] = useState({
    name: "", phone: "", same_whatsapp: true, whatsapp: "",
    blood_group: "", gender: "", religion: "",
    district: "", police_station: "", area: "",
    age_mode: "age" as "age" | "birthdate", age_years: "", birthdate: "",
    last_donated_on: "", never_donated: false,
  });
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    donorApi("/api/donors/auth/me", "GET").then(r => setMe(r.data.donor ?? null));
    donorApi("/api/donors/meta?what=areas", "GET").then(r => setAreas(r.data.areas ?? []));
  }, []);

  const set = (k: string, v: unknown) => { setF(p => ({ ...p, [k]: v })); setError(null); };

  async function submit() {
    if (!f.name.trim() || !f.phone || !f.blood_group) {
      setError("Name, phone and blood group are required"); return;
    }
    setBusy(true); setError(null);
    const r = await donorApi("/api/donors", "POST", {
      name: f.name, phone: f.phone,
      same_whatsapp: f.same_whatsapp, whatsapp: f.whatsapp,
      blood_group: f.blood_group, gender: f.gender, religion: f.religion,
      district: f.district, police_station: f.police_station, area: f.area,
      age_years: f.age_mode === "age" ? f.age_years : "",
      birthdate: f.age_mode === "birthdate" ? f.birthdate : "",
      last_donated_on: f.never_donated ? "" : f.last_donated_on,
      lat: geo?.lat, lng: geo?.lng,
    });
    setBusy(false);
    if (!r.ok) { setError(r.data.error ?? "Failed to save"); return; }
    setCreatedId(r.data.id);
  }

  if (me === undefined) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  if (me === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center space-y-3 max-w-sm">
          <Droplet className="w-10 h-10 text-red-600 mx-auto" />
          <h1 className="text-xl font-bold">Add a donor</h1>
          <p className="text-sm text-gray-500">
            Log in or create a free account first — every entry is linked to who submitted it.
          </p>
          <Link href="/donors/auth?next=/donors/add" className={btnCls}>Log in / Sign up</Link>
        </div>
      </div>
    );
  }

  if (createdId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center space-y-3 max-w-sm">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
          <h1 className="text-xl font-bold">Donor added</h1>
          <p className="text-sm text-gray-500">
            From <strong>My entries</strong> you can set a password so the donor can take over their profile.
          </p>
          <div className="flex gap-2">
            <button onClick={() => { setCreatedId(null); setF(p => ({ ...p, name: "", phone: "", area: "", age_years: "", birthdate: "", last_donated_on: "" })); }}
              className={btnCls}>Add another</button>
            <button onClick={() => router.push(`/donors/${createdId}`)} className={btnCls} style={{ backgroundColor: "#374151" }}>
              View profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  const thanas = f.district ? BD_LOCATIONS[f.district] ?? [] : [];

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="text-center mb-6">
        <Droplet className="w-9 h-9 text-red-600 mx-auto mb-1.5" />
        <h1 className="text-2xl font-bold">Add a Blood Donor</h1>
        <p className="text-sm text-gray-500">Adding as {me.name}. The donor can claim this profile later.</p>
      </div>

      <div className="bg-white border rounded-2xl p-5 space-y-4">
        <Field label="Donor name" required>
          <input className={inputCls} value={f.name} onChange={e => set("name", e.target.value)} />
        </Field>

        <Field label="Phone number" required>
          <div className="flex">
            <span className="inline-flex items-center px-3 border border-r-0 rounded-l-lg bg-gray-50 text-sm text-gray-500">+88</span>
            <input className={`${inputCls} rounded-l-none`} placeholder="01XXXXXXXXX" inputMode="numeric" maxLength={11}
              value={f.phone} onChange={e => set("phone", e.target.value.replace(/\D/g, ""))} />
          </div>
        </Field>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={f.same_whatsapp} onChange={e => set("same_whatsapp", e.target.checked)} className="accent-red-600" />
          WhatsApp is the same number
        </label>
        {!f.same_whatsapp && (
          <Field label="WhatsApp number">
            <div className="flex">
              <span className="inline-flex items-center px-3 border border-r-0 rounded-l-lg bg-gray-50 text-sm text-gray-500">+88</span>
              <input className={`${inputCls} rounded-l-none`} placeholder="01XXXXXXXXX" inputMode="numeric" maxLength={11}
                value={f.whatsapp} onChange={e => set("whatsapp", e.target.value.replace(/\D/g, ""))} />
            </div>
          </Field>
        )}

        <Field label="Blood group" required>
          <div className="grid grid-cols-4 gap-1.5">
            {BLOOD_GROUPS.map(g => (
              <button key={g} type="button" onClick={() => set("blood_group", g)}
                className={`py-2 rounded-lg text-sm font-bold border transition-colors ${
                  f.blood_group === g ? "bg-red-600 border-red-600 text-white" : "hover:border-red-300"}`}>
                {g}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Gender">
            <select className={inputCls} value={f.gender} onChange={e => set("gender", e.target.value)}>
              <option value="">—</option>
              {GENDERS.map(g => <option key={g} value={g}>{g[0].toUpperCase() + g.slice(1)}</option>)}
            </select>
          </Field>
          <Field label="Religion">
            <select className={inputCls} value={f.religion} onChange={e => set("religion", e.target.value)}>
              <option value="">—</option>
              {RELIGIONS.map(r => <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="District">
            <select className={inputCls} value={f.district} onChange={e => { set("district", e.target.value); set("police_station", ""); }}>
              <option value="">—</option>
              {BD_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Police station / Thana">
            <select className={inputCls} value={f.police_station} onChange={e => set("police_station", e.target.value)} disabled={!f.district}>
              <option value="">—</option>
              {thanas.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Location (area / village)">
          <input className={inputCls} list="donor-areas" value={f.area} onChange={e => set("area", e.target.value)} placeholder="e.g. Mirpur DOHS" />
          <datalist id="donor-areas">{areas.map(a => <option key={a} value={a} />)}</datalist>
        </Field>

        <div>
          <button type="button" className="text-xs text-red-600 underline"
            onClick={() => setShowMap(v => !v)}>
            {showMap ? "Hide map" : geo ? "Change map location" : "Pin location on map (optional)"}
          </button>
          {showMap && (
            <div className="mt-2">
              <MapPicker value={geo} onChange={setGeo} />
              <p className="text-[11px] text-gray-500 mt-1">Tap the map to drop the donor&apos;s location pin.</p>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-3 mb-1">
            <label className="text-xs font-medium text-gray-600">Age</label>
            <button type="button" className="text-[11px] text-red-600 underline"
              onClick={() => set("age_mode", f.age_mode === "age" ? "birthdate" : "age")}>
              {f.age_mode === "age" ? "use birth date instead" : "use age instead"}
            </button>
          </div>
          {f.age_mode === "age" ? (
            <input className={inputCls} type="number" min={16} max={70} placeholder="e.g. 27"
              value={f.age_years} onChange={e => set("age_years", e.target.value)} />
          ) : (
            <input className={inputCls} type="date" value={f.birthdate} onChange={e => set("birthdate", e.target.value)} />
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Last donated date</label>
          <input className={inputCls} type="date" disabled={f.never_donated}
            value={f.last_donated_on} onChange={e => set("last_donated_on", e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-gray-600 mt-1.5">
            <input type="checkbox" checked={f.never_donated} onChange={e => set("never_donated", e.target.checked)} className="accent-red-600" />
            Unknown / never donated
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button onClick={submit} disabled={busy} className={btnCls}>
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Save donor
        </button>
      </div>
      <p className="text-center mt-4">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← Back to home</Link>
      </p>
    </div>
  );
}
