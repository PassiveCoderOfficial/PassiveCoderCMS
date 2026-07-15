"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Droplet, Loader2, Phone, MessageCircle, MapPin, User, Calendar,
  ShieldCheck, Pencil, KeyRound, X, Camera,
} from "lucide-react";
import { DonorAvatar } from "@/components/donors/donor-avatar";

const MapPicker = dynamic(() => import("@/components/donors/donor-map").then(m => m.MapPicker), { ssr: false });
const DonorsMap = dynamic(() => import("@/components/donors/donor-map").then(m => m.DonorsMap), { ssr: false });
import { inputCls, btnCls, Field, donorApi } from "../ui";
import { AVAILABILITY_META, type Availability } from "@/lib/donors/availability";
import { BLOOD_GROUPS, BD_DISTRICTS, BD_LOCATIONS } from "@/lib/donors/bd-locations";

interface Profile {
  id: string; name: string; phone: string; whatsapp: string;
  blood_group: string; gender: string | null; religion: string | null;
  district: string | null; police_station: string | null; area: string | null;
  age: number | null; last_donated_on: string | null;
  availability: Availability; is_claimed: boolean; created_at: string;
  photo_url: string | null; lat: number | null; lng: number | null;
}

export default function DonorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submittedBy, setSubmittedBy] = useState<{ id: string; name: string } | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"claim" | "edit" | null>(null);

  const load = useCallback(async () => {
    const r = await donorApi(`/api/donors/${id}`, "GET");
    if (r.ok) {
      setProfile(r.data.donor);
      setSubmittedBy(r.data.submitted_by);
      setCanManage(!!r.data.viewer?.can_manage);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  if (!profile) return <div className="min-h-[60vh] flex items-center justify-center text-gray-500">Donor not found.</div>;

  const meta = AVAILABILITY_META[profile.availability];
  const wa = profile.whatsapp ? `https://wa.me/88${profile.whatsapp}` : null;

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-4">
      <div className="bg-white border rounded-2xl p-6 text-center space-y-3">
        <div className="relative inline-block">
          <DonorAvatar photoUrl={profile.photo_url} name={profile.name} size={88} />
          <span className="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-extrabold bg-red-600 text-white border-2 border-white">
            {profile.blood_group}
          </span>
          {canManage && <PhotoUploadButton donorId={profile.id} onUploaded={load} />}
        </div>
        <div>
          <h1 className="text-2xl font-bold flex items-center justify-center gap-1.5">
            {profile.name}
            {profile.is_claimed && <ShieldCheck className="w-5 h-5 text-green-600" aria-label="Verified owner" />}
          </h1>
          <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: meta.bg, color: meta.text }}>
            {profile.availability === "unknown" ? "Last donation unknown" : meta.label}
            {profile.last_donated_on ? ` · last donated ${profile.last_donated_on}` : ""}
          </span>
        </div>

        <div className="flex gap-2 justify-center">
          <a href={`tel:${profile.phone}`}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
            <Phone className="w-4 h-4" /> Call
          </a>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          )}
        </div>
        <p className="text-sm text-gray-500">{profile.phone}</p>
      </div>

      <div className="bg-white border rounded-2xl p-5 space-y-2.5 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
          {[profile.area, profile.police_station, profile.district].filter(Boolean).join(", ") || "Location not set"}
        </div>
        {profile.age != null && (
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" /> {profile.age} years old
          </div>
        )}
        {(profile.gender || profile.religion) && (
          <div className="flex items-center gap-2 text-gray-600 capitalize">
            <User className="w-4 h-4 text-gray-400 shrink-0" />
            {[profile.gender, profile.religion].filter(Boolean).join(" · ")}
          </div>
        )}
        {submittedBy && (
          <div className="flex items-center gap-2 text-gray-600 pt-2 border-t">
            <Droplet className="w-4 h-4 text-gray-400 shrink-0" />
            Submitted by{" "}
            <Link href={`/donors/${submittedBy.id}`} className="text-red-600 font-medium hover:underline">
              {submittedBy.name}
            </Link>
          </div>
        )}
      </div>

      {profile.lat != null && profile.lng != null && (
        <DonorsMap height={220} donors={[{
          id: profile.id, name: profile.name, blood_group: profile.blood_group,
          lat: profile.lat, lng: profile.lng, area: profile.area, district: profile.district,
        }]} />
      )}

      <div className="space-y-2">
        {canManage && (
          <button onClick={() => setModal("edit")} className={btnCls} style={{ backgroundColor: "#374151" }}>
            <Pencil className="w-4 h-4" /> Edit this profile
          </button>
        )}
        {!profile.is_claimed && (
          <button onClick={() => setModal("claim")}
            className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <KeyRound className="w-4 h-4" /> This is me — claim this profile
          </button>
        )}
      </div>

      {modal === "claim" && <ClaimModal donorId={profile.id} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}
      {modal === "edit" && <EditModal profile={profile} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}

      <p className="text-center">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← Back to donor list</button>
      </p>
    </div>
  );
}

