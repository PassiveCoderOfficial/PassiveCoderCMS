"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Droplet, Loader2, Phone, MessageCircle, MapPin, User, Calendar,
  ShieldCheck, Pencil, KeyRound, Camera, Trash2,
} from "lucide-react";
import { donorApi } from "../ui";
import { DonorAvatar } from "@/components/donors/donor-avatar";
import { AVAILABILITY_META, type Availability } from "@/lib/donors/availability";

const DonorsMap = dynamic(() => import("@/components/donors/donor-map").then(m => m.DonorsMap), { ssr: false });

interface Profile {
  id: string; name: string; phone: string; whatsapp: string;
  blood_group: string; gender: string | null; religion: string | null;
  district: string | null; police_station: string | null; area: string | null;
  age: number | null; last_donated_on: string | null;
  availability: Availability; is_available: boolean; is_claimed: boolean; created_at: string;
  photo_url: string | null; lat: number | null; lng: number | null;
}

export default function DonorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submittedBy, setSubmittedBy] = useState<{ id: string; name: string } | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [togglingAvail, setTogglingAvail] = useState(false);

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

  async function toggleAvailable() {
    if (!profile) return;
    setTogglingAvail(true);
    const r = await donorApi(`/api/donors/${id}`, "PATCH", { is_available: !profile.is_available });
    setTogglingAvail(false);
    if (r.ok) load();
  }

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
            {profile.availability === "unavailable" ? "Temporarily unavailable"
              : profile.availability === "unknown" ? "Last donation unknown"
              : meta.label}
            {profile.last_donated_on && profile.availability !== "unavailable" ? ` · last donated ${profile.last_donated_on}` : ""}
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
          availability: profile.availability,
          lat: profile.lat, lng: profile.lng, area: profile.area, district: profile.district,
        }]} />
      )}

      {canManage && (
        <div className="bg-white border rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Temporarily unavailable</p>
            <p className="text-xs text-gray-500">Hide the readiness color and mark grey on the map — e.g. traveling or unwell.</p>
          </div>
          <button onClick={toggleAvailable} disabled={togglingAvail}
            className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${!profile.is_available ? "bg-gray-500" : "bg-gray-300"}`}>
            <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${!profile.is_available ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
      )}

      <div className="space-y-2">
        {canManage && (
          <Link href={`/donors/${profile.id}/edit`}
            className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Pencil className="w-4 h-4" /> Edit this profile
          </Link>
        )}
        {!profile.is_claimed && (
          <Link href={`/donors/${profile.id}/claim`}
            className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <KeyRound className="w-4 h-4" /> This is me — claim this profile
          </Link>
        )}
      </div>

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
