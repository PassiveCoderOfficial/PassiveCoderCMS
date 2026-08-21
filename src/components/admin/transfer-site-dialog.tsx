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
  const [requireChange, setRequireChange] = useState(false);
  const [removeOld, setRemoveOld] = useState(false);
  const [saving, setSaving] = useState(false);

  function reset() {
    setEmail(""); setFullName(""); setPassword("");
    setCreateAccount(false); setRequireChange(false); setRemoveOld(false);
  }

  async function submit() {
    if (!email.trim()) { toast.error("Enter the client's email"); return; }
    if (createAccount && password.length < 8) {
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
          ...(createAccount ? { password, fullName: fullName.trim() || undefined } : {}),
          requirePasswordChange: requireChange,
          previousOwner: removeOld ? "remove" : "demote",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Transfer failed");

      toast.success(
        data.created
          ? `Account created and ${siteName ?? "site"} transferred — the client can sign in now`
          : `${siteName ?? "Site"} transferred to ${email.trim()}`,
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
          onChange={e => setEmail(e.target.value)}
          placeholder="client@theirbusiness.com"
          className="h-9 text-sm"
        />
      </div>

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

      {createAccount && (
        <div className="space-y-3 rounded-md bg-muted/40 p-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Full name (optional)</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} className="h-8 text-sm" />
          </div>
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
              Shown as plain text so you can pass it to the client. The account is active
              immediately — no confirmation email.
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
