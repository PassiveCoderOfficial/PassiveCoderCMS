"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle2, Circle, Copy, Check, Loader2, Plus, Trash2, Send, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Rec = { type: string; name: string; value: string; priority?: number; purpose: string; ok: boolean };
type Data = {
  domain: string | null;
  autoDns?: boolean;
  providers?: Record<string, { label: string; help: string; dkimHelp?: string }>;
  provider?: string | null;
  forwards?: { alias: string; to: string }[];
  dkim?: { name: string; value: string }[];
  mail?: { records: Rec[]; strayMx: string[] };
  sender?: { status: string; local: string; name: string; records: Rec[] };
};

async function post(body: Record<string, unknown>) {
  const res = await fetch("/api/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Failed");
  return json;
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" aria-label="Copy" className="p-1 rounded hover:bg-muted shrink-0"
      onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1200); }}>
      {done ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
    </button>
  );
}

function Records({ records, domain }: { records: Rec[]; domain: string }) {
  if (!records.length) return null;
  return (
    <div className="rounded-lg border divide-y text-sm">
      {records.map((r, i) => (
        <div key={i} className="p-3 grid gap-1 sm:grid-cols-[auto_70px_1fr] sm:items-center sm:gap-3">
          {r.ok ? <CheckCircle2 className="w-4 h-4 text-green-600" aria-label="Found" /> : <Circle className="w-4 h-4 text-muted-foreground" aria-label="Missing" />}
          <span className="font-mono text-xs">{r.type}{r.priority != null ? ` ${r.priority}` : ""}</span>
          <div className="min-w-0 space-y-0.5">
            <p className="text-xs text-muted-foreground">{r.purpose} · Host: <span className="font-mono">{r.name === "@" ? `@ (${domain})` : r.name}</span> <CopyBtn text={r.name} /></p>
            <p className="font-mono text-xs break-all flex items-start gap-1">{r.value}<CopyBtn text={r.value} /></p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BusinessEmailPage() {
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [forwards, setForwards] = useState<{ alias: string; to: string }[]>([]);
  const [dkim, setDkim] = useState<{ name: string; value: string }[]>([]);
  const [senderLocal, setSenderLocal] = useState("hello");
  const [senderName, setSenderName] = useState("");

  const load = useCallback(async () => {
    const d = await fetch("/api/email").then((r) => r.json()).catch(() => null) as Data | null;
    setData(d);
    if (d?.domain) {
      setForwards(d.forwards?.length ? d.forwards : [{ alias: "info", to: "" }]);
      setDkim(d.dkim?.length ? d.dkim : [{ name: "", value: "" }]);
      setSenderLocal(d.sender?.local ?? "hello");
      setSenderName(d.sender?.name ?? "");
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function act(key: string, body: Record<string, unknown>, ok: string) {
    setBusy(key);
    try { const r = await post(body); toast.success(typeof r.added === "number" ? `${ok} (${r.added} records added)` : ok); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(null); }
  }

  if (!data) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  if (!data.domain) {
    return (
      <div className="p-6 max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Mail className="w-6 h-6" /> Business Email</h1>
        <Card><CardContent className="pt-6 text-sm space-y-3">
          <p>Business email works on your own domain (like info@yourbusiness.com). Connect a domain first.</p>
          <Button asChild><Link href="/dashboard/settings/domain">Connect a domain</Link></Button>
        </CardContent></Card>
      </div>
    );
  }

  const domain = data.domain;
  const p = data.provider ?? null;
  const prov = p && data.providers ? data.providers[p] : null;
  const mailOk = !!data.mail?.records.length && data.mail.records.every((r) => r.ok);
  const sender = data.sender!;

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Mail className="w-6 h-6" /> Business Email</h1>
        <p className="text-sm text-muted-foreground mt-1">Professional email on <strong>{domain}</strong>, and site emails sent from your own address.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span>1. Email addresses at {domain}</span>
            {p && <span className={cn("text-xs rounded-full px-2.5 py-0.5", mailOk ? "bg-green-500/15 text-green-700 dark:text-green-400" : "bg-amber-500/15 text-amber-700 dark:text-amber-400")}>{mailOk ? "Working" : "Setup needed"}</span>}
          </CardTitle>
          <CardDescription>Choose how you want to receive email. Free forwarding sends it to an inbox you already use; or connect a mailbox provider.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-2">
            {data.providers && Object.entries(data.providers).map(([key, v]) => (
              <button key={key} type="button" disabled={!!busy}
                onClick={() => act("provider", { provider: key }, `${v.label} selected`)}
                className={cn("rounded-lg border p-3 text-left text-sm transition-colors", p === key ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted")}>
                <span className="font-medium">{v.label}</span>
                {key === "forwarding" && <span className="ml-2 text-[10px] rounded-full bg-green-500/15 text-green-700 dark:text-green-400 px-1.5 py-0.5">Free</span>}
              </button>
            ))}
          </div>

          {prov && <p className="text-sm text-muted-foreground">{prov.help}</p>}

          {p === "forwarding" && (
            <div className="space-y-2">
              <Label>Forwarding addresses</Label>
              {forwards.map((f, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Input className="w-28" value={f.alias} placeholder="info" aria-label="Address"
                      onChange={(e) => setForwards(forwards.map((x, j) => (j === i ? { ...x, alias: e.target.value } : x)))} />
                    <span className="text-sm text-muted-foreground">@{domain} →</span>
                  </div>
                  <Input className="flex-1 min-w-48" value={f.to} placeholder="you@gmail.com" type="email" aria-label="Forward to"
                    onChange={(e) => setForwards(forwards.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)))} />
                  <Button variant="ghost" size="icon" aria-label="Remove" onClick={() => setForwards(forwards.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setForwards([...forwards, { alias: "", to: "" }])}><Plus className="w-4 h-4 mr-1" /> Add address</Button>
                <Button size="sm" disabled={!!busy} onClick={() => act("fw", { forwards }, "Forwarding saved")}>
                  {busy === "fw" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Save addresses
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Forwarding runs through Forward Email. To reply from your business address, set up &ldquo;Send mail as&rdquo; in Gmail, or choose a mailbox provider instead.</p>
            </div>
          )}

          {prov?.dkimHelp && (
            <div className="space-y-2">
              <Label>DKIM record from your provider (recommended)</Label>
              <p className="text-xs text-muted-foreground">{prov.dkimHelp}</p>
              {dkim.map((d, i) => (
                <div key={i} className="flex flex-wrap gap-2">
                  <Input className="w-56" value={d.name} placeholder="google._domainkey" aria-label="DKIM host"
                    onChange={(e) => setDkim(dkim.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <Input className="flex-1 min-w-48 font-mono text-xs" value={d.value} placeholder="v=DKIM1; k=rsa; p=…" aria-label="DKIM value"
                    onChange={(e) => setDkim(dkim.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                </div>
              ))}
              <div className="flex gap-2">
                {p === "microsoft" && dkim.length < 2 && <Button variant="outline" size="sm" onClick={() => setDkim([...dkim, { name: "", value: "" }])}><Plus className="w-4 h-4 mr-1" /> Second selector</Button>}
                <Button size="sm" variant="outline" disabled={!!busy} onClick={() => act("dkim", { dkim }, "DKIM saved")}>Save DKIM</Button>
              </div>
            </div>
          )}

          {p && data.mail && data.mail.records.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">DNS records</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setBusy("check"); load().finally(() => setBusy(null)); }} disabled={!!busy}>
                    <RefreshCw className={cn("w-4 h-4 mr-1", busy === "check" && "animate-spin")} /> Check again
                  </Button>
                  {data.autoDns && (
                    <Button size="sm" disabled={!!busy} onClick={() => act("apply", { action: "apply" }, "DNS updated")}>
                      {busy === "apply" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Set up automatically
                    </Button>
                  )}
                </div>
              </div>
              {data.mail.strayMx.length > 0 && (
                <p className="text-xs flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  Your domain also points mail to {data.mail.strayMx.join(", ")}. Remove those records or some email will go to the old provider.
                  {data.autoDns && " “Set up automatically” replaces them."}
                </p>
              )}
              <Records records={data.mail.records} domain={domain} />
              <p className="text-xs text-muted-foreground">
                {data.autoDns
                  ? "Your domain's DNS is managed here, so we can add these for you."
                  : "Add these at the company where you bought the domain (its DNS settings page)."}{" "}
                Changes usually work within an hour.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2"><Send className="w-5 h-5" /> 2. Send site emails from {domain}</span>
            <span className={cn("text-xs rounded-full px-2.5 py-0.5",
              sender.status === "verified" ? "bg-green-500/15 text-green-700 dark:text-green-400" : sender.status === "none" ? "bg-muted text-muted-foreground" : "bg-amber-500/15 text-amber-700 dark:text-amber-400")}>
              {sender.status === "verified" ? "Active" : sender.status === "none" ? "Not set up" : sender.status === "failed" ? "Check records" : "Waiting for DNS"}
            </span>
          </CardTitle>
          <CardDescription>
            Booking confirmations, order updates, invoices and campaigns come from {senderLocal || "hello"}@{domain} instead of a Passive Coder address. Customers trust them more and they land in spam less.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Send from</Label>
              <div className="flex items-center gap-1">
                <Input value={senderLocal} onChange={(e) => setSenderLocal(e.target.value)} placeholder="hello" />
                <span className="text-sm text-muted-foreground whitespace-nowrap">@{domain}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Sender name</Label>
              <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Your business name" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={!!busy} onClick={() => act("sname", { sender_local: senderLocal, sender_name: senderName }, "Saved")}>Save</Button>
            {sender.status === "none" ? (
              <Button size="sm" disabled={!!busy} onClick={() => act("ssetup", { sender_local: senderLocal, sender_name: senderName, action: "sender_setup" }, "Sending domain created")}>
                {busy === "ssetup" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Set up sending
              </Button>
            ) : sender.status !== "verified" && (
              <>
                {data.autoDns && <Button size="sm" variant="outline" disabled={!!busy} onClick={() => act("apply2", { action: "apply" }, "DNS updated")}>Add records automatically</Button>}
                <Button size="sm" disabled={!!busy} onClick={() => act("sverify", { action: "sender_verify" }, "Checked")}>
                  {busy === "sverify" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Verify now
                </Button>
              </>
            )}
          </div>
          {sender.status !== "none" && <Records records={sender.records} domain={domain} />}
          {sender.status === "verified" && <p className="text-sm text-green-700 dark:text-green-400">Site emails now go out from {senderLocal}@{domain}.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
