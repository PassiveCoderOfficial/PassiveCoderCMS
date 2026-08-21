"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Hands a site over to its client. Shared by the SA panel, the staff site list
 * and the tenant's own Users page so all three behave identically — this
 * changes who controls a customer's business, and three near-copies of the
 * flow would drift.
 */
export function TransferSiteDialog({
  tenantId,
  siteName,
  onDone,
  /** Render the form immediately instead of a trigger button — for callers
   *  that already provide their own toggle, like the staff site list. */
  defaultOpen = false,
}: {
  tenantId: string;
  siteName?: string;
  onDone?: () => void;
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [createAccount, setCreateAccount] = useState(false);
  // null = not checked yet. Drives whether the form offers "create account" or
  // "reset the existing password", so the two are never silently confused.
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [resetExisting, setResetExisting] = useState(false);
  const [requireChange, setRequireChange] = useState(false);
  const [removeOld, setRemoveOld] = useState(false);
  const [saving, setSaving] = useState(false);

  function reset() {
    setEmail(""); setFullName(""); setPassword("");
    setCreateAccount(false); setRequireChange(false); setRemoveOld(false);
    setEmailExists(null); setResetExisting(false);
  }

  /** Looks up whether the address already has an account, so the form can say
   *  so before submitting. Previously the password fields were silently
   *  ignored for an existing email while the transfer still reported success —
   *  leaving the operator believing credentials were set that never were. */
  async function checkEmail() {
    const value = email.trim();
    if (!value.includes("@")) { setEmailExists(null); return; }
    setChecking(true);
    try {
      const res = await fetch("/api/tenant/transfer-ownership/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, email: value }),
      });
      if (!res.ok) { setEmailExists(null); return; }
      const data = await res.json();
      setEmailExists(!!data.exists);
      // Creating is only meaningful when nothing exists yet; resetting only
      // when something does. Preselect the one that applies.
      setCreateAccount(!data.exists);
      setResetExisting(false);
    } catch {
      setEmailExists(null);
    } finally {
      setChecking(false);
    }
  }

  async function submit() {
    if (!email.trim()) { toast.error("Enter the client's email"); return; }
    if ((createAccount || resetExisting) && password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/tenant/transfer-ownership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          email: email.trim(),
          ...(createAccount || resetExisting
            ? { password, fullName: createAccount ? fullName.trim() || undefined : undefined }
            : {}),
          resetExistingPassword: resetExisting,
          requirePasswordChange: requireChange,
          previousOwner: removeOld ? "remove" : "demote",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Transfer failed");

      // Say plainly whether credentials were set, so nobody walks away
      // assuming a password was applied when it was not.
      toast.success(
        data.created
          ? `Account created and ${siteName ?? "site"} transferred — the client can sign in now`
          : data.passwordSet
            ? `${siteName ?? "Site"} transferred and password updated — the client can sign in now`
            : `${siteName ?? "Site"} transferred to ${email.trim()} — they sign in with their existing password`,
      );
      reset();
      setOpen(false);
      onDone?.();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
        <UserCheck className="w-3.5 h-3.5" /> Transfer to client
      </Button>
    );
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-2">
          <UserCheck className="w-4 h-4" /> Transfer {siteName ?? "site"} to client
        </p>
        <button onClick={() => { reset(); setOpen(false); }} className="text-xs text-muted-foreground hover:underline">
          Cancel
        </button>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Client email</Label>
        <Input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setEmailExists(null); }}
          onBlur={checkEmail}
          placeholder="client@theirbusiness.com"
          className="h-9 text-sm"
        />
        {checking && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Checking…
          </p>
        )}
        {!checking && emailExists === true && (
          <p className="text-[11px] text-amber-600">
            This email already has an account. Ownership will move to it — its existing
            password still works unless you set a new one below.
          </p>
        )}
        {!checking && emailExists === false && (
          <p className="text-[11px] text-muted-foreground">
            No account yet — one will be created with the password you set below.
          </p>
        )}
      </div>

      {/* Existing account: offer an explicit password reset. Without this the
          password fields were ignored in silence, which is how a handover was
          reported as successful while the client could not sign in. */}
      {emailExists === true && (
        <label className="flex items-start gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={resetExisting}
            onChange={e => setResetExisting(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Set a new password for this account
            <span className="block text-[11px] text-muted-foreground">
              Overwrites their current password. Only do this if you are certain the
              address belongs to your client.
            </span>
          </span>
        </label>
      )}

      {emailExists !== true && (
        <label className="flex items-start gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={createAccount}
            onChange={e => setCreateAccount(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Create the account now
            <span className="block text-[11px] text-muted-foreground">
              Tick this if they have never signed in before. Leave it off to transfer to an existing account.
            </span>
          </span>
        </label>
      )}

      {(createAccount || resetExisting) && (
        <div className="space-y-3 rounded-md bg-muted/40 p-3">
          {createAccount && (
            <div className="space-y-1.5">
              <Label className="text-xs">Full name (optional)</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} className="h-8 text-sm" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">Password</Label>
            <Input
              type="text"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="h-8 text-sm font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Shown as plain text so you can pass it to the client.{" "}
              {createAccount
                ? "The account is active immediately — no confirmation email."
                : "This replaces their current password straight away."}
            </p>
          </div>
          <label className="flex items-start gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={requireChange}
              onChange={e => setRequireChange(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Make them choose a new password at first login
              <span className="block text-[11px] text-muted-foreground">
                Recommended — otherwise whoever sets this password keeps working access to
                the client&apos;s site indefinitely.
              </span>
            </span>
          </label>
        </div>
      )}

      <label className="flex items-start gap-2 text-xs cursor-pointer">
        <input
          type="checkbox"
          checked={removeOld}
          onChange={e => setRemoveOld(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          Remove the current owner&apos;s access entirely
          <span className="block text-[11px] text-muted-foreground">
            Off by default: the current owner stays on as an admin so they can finish
            support work. Tick this for a clean handover.
          </span>
        </span>
      </label>

      <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-600">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>The client becomes the owner of this site, including its billing and customer data.</span>
      </div>

      <Button size="sm" className="w-full gap-1.5" onClick={submit} disabled={saving || !email.trim()}>
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
        Transfer ownership
      </Button>
    </div>
  );
}
