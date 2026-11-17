"use client";

import { useState } from "react";
import { Ban, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/language-provider";

export interface BanOptions { ban_ip: boolean; ip_days: number; scope: "site" | "all"; reason: string }
export type BanSource = { type: "chat" | "submission" | "contact" | "spam"; id: string };

/** Ban through /api/spam. Returns an error message, or null when it worked. */
export async function banVia(from: BanSource, options: BanOptions): Promise<{ error: string | null; ipSkipped: boolean }> {
  const r = await fetch("/api/spam", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "ban", from, ...options }) });
  const j = await r.json().catch(() => ({}));
  return { error: r.ok ? null : j.error ?? "Could not ban", ipSkipped: !!j.ipSkipped };
}

/** The Ban button's dialog, used by chat, form submissions, CRM contacts and the Spam folder. */
export function BanDialog({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (options: BanOptions) => Promise<string | null>;
}) {
  const t = useT();
  const [scope, setScope] = useState<"site" | "all">("site");
  const [banIp, setBanIp] = useState(false);
  const [ipDays, setIpDays] = useState(30);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true); setError(null);
    const e = await onSubmit({ ban_ip: banIp, ip_days: ipDays, scope, reason: reason.trim() });
    setBusy(false);
    if (e) setError(e); else onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="font-semibold text-foreground flex items-center gap-2"><Ban className="w-4 h-4 text-red-500" />{t("spam.banTitle")}</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-muted-foreground">{t("spam.banHint")}</p>
        <div className="space-y-2">
          {(["site", "all"] as const).map((s) => (
            <label key={s} className="flex items-start gap-2 text-sm cursor-pointer">
              <input type="radio" name="ban-scope" checked={scope === s} onChange={() => setScope(s)} className="mt-1" />
              <span>{t(s === "site" ? "spam.scopeSite" : "spam.scopeAll")}</span>
            </label>
          ))}
        </div>
        <div className="space-y-2">
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={banIp} onChange={(e) => setBanIp(e.target.checked)} className="mt-1" />
            <span>{t("spam.banIp")}<span className="block text-xs text-muted-foreground">{t("spam.banIpHint")}</span></span>
          </label>
          {banIp && (
            <select value={ipDays} onChange={(e) => setIpDays(Number(e.target.value))} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value={30}>{t("spam.ip30")}</option>
              <option value={0}>{t("spam.ipForever")}</option>
            </select>
          )}
        </div>
        <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} placeholder={t("spam.reasonPlaceholder")} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>{t("spam.cancel")}</Button>
          <Button onClick={() => void submit()} disabled={busy} className="bg-red-600 hover:bg-red-700 text-white">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : t("spam.banConfirm")}
          </Button>
        </div>
      </div>
    </div>
  );
}
