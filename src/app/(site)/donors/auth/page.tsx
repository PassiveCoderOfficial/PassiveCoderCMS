"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Droplet, Loader2 } from "lucide-react";
import { inputCls, btnCls, Field, donorApi } from "../ui";
import { BLOOD_GROUPS } from "@/lib/donors/bd-locations";

type Mode = "login" | "signup" | "verify" | "forgot" | "reset";

function AuthInner() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/donors/me";
  const [mode, setMode] = useState<Mode>("login");
  const [f, setF] = useState({ phone: "", password: "", name: "", blood_group: "O+", code: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const set = (k: string, v: string) => { setF(p => ({ ...p, [k]: v })); setError(null); };

  async function submit() {
    setBusy(true); setError(null);
    let r;
    if (mode === "login") {
      r = await donorApi("/api/donors/auth/login", "POST", { phone: f.phone, password: f.password });
      if (r.ok) { router.push(next); return; }
    } else if (mode === "signup") {
      r = await donorApi("/api/donors/auth/signup", "POST",
        { phone: f.phone, password: f.password, name: f.name, blood_group: f.blood_group });
      // Password-only signup: account is created and logged in immediately,
      // no OTP step.
      if (r.ok) { router.push(next); return; }
    } else if (mode === "forgot") {
      r = await donorApi("/api/donors/auth/forgot", "POST", { phone: f.phone });
      if (r.ok) { setMode("reset"); setNotice("Code sent — enter it with your new password."); setBusy(false); return; }
    } else {
      r = await donorApi("/api/donors/auth/reset", "POST", { phone: f.phone, code: f.code, password: f.password });
      if (r.ok) { router.push(next); return; }
    }
    setError(r.data.error ?? "Something went wrong");
    setBusy(false);
  }

  const TITLES: Record<Mode, string> = {
    login: "Log in", signup: "Create donor account", verify: "Verify your number",
    forgot: "Forgot password", reset: "Set new password",
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <Droplet className="w-10 h-10 text-red-600 mx-auto mb-2" />
          <h1 className="text-xl font-bold">{TITLES[mode]}</h1>
          {notice && <p className="text-xs text-green-700 mt-1">{notice}</p>}
        </div>

        <div className="space-y-3 bg-white border rounded-2xl p-5">
          {mode === "signup" && (
            <>
              <Field label="Your name" required>
                <input className={inputCls} value={f.name} onChange={e => set("name", e.target.value)} />
              </Field>
              <Field label="Your blood group" required>
                <div className="grid grid-cols-4 gap-1.5">
                  {BLOOD_GROUPS.map(g => (
                    <button key={g} type="button" onClick={() => set("blood_group", g)}
                      className={`py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                        f.blood_group === g
                          ? "bg-red-600 border-red-600 text-white"
                          : "bg-white border-gray-300 text-gray-900 hover:border-red-300"}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}

          {mode !== "verify" && (
            <Field label="Phone number" required>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 rounded-l-lg bg-gray-50 text-sm text-gray-500">+88</span>
                <input className={`${inputCls} rounded-l-none`} placeholder="01XXXXXXXXX" inputMode="numeric" maxLength={11}
                  value={f.phone} onChange={e => set("phone", e.target.value.replace(/\D/g, ""))}
                  disabled={mode === "reset"} />
              </div>
            </Field>
          )}

          {(mode === "verify" || mode === "reset") && (
            <Field label="6-digit code" required>
              <input className={`${inputCls} text-center tracking-[0.5em] font-bold`} inputMode="numeric" maxLength={6}
                value={f.code} onChange={e => set("code", e.target.value.replace(/\D/g, ""))} />
            </Field>
          )}

          {mode !== "verify" && mode !== "forgot" && (
            <Field label={mode === "reset" ? "New password" : "Password"} required>
              <input type="password" className={inputCls} value={f.password}
                onChange={e => set("password", e.target.value)} />
            </Field>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={submit} disabled={busy} className={btnCls}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {TITLES[mode]}
          </button>
        </div>

        <div className="text-center text-sm text-gray-500 space-y-1">
          {mode === "login" && (
            <>
              <p>New here? <button className="text-red-600 font-medium" onClick={() => setMode("signup")}>Create an account</button></p>
              <p><button className="underline" onClick={() => setMode("forgot")}>Forgot password?</button></p>
            </>
          )}
          {mode !== "login" && (
            <p><button className="text-red-600 font-medium" onClick={() => { setMode("login"); setNotice(null); }}>Back to login</button></p>
          )}
          <p><a href="/" className="underline">← Back to home</a></p>
        </div>
      </div>
    </div>
  );
}

export default function DonorAuthPage() {
  return <Suspense fallback={null}><AuthInner /></Suspense>;
}
