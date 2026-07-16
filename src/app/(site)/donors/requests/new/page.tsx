"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Siren, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { inputCls, btnCls, Field, donorApi } from "../../ui";
import { BLOOD_GROUPS, BD_DISTRICTS, BD_LOCATIONS } from "@/lib/donors/bd-locations";

const MapPicker = dynamic(() => import("@/components/donors/donor-map").then(m => m.MapPicker), { ssr: false });

export default function NewRequestPage() {
  const router = useRouter();
  const [me, setMe] = useState<{ id: string; name: string; phone: string } | null | undefined>(undefined);
  const [f, setF] = useState({
    patient_name: "", blood_group: "", bags_needed: "1", hospital: "",
    district: "", police_station: "", area: "", contact_phone: "", note: "", needed_by: "", radius_km: "10",
  });
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ notified: number } | null>(null);

  useEffect(() => {
    donorApi("/api/donors/auth/me", "GET").then(r => {
      const d = r.data.donor ?? null;
      setMe(d);
      if (d?.phone) setF(p => ({ ...p, contact_phone: d.phone.replace(/^\+88/, "") }));
    });
  }, []);

  const set = (k: string, v: unknown) => { setF(p => ({ ...p, [k]: v })); setError(null); };

  async function submit() {
    if (!f.blood_group || !f.contact_phone) {
      setError("Blood group and contact number are required"); return;
    }
    setBusy(true); setError(null);
    const r = await donorApi("/api/donors/requests", "POST", {
      ...f,
      bags_needed: Number(f.bags_needed) || 1,
      radius_km: Number(f.radius_km) || 10,
      needed_by: f.needed_by ? new Date(f.needed_by).toISOString() : null,
      lat: geo?.lat, lng: geo?.lng,
    });
    setBusy(false);
    if (!r.ok) { setError(r.data.error ?? "Failed to post"); return; }
    setDone({ notified: r.data.notified ?? 0 });
  }

  if (me === undefined) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }
  if (me === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center space-y-3 max-w-sm">
          <Siren className="w-10 h-10 text-red-600 mx-auto" />
          <h1 className="text-xl font-bold">Post an urgent request</h1>
          <p className="text-sm text-gray-500">Log in first so donors know who to contact.</p>
          <Link href="/donors/auth?next=/donors/requests/new" className={btnCls}>Log in / Sign up</Link>
        </div>
      </div>
    );
  }
  if (done) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center space-y-3 max-w-sm">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
          <h1 className="text-xl font-bold">Request posted</h1>
          <p className="text-sm text-gray-500">
            {done.notified > 0
              ? `${done.notified} nearby eligible donor${done.notified > 1 ? "s were" : " was"} notified.`
              : "It's now listed for donors to see."}
          </p>
          <Link href="/donors/requests" className={btnCls}>View requests</Link>
        </div>
      </div>
    );
  }

  const thanas = f.district ? BD_LOCATIONS[f.district] ?? [] : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
      <Link href="/donors/requests" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to requests
      </Link>

      <div className="text-center">
        <Siren className="w-9 h-9 text-red-600 mx-auto mb-1.5" />
        <h1 className="text-2xl font-bold">Post an Urgent Request</h1>
        <p className="text-sm text-gray-500">Nearby eligible donors get notified instantly.</p>
      </div>

      <div className="bg-white border rounded-2xl p-5 space-y-4">
        <Field label="Blood group needed" required>
          <div className="grid grid-cols-4 gap-1.5">
            {BLOOD_GROUPS.map(g => (
              <button key={g} type="button" onClick={() => set("blood_group", g)}
                className={`py-2 rounded-lg text-sm font-bold border transition-colors ${
                  f.blood_group === g
                    ? "bg-red-600 border-red-600 text-white"
                    : "bg-white border-gray-300 text-gray-900 hover:border-red-300"}`}>
                {g}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Patient name">
            <input className={inputCls} value={f.patient_name} onChange={e => set("patient_name", e.target.value)} />
          </Field>
          <Field label="Bags needed">
            <input className={inputCls} type="number" min={1} max={20} value={f.bags_needed}
              onChange={e => set("bags_needed", e.target.value)} />
          </Field>
        </div>

        <Field label="Hospital / place">
          <input className={inputCls} value={f.hospital} onChange={e => set("hospital", e.target.value)}
            placeholder="e.g. Dhaka Medical College Hospital" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="District">
            <select className={inputCls} value={f.district} onChange={e => { set("district", e.target.value); set("police_station", ""); }}>
              <option value="">—</option>
              {BD_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Thana">
            <select className={inputCls} value={f.police_station} onChange={e => set("police_station", e.target.value)} disabled={!f.district}>
              <option value="">—</option>
              {thanas.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Area">
          <input className={inputCls} value={f.area} onChange={e => set("area", e.target.value)} />
        </Field>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Pin the location (helps notify the right donors)</label>
          <MapPicker value={geo} onChange={setGeo} height={200} autoGps={!geo} />
        </div>

        <Field label="Notify donors within">
          <select className={inputCls} value={f.radius_km} onChange={e => set("radius_km", e.target.value)}>
            {[5, 10, 15, 25, 50].map(k => <option key={k} value={k}>{k} km of this location</option>)}
          </select>
        </Field>

        <Field label="Contact number" required>
          <div className="flex">
            <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-sm text-gray-500">+88</span>
            <input className={`${inputCls} rounded-l-none`} placeholder="01XXXXXXXXX" inputMode="numeric" maxLength={11}
              value={f.contact_phone} onChange={e => set("contact_phone", e.target.value.replace(/\D/g, ""))} />
          </div>
        </Field>

        <Field label="Needed by">
          <input className={inputCls} type="datetime-local" value={f.needed_by}
            onChange={e => set("needed_by", e.target.value)} />
        </Field>

        <Field label="Note">
          <textarea className={inputCls} rows={2} value={f.note} onChange={e => set("note", e.target.value)}
            placeholder="Any extra detail donors should know" />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button onClick={submit} disabled={busy} className={btnCls}>
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Post request &amp; notify donors
        </button>
      </div>
    </div>
  );
}
