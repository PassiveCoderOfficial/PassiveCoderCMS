"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Droplet, Loader2, KeyRound, LogOut, ShieldCheck, Plus, Settings2, Pencil,
} from "lucide-react";
import { btnCls, donorApi } from "../ui";
import { AVAILABILITY_META, type Availability } from "@/lib/donors/availability";
import { DonorAvatar } from "@/components/donors/donor-avatar";
import { PhotoCaptureButton } from "@/components/donors/photo-capture-button";

interface Me { id: string; name: string; phone: string; blood_group: string; is_admin?: boolean; photo_url?: string | null }
interface Entry {
  id: string; name: string; blood_group: string;
  district: string | null; area: string | null;
  last_donated_on: string | null; availability: Availability; is_available: boolean;
  is_claimed: boolean; has_password: boolean; created_at: string;
}

export default function MyDonorPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const meRes = await donorApi("/api/donors/auth/me", "GET");
    if (!meRes.data.donor) { setMe(null); return; }
    setMe(meRes.data.donor);
    const mine = await donorApi("/api/donors/meta?what=mine", "GET");
    if (mine.ok) setEntries(mine.data.entries ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function logout() {
    await donorApi("/api/donors/auth/logout", "POST", {});
    router.push("/");
  }

  async function toggleAvailable(e: Entry) {
    setTogglingId(e.id);
    const r = await donorApi(`/api/donors/${e.id}`, "PATCH", { is_available: !e.is_available });
    setTogglingId(null);
    if (r.ok) load();
  }

  if (me === undefined) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  if (me === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center space-y-3 max-w-sm">
          <Droplet className="w-10 h-10 text-red-600 mx-auto" />
          <p className="text-sm text-gray-500">Log in to manage your profile and entries.</p>
          <Link href="/donors/auth?next=/donors/me" className={btnCls}>Log in / Sign up</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-5">
      <div className="bg-white border rounded-2xl p-5 flex items-center gap-4">
        <div className="relative shrink-0">
          <DonorAvatar photoUrl={me.photo_url} name={me.name} size={56} />
          <MyPhotoButton onUploaded={load} />
        </div>
        <span className="flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold bg-red-50 text-red-600 shrink-0">
          {me.blood_group}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold flex items-center gap-1.5">{me.name} <ShieldCheck className="w-4 h-4 text-green-600" /></p>
          <p className="text-sm text-gray-500">{me.phone}</p>
        </div>
        <div className="text-right shrink-0 space-y-1">
          <Link href={`/donors/${me.id}`} className="text-sm text-red-600 font-medium hover:underline block">My profile</Link>
          {me.is_admin && (
            <Link href="/donors/admin" className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
              <Settings2 className="w-3.5 h-3.5" /> Admin panel
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-bold">My entries ({entries.length})</h2>
        <Link href="/donors/add"
          className="inline-flex items-center gap-1.5 text-sm text-red-600 font-medium hover:underline">
          <Plus className="w-4 h-4" /> Add donor
        </Link>
      </div>

      <div className="bg-white border rounded-2xl divide-y">
        {entries.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-10">
            You haven&apos;t added any donors yet.
          </p>
        )}
        {entries.map((e) => {
          const meta = AVAILABILITY_META[e.availability];
          return (
            <div key={e.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold bg-red-50 text-red-600 shrink-0">
                {e.blood_group}
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/donors/${e.id}`} className="text-sm font-semibold hover:underline truncate block">{e.name}</Link>
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: meta.bg, color: meta.text }}>{meta.label}</span>
                  {[e.area, e.district].filter(Boolean).join(", ")}
                </div>
              </div>
              <button onClick={() => toggleAvailable(e)} disabled={togglingId === e.id} title="Toggle temporarily unavailable"
                className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${!e.is_available ? "bg-gray-500" : "bg-gray-200"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${!e.is_available ? "left-[18px]" : "left-0.5"}`} />
              </button>
              <Link href={`/donors/${e.id}/edit`} title="Edit"
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50 shrink-0">
                <Pencil className="w-4 h-4" />
              </Link>
              {e.is_claimed ? (
                <span className="text-[11px] text-green-600 flex items-center gap-1 shrink-0"><ShieldCheck className="w-3.5 h-3.5" /> Claimed</span>
              ) : (
                <Link href={`/donors/me/${e.id}/password`}
                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors shrink-0 ${
                    e.has_password ? "text-gray-500 hover:bg-gray-50" : "text-red-600 border-red-200 hover:bg-red-50"}`}>
                  <KeyRound className="w-3.5 h-3.5" /> {e.has_password ? "Reset" : "Set password"}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-6">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← Back to home</Link>
        <button onClick={logout} className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600">
          <LogOut className="w-4 h-4" /> Log out
        </button>
      </div>
    </div>
  );
}

function MyPhotoButton({ onUploaded }: { onUploaded: () => void }) {
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/donors/photo", { method: "POST", body: form });
    setBusy(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error ?? "Upload failed"); return; }
    onUploaded();
  }

  return (
    <PhotoCaptureButton
      onFile={upload}
      busy={busy}
      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border shadow flex items-center justify-center text-gray-500 hover:text-red-600 transition-colors"
      iconClassName="w-3.5 h-3.5"
    />
  );
}
