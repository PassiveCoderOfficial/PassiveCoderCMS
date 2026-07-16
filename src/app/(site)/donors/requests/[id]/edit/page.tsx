"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Siren, Loader2, ArrowLeft } from "lucide-react";
import { inputCls, btnCls, Field, donorApi } from "../../../ui";
import { toLocalInput } from "@/lib/donors/deadline";
import { BLOOD_GROUPS, BD_DISTRICTS, BD_LOCATIONS } from "@/lib/donors/bd-locations";

const MapPicker = dynamic(() => import("@/components/donors/donor-map").then(m => m.MapPicker), { ssr: false });

interface Req {
  id: string; patient_name: string | null; blood_group: string;
  bags_needed: number; hospital: string | null;
  district: string | null; police_station: string | null; area: string | null;
  contact_phone: string; note: string | null; needed_by: string | null;
  radius_km: number; lat: number | null; lng: number | null;
  is_mine?: boolean;
}

export default function EditRequestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [f, setF] = useState({
    patient_name: "", blood_group: "", bags_needed: "1", hospital: "",
    district: "", police_station: "", area: "", contact_phone: "",
    note: "", needed_by: "", radius_km: "10",
  });
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    // The list endpoint is the only place that resolves is_mine for us.
    const r = await donorApi("/api/donors/requests?view=mine", "GET");
    if (r.status === 401) { setAllowed(false); return; }
    const mine: Req[] = r.data?.requests ?? [];
    const found = mine.find((x) => x.id === id);
    if (!found) { setAllowed(false); return; }

    setAllowed(true);
    setF({
      patient_name: found.patient_name ?? "",
      blood_group: found.blood_group,
      bags_needed: String(found.bags_needed ?? 1),
      hospital: found.hospital ?? "",
      district: found.district ?? "",
      police_station: found.police_station ?? "",
      area: found.area ?? "",
      contact_phone: (found.contact_phone ?? "").replace(/^\+88/, ""),
      note: found.note ?? "",
      needed_by: toLocalInput(found.needed_by),
      radius_km: String(found.radius_km ?? 10),
    });
    if (found.lat != null && found.lng != null) setGeo({ lat: found.lat, lng: found.lng });
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const set = (k: string, v: unknown) => { setF(p => ({ ...p, [k]: v })); setError(null); };

  async function save() {
    setBusy(true); setError(null);
    const r = await donorApi("/api/donors/requests", "PATCH", {
      id,
      ...f,
      bags_needed: Number(f.bags_needed) || 1,
      radius_km: Number(f.radius_km) || 10,
      needed_by: f.needed_by ? new Date(f.needed_by).toISOString() : null,
      ...(geo ? { lat: geo.lat, lng: geo.lng } : {}),
    });
    setBusy(false);
    if (!r.ok) { setError(r.data.error ?? "Failed to save"); return; }
    router.push("/donors/requests");
  }

  if (allowed === null) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }
  if (!allowed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center space-y-3 max-w-sm">
          <Siren className="w-10 h-10 text-red-600 mx-auto" />
          <p className="text-sm text-gray-500">You can only edit requests you posted.</p>
          <Link href="/donors/requests" className={btnCls}>Back to requests</Link>
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
        <h1 className="text-2xl font-bold">Edit Request</h1>
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
          <input className={inputCls} value={f.hospital} onChange={e => set("hospital", e.target.value)} />
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
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Pin the location</label>
          <MapPicker value={geo} onChange={setGeo} height={200} />
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
          <textarea className={inputCls} rows={2} value={f.note} onChange={e => set("note", e.target.value)} />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button onClick={save} disabled={busy} className={btnCls}>
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Save changes
        </button>
      </div>
    </div>
  );
}
