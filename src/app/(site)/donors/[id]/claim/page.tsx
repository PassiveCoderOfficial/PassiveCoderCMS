"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, Loader2, ArrowLeft } from "lucide-react";
import { inputCls, btnCls, Field, PasswordInput, donorApi } from "../../ui";

export default function ClaimDonorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [step, setStep] = useState<"start" | "verify">("start");
  const [hint, setHint] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true); setError(null);
    const r = await donorApi("/api/donors/auth/claim", "POST", { donor_id: id });
    setBusy(false);
    if (!r.ok) { setError(r.data.error); return; }
    setHint(r.data.phone_hint); setStep("verify");
  }
  async function verify() {
    setBusy(true); setError(null);
    const r = await donorApi("/api/donors/auth/verify-claim", "POST", { donor_id: id, code, password });
    setBusy(false);
    if (!r.ok) { setError(r.data.error); return; }
    router.push(`/donors/${id}`);
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-10 space-y-4">
      <Link href={`/donors/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to profile
      </Link>

      <div className="text-center">
        <KeyRound className="w-8 h-8 text-red-600 mx-auto mb-1.5" />
        <h1 className="text-xl font-bold">Claim your profile</h1>
      </div>

      <div className="bg-white border rounded-2xl p-5 space-y-3">
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
              <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
            </Field>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button onClick={verify} disabled={busy} className={btnCls}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Claim profile
            </button>
          </>
        )}
      </div>
    </div>
  );
}
