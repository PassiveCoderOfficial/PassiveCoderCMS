"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useT } from "@/lib/i18n/language-provider";
import type { DeletionBlocker, DeletionStatus } from "@/lib/account/deletion";

/** Profile page section: delete my account (14-day grace, cancel by signing in). */
export function DeleteAccountSection({ email }: { email: string }) {
  const t = useT();
  const [status, setStatus] = useState<DeletionStatus | null>(null);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [typed, setTyped] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch("/api/account/deletion", { cache: "no-store" });
    if (r.ok) setStatus(await r.json());
  }
  useEffect(() => { load(); }, []);

  function blockerText(b: DeletionBlocker) {
    if (b.kind === "site") return t("profile.delete.blockSite", { name: b.name });
    if (b.kind === "super_admin") return t("profile.delete.blockSuperAdmin");
    if (b.kind === "staff") return t("profile.delete.blockStaff");
    return t("profile.delete.blockPartner");
  }

  async function submit() {
    setBusy(true);
    const r = await fetch("/api/account/deletion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, confirm_email: typed, reason, source: "web" }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) {
      if (j.error === "wrong_password") toast.error(t("profile.delete.wrongPassword"));
      else if (j.error === "email_mismatch") toast.error(t("profile.delete.emailMismatch"));
      else toast.error(j.error ?? "Error");
      if (j.blockers) setStatus((s) => (s ? { ...s, blockers: j.blockers } : s));
      return;
    }
    toast.success(t("profile.delete.scheduled"));
    await createClient().auth.signOut({ scope: "global" });
    window.location.href = "/login";
  }

  async function cancel() {
    setBusy(true);
    await fetch("/api/account/deletion", { method: "DELETE" });
    setBusy(false);
    toast.success(t("profile.delete.cancelled"));
    load();
  }

  if (!status) return null;
  const days = status.grace_days;
  const blocked = status.blockers.length > 0;
  const canConfirm = status.needs_password ? password.length > 0 : typed.trim().toLowerCase() === email.toLowerCase();

  return (
    <div className="rounded-xl border border-red-200 bg-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Trash2 className="w-4 h-4 text-red-600" />
        <h2 className="font-semibold text-sm text-red-700">{t("profile.delete.title")}</h2>
      </div>
      <p className="text-sm text-muted-foreground">{t("profile.delete.intro")}</p>

      {status.pending ? (
        <div className="space-y-3">
          <p className="text-sm font-medium">
            {t("profile.delete.pending", { date: new Date(status.pending.scheduled_for).toLocaleDateString() })}
          </p>
          <Button variant="outline" onClick={cancel} disabled={busy}>{t("profile.delete.cancel")}</Button>
        </div>
      ) : blocked ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("profile.delete.blocked")}</p>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {status.blockers.map((b, i) => <li key={i}>{blockerText(b)}</li>)}
          </ul>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{t("profile.delete.grace", { days })}</p>
          <Button variant="destructive" onClick={() => setOpen(true)}>{t("profile.delete.button")}</Button>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("profile.delete.confirmTitle")}</DialogTitle>
            <DialogDescription>{t("profile.delete.grace", { days })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {status.needs_password ? (
              <div className="space-y-1.5">
                <Label>{t("profile.delete.password")}</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>{t("profile.delete.typeEmail")}</Label>
                <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={email} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>{t("profile.delete.reason")}</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("profile.delete.cancel")}</Button>
            <Button variant="destructive" onClick={submit} disabled={!canConfirm || busy}>
              {busy && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {t("profile.delete.confirm", { days })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
