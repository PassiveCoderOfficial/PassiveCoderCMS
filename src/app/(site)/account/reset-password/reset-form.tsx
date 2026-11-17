"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { FormAlert, FormField } from "@/components/site/form-field";
import { checkPassword } from "@/lib/validation/customer";
import { customerResetPasswordAction } from "../actions";

/** Second half of "forgot password": the emailed link lands here. */
export function ResetPasswordForm({ token, next }: { token: string; next?: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : "This reset link is incomplete. Please ask for a new one from the sign-in page.");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const errs = { password: checkPassword(password), confirm: confirm === password ? null : "Passwords don't match" };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!token || errs.password || errs.confirm) return;
    setBusy(true);
    const r = await customerResetPasswordAction(token, password);
    setBusy(false);
    if (r.error) setError(r.error); else setDone(true);
  }

  return (
    <div className="max-w-md mx-auto py-10 sm:py-16 px-4">
      <div className="rounded-2xl bg-card border shadow-sm p-6">
        {done ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600 mb-3" />
            <h1 className="text-xl font-bold mb-2">Password changed</h1>
            <p className="text-sm text-muted-foreground mb-6">You&apos;re signed in with your new password.</p>
            <Link href={next ?? "/account/orders"} className="inline-flex h-11 items-center px-6 rounded-xl bg-primary text-primary-foreground text-sm font-bold">{next?.startsWith("/provider") ? "Go to Provider Portal" : next?.startsWith("/vendor") ? "Go to Seller Centre" : "Go to my account"}</Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-4">
            <div>
              <h1 className="text-xl font-bold mb-1">Choose a new password</h1>
              <p className="text-sm text-muted-foreground">Use at least 8 characters, with letters and numbers.</p>
            </div>
            <FormField label="New password" type="password" required meter value={password} onChange={setPassword} error={errs.password} showError={submitted} autoComplete="new-password" />
            <FormField label="Confirm new password" type="password" required value={confirm} onChange={setConfirm} error={errs.confirm} showError={submitted} autoComplete="new-password" />
            {error && <FormAlert>{error} {!token || error.includes("expired") ? <Link href={next?.startsWith("/provider") ? "/provider/login" : next?.startsWith("/vendor") ? "/vendor/login" : "/account/login"} className="underline font-semibold">Get a new link</Link> : null}</FormAlert>}
            <button disabled={busy || !token} className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Save new password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
