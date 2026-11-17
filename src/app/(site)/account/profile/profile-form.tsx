"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormAlert, FormField } from "@/components/site/form-field";
import { checkName, checkPassword, checkPhone } from "@/lib/validation/customer";
import { customerChangePasswordAction, saveCustomerProfileAction } from "../actions";

const btn = "inline-flex items-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground px-5 text-sm font-bold disabled:opacity-60";

/** Name and mobile number for this store. */
export function ProfileForm({ initial }: { initial: { full_name: string; phone: string } }) {
  const [f, setF] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errs = { name: checkName(f.full_name), phone: checkPhone(f.phone, false) };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    if (errs.name || errs.phone) return;
    setSaving(true);
    const r = await saveCustomerProfileAction(f);
    setSaving(false);
    if (r.error) setError(r.error); else toast.success("Profile saved");
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Full name" required value={f.full_name} onChange={(v) => setF({ ...f, full_name: v })} error={errs.name} showError={submitted} autoComplete="name" />
        <FormField label="Mobile number" type="tel" inputMode="tel" value={f.phone} onChange={(v) => setF({ ...f, phone: v })} error={errs.phone} showError={submitted}
          autoComplete="tel" placeholder="01712345678" hint="You can also sign in with this number" />
      </div>
      {error && <FormAlert>{error}</FormAlert>}
      <button disabled={saving} className={btn}>{saving && <Loader2 className="w-4 h-4 animate-spin" />} Save profile</button>
    </form>
  );
}

/** Change password (or set one, for accounts that only used Google). */
export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [f, setF] = useState({ current: "", next: "", confirm: "" });
  const [round, setRound] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errs = {
    current: hasPassword && !f.current ? "Enter your current password" : null,
    next: checkPassword(f.next) ?? (hasPassword && f.next && f.next === f.current ? "Your new password must be different from the old one" : null),
    confirm: f.confirm === f.next ? null : "Passwords don't match",
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    if (errs.current || errs.next || errs.confirm) return;
    setSaving(true);
    const r = await customerChangePasswordAction(f.current, f.next);
    setSaving(false);
    if (r.error) return setError(r.error);
    toast.success("Password changed");
    setF({ current: "", next: "", confirm: "" });
    setSubmitted(false);
    setRound((n) => n + 1);
  }

  return (
    // A fresh round remounts the fields so emptied inputs don't show errors.
    <form key={round} onSubmit={submit} noValidate className="space-y-4">
      {hasPassword && (
        <FormField label="Current password" type="password" required value={f.current} onChange={(v) => setF({ ...f, current: v })} error={errs.current} showError={submitted} autoComplete="current-password" />
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="New password" type="password" required meter value={f.next} onChange={(v) => setF({ ...f, next: v })} error={errs.next} showError={submitted} autoComplete="new-password" />
        <FormField label="Confirm new password" type="password" required value={f.confirm} onChange={(v) => setF({ ...f, confirm: v })} error={errs.confirm} showError={submitted} autoComplete="new-password" />
      </div>
      {error && <FormAlert>{error}</FormAlert>}
      <button disabled={saving} className={btn}>{saving && <Loader2 className="w-4 h-4 animate-spin" />} {hasPassword ? "Change password" : "Set password"}</button>
    </form>
  );
}
