"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, Loader2, RotateCcw, ShieldBan, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BanDialog, banVia } from "@/components/spam/ban-dialog";
import { useT } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/locales/en";

interface Entry {
  id: string; source: string; reason: string; sender_email: string | null; sender_phone: string | null; ip: string | null;
  data: Record<string, unknown>; meta: Record<string, unknown>; created_at: string;
}
interface Block {
  id: string; tenant_id: string | null; kind: string; value: string; reason: string | null;
  effect: string; created_at: string; expires_at: string | null; hits: number; last_hit_at: string | null;
}

const REASON_KEY: Record<string, TranslationKey> = { bot: "spam.reasonBot", too_fast: "spam.reasonFast", banned: "spam.reasonBanned", trap: "spam.reasonTrap", flood: "spam.reasonFlood" };
const post = (body: Record<string, unknown>) => fetch("/api/spam", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

/** Spam folder and blocked list for the current site. */
export default function SpamPage() {
  const t = useT();
  const [tab, setTab] = useState<"spam" | "blocked">("spam");
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [banning, setBanning] = useState<Entry | null>(null);
  const [kind, setKind] = useState("email");
  const [value, setValue] = useState("");

  const load = useCallback(async () => {
    const [s, b] = await Promise.all([
      fetch("/api/spam?view=spam", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
      fetch("/api/spam?view=blocks", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
    ]);
    setEntries(s.entries ?? []);
    setBlocks((b.blocks ?? []).filter((x: Block) => x.effect === "block"));
  }, []);
  useEffect(() => { void load(); }, [load]);

  const run = async (body: Record<string, unknown>, ok: string) => {
    const r = await post(body);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { toast.error(j.error ?? t("spam.failed")); return; }
    toast.success(ok);
    void load();
  };

  const addBlock = async () => {
    if (!value.trim()) return;
    await run({ action: "block", kind, value: value.trim() }, t("spam.blocked"));
    setValue("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldBan className="w-6 h-6" />{t("spam.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("spam.subtitle")}</p>
      </div>
      <div className="flex gap-2" data-guide="spam-tabs">
        <Button size="sm" variant={tab === "spam" ? "default" : "outline"} onClick={() => setTab("spam")}>{t("spam.tabSpam")}{entries ? ` (${entries.length})` : ""}</Button>
        <Button size="sm" variant={tab === "blocked" ? "default" : "outline"} onClick={() => setTab("blocked")}>{t("spam.tabBlocked")}{blocks ? ` (${blocks.length})` : ""}</Button>
      </div>

      {tab === "spam" && (entries === null ? <Loader2 className="w-5 h-5 animate-spin" /> : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">{t("spam.empty")}</p>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => { if (confirm(t("spam.clearConfirm"))) void run({ action: "clear" }, t("spam.cleared")); }}><Trash2 className="w-4 h-4 mr-1" />{t("spam.clear")}</Button>
          </div>
          {entries.map((e) => (
            <div key={e.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{e.source}</span>
                <span className="rounded-full bg-muted px-2 py-0.5">{REASON_KEY[e.reason] ? t(REASON_KEY[e.reason]) : e.reason}</span>
                <span>{new Date(e.created_at).toLocaleString()}</span>
                {e.ip && <span>IP {e.ip}</span>}
              </div>
              {(e.sender_email || e.sender_phone) && <p className="text-sm font-medium break-all">{[e.sender_email, e.sender_phone].filter(Boolean).join(" · ")}</p>}
              <div className="text-sm text-muted-foreground space-y-0.5">
                {Object.entries(e.data ?? {}).slice(0, 6).map(([k, v]) => <p key={k} className="break-words"><span className="font-medium">{k}:</span> {String(v).slice(0, 300)}</p>)}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => void run({ action: "restore", id: e.id }, t("spam.restored"))}><RotateCcw className="w-4 h-4 mr-1" />{t("spam.notSpam")}</Button>
                {e.reason !== "banned" && <Button size="sm" variant="outline" onClick={() => setBanning(e)}><Ban className="w-4 h-4 mr-1" />{t("spam.ban")}</Button>}
                <Button size="sm" variant="ghost" onClick={() => void run({ action: "delete", id: e.id }, t("spam.deleted"))}><Trash2 className="w-4 h-4 mr-1" />{t("spam.delete")}</Button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {tab === "blocked" && (
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-2">
            <select value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="email">{t("spam.kindEmail")}</option>
              <option value="phone">{t("spam.kindPhone")}</option>
              <option value="ip">{t("spam.kindIp")}</option>
            </select>
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={t("spam.valuePlaceholder")} className="flex-1 min-w-[180px] rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <Button onClick={() => void addBlock()} disabled={!value.trim()}><Ban className="w-4 h-4 mr-1" />{t("spam.ban")}</Button>
          </div>
          {blocks === null ? <Loader2 className="w-5 h-5 animate-spin" /> : blocks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">{t("spam.noBlocks")}</p>
          ) : blocks.map((b) => (
            <div key={b.id} className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm font-medium break-all">{b.value}</p>
                <p className="text-xs text-muted-foreground">
                  {b.kind}{b.tenant_id ? "" : ` · ${t("spam.allSites")}`} · {t("spam.attempts", { n: b.hits })}
                  {b.expires_at ? ` · ${t("spam.until", { date: new Date(b.expires_at).toLocaleDateString() })}` : ""}
                  {b.reason ? ` · ${b.reason}` : ""}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => void run({ action: "unblock", id: b.id }, t("spam.unblocked"))}>{t("spam.unblock")}</Button>
            </div>
          ))}
        </div>
      )}

      {banning && (
        <BanDialog onClose={() => setBanning(null)} onSubmit={async (o) => {
          const r = await banVia({ type: "spam", id: banning.id }, o);
          if (r.error) return r.error;
          toast.success(r.ipSkipped ? t("spam.bannedIpSite") : t("spam.bannedDone"));
          void load();
          return null;
        }} />
      )}
    </div>
  );
}