function PhotoUploadButton({ donorId, onUploaded }: { donorId: string; onUploaded: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    const form = new FormData();
    form.append("file", file);
    form.append("donor_id", donorId);
    const res = await fetch("/api/donors/photo", { method: "POST", body: form });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "Upload failed");
      return;
    }
    onUploaded();
  }

  return (
    <>
      <button onClick={() => inputRef.current?.click()} title="Upload photo"
        className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-white border shadow flex items-center justify-center text-gray-500 hover:text-red-600 transition-colors">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
    </>
  );
}

function ClaimModal({ donorId, onClose, onDone }: { donorId: string; onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState<"start" | "verify">("start");
  const [hint, setHint] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true); setError(null);
    const r = await donorApi("/api/donors/auth/claim", "POST", { donor_id: donorId });
    setBusy(false);
    if (!r.ok) { setError(r.data.error); return; }
    setHint(r.data.phone_hint); setStep("verify");
  }
  async function verify() {
    setBusy(true); setError(null);
    const r = await donorApi("/api/donors/auth/verify-claim", "POST", { donor_id: donorId, code, password });
    setBusy(false);
    if (!r.ok) { setError(r.data.error); return; }
    onDone();
  }

  return (
    <Modal title="Claim your profile" onClose={onClose}>
      {step === "start" ? (
        <>
          <p className="text-sm text-gray-500">
            We&apos;ll text a 6-digit code to the phone number on this profile. Enter it to take control and set your own password.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={start} disabled={busy} className={btnCls}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Send code
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-500">Code sent to the number ending in <strong>{hint}</strong>.</p>
          <Field label="6-digit code" required>
            <input className={`${inputCls} text-center tracking-[0.5em] font-bold`} inputMode="numeric" maxLength={6}
              value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} />
          </Field>
          <Field label="Your new password" required>
            <input type="password" className={inputCls} value={password} onChange={e => setPassword(e.target.value)} />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={verify} disabled={busy} className={btnCls}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Claim profile
          </button>
        </>
      )}
    </Modal>
  );
}

function EditModal({ profile, onClose, onDone }: { profile: Profile; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({
    name: profile.name, blood_group: profile.blood_group,
    district: profile.district ?? "", police_station: profile.police_station ?? "",
    area: profile.area ?? "", last_donated_on: profile.last_donated_on ?? "",
  });
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(
    profile.lat != null && profile.lng != null ? { lat: profile.lat, lng: profile.lng } : null);
  const [showMap, setShowMap] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const thanas = f.district ? BD_LOCATIONS[f.district] ?? [] : [];

  async function save() {
    setBusy(true); setError(null);
    const r = await donorApi(`/api/donors/${profile.id}`, "PATCH",
      { ...f, ...(geo ? { lat: geo.lat, lng: geo.lng } : {}) });
    setBusy(false);
    if (!r.ok) { setError(r.data.error); return; }
    onDone();
  }

  return (
    <Modal title="Edit profile" onClose={onClose}>
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
        {showMap && <div className="mt-2"><MapPicker value={geo} onChange={setGeo} height={200} /></div>}
      </div>
      <Field label="Last donated date">
        <input type="date" className={inputCls} value={f.last_donated_on} onChange={e => setF(p => ({ ...p, last_donated_on: e.target.value }))} />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button onClick={save} disabled={busy} className={btnCls}>
        {busy && <Loader2 className="w-4 h-4 animate-spin" />} Save changes
      </button>
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl p-5 space-y-3 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{title}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
