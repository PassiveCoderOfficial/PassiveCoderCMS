"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, Loader2, ArrowLeft, Copy, Check } from "lucide-react";
import { inputCls, btnCls, Field, donorApi } from "../../../ui";

export default function SetPasswordPage() {
  const { entryId } = useParams<{ entryId: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  async function save() {
    setBusy(true); setError(null);
    const r = await donorApi(`/api/donors/${entryId}`, "POST", { action: "set-password", password });
    setBusy(false);
    if (!r.ok) { setError(r.data.error); return; }
    setSaved(true);
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-10 space-y-4">
      <Link href="/donors/me" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to my entries
      </Link>

      <div className="text-center">
        <KeyRound className="w-8 h-8 text-red-600 mx-auto mb-1.5" />
        <h1 className="text-xl font-bold">Set a password</h1>
      </div>

      <div className="bg-white border rounded-2xl p-5 space-y-3">
        {saved ? (
          <>
            <p className="text-sm text-gray-600">
              Done. Share this password with the donor — they log in with their phone number and this password,
              then take over the profile.
            </p>
            <button onClick={() => { navigator.clipboard.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Copy password
            </button>
            <button onClick={() => router.push("/donors/me")} className={btnCls}>Done</button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500">
              Set a starter password so the donor can log in with their own phone number and manage this profile.
            </p>
            <Field label="Password (6+ characters)" required>
              <input className={inputCls} value={password} onChange={e => setPassword(e.target.value)} />
            </Field>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button onClick={save} disabled={busy || password.length < 6} className={btnCls}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Save password
            </button>
          </>
        )}
      </div>
    </div>
  );
}
