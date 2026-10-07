"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Loader2, Plug, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Status = {
  configured: boolean; connected: boolean; org?: string | null; domain?: string | null;
  domainAdded?: boolean; domainVerified?: boolean; verificationTxt?: string | null;
  mailboxes?: { zuid: number; email: string; name: string; role: string | null }[];
  error?: string;
};

async function post(body: Record<string, unknown>) {
  const res = await fetch("/api/email/zoho", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error ?? "Failed");
  return j;
}

/**
 * Connect Zoho: once the owner approves access to their own Zoho Mail
 * organisation (free or paid), the domain and mailboxes are managed here
 * without opening Zoho. `onChanged` refreshes the DNS records above (adding
 * the domain saves Zoho's verification code into them).
 */
export function ZohoPanel({ onChanged, autoDns }: { onChanged: () => void; autoDns: boolean }) {
  const [s, setS] = useState<Status | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [local, setLocal] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const load = useCallback(async () => {
    setS(await fetch("/api/email/zoho").then((r) => r.json()).catch(() => null));
  }, []);
  useEffect(() => {
    load();
    // Result of the round trip through Zoho.
    const r = new URLSearchParams(window.location.search).get("zoho");
    if (r === "connected") toast.success("Zoho connected");
    else if (r === "error") toast.error(new URLSearchParams(window.location.search).get("msg") ?? "Zoho connection failed");
    else if (r === "cancelled") toast.info("Zoho connection cancelled");
  }, [load]);

  async function act(key: string, body: Record<string, unknown>, ok: string) {
    setBusy(key);
    try { await post(body); toast.success(ok); await load(); onChanged(); return true; }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); return false; }
    finally { setBusy(null); }
  }

  if (!s) return null;
  if (!s.configured) {
    return <p className="text-xs text-muted-foreground">Connect Zoho will be available once the platform&apos;s Zoho app is set up. Until then, follow the manual steps below.</p>;
  }

  if (!s.connected) {
    return (
      <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
        <p className="text-sm font-medium flex items-center gap-2"><Plug className="w-4 h-4" /> Manage Zoho from here</p>
        <ol className="text-xs text-muted-foreground list-decimal pl-4 space-y-1">
          <li>Sign up free at <a href="https://www.zoho.com/mail/zohomail-pricing.html" target="_blank" rel="noopener noreferrer" className="underline">zoho.com/mail</a> (Forever Free plan: up to 5 mailboxes) using your domain.</li>
          <li>Click Connect Zoho and approve. You&apos;ll come straight back here.</li>
          <li>We add and verify the domain and you create mailboxes below, without opening Zoho again.</li>
        </ol>
        <Button asChild size="sm"><a href="/api/email/zoho/connect"><Plug className="w-4 h-4 mr-1" /> Connect Zoho</a></Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Zoho connected{s.org ? `: ${s.org}` : ""}</p>
        <Button size="sm" variant="ghost" disabled={!!busy}
          onClick={() => { if (confirm("Disconnect Zoho from this dashboard? Your mailboxes keep working in Zoho.")) act("dc", { action: "disconnect" }, "Disconnected"); }}>
          Disconnect
        </Button>
      </div>
      {s.error && <p className="text-xs text-destructive">{s.error}</p>}

      {!s.domainAdded ? (
        <div className="space-y-1">
          <p className="text-sm">Step 1: add <strong>{s.domain}</strong> to Zoho.</p>
          <Button size="sm" disabled={!!busy || !s.domain} onClick={() => act("add", { action: "add_domain" }, "Domain added to Zoho")}>
            {busy === "add" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Add domain to Zoho
          </Button>
        </div>
      ) : !s.domainVerified ? (
        <div className="space-y-1">
          <p className="text-sm">Step 2: prove you own {s.domain}. {autoDns ? "We add Zoho's code to your DNS; your current email keeps working." : <>Add this TXT record at your registrar: <code className="text-xs break-all">{s.verificationTxt}</code></>}</p>
          <div className="flex flex-wrap gap-2">
            {autoDns && (
              <Button size="sm" variant="outline" disabled={!!busy} onClick={() => act("pub", { action: "publish_verification" }, "Verification record added")}>
                {busy === "pub" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Add verification record
              </Button>
            )}
            <Button size="sm" disabled={!!busy} onClick={() => act("verify", { action: "verify_domain" }, "Domain verified in Zoho")}>
              {busy === "verify" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Verify domain
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Records can take a few minutes to be visible to Zoho; try again if it says not found.</p>
        </div>
      ) : (
        <p className="text-sm flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-600" /> {s.domain} is verified in Zoho.</p>
      )}

      {s.domainVerified && (
        <div className="space-y-2">
          <Label>Mailboxes</Label>
          <ul className="divide-y rounded-md border bg-background">
            {(s.mailboxes ?? []).map((m) => (
              <li key={m.zuid} className="flex items-center gap-2 px-3 py-2 text-sm">
                <span className="flex-1 min-w-0"><span className="font-medium">{m.email}</span>{m.name && <span className="text-xs text-muted-foreground ml-2">{m.name}</span>}</span>
                <Button size="icon" variant="ghost" aria-label="Reset password" title="Reset password" disabled={!!busy}
                  onClick={() => { const pw = prompt(`New password for ${m.email} (8+ characters):`); if (pw) act("pw", { action: "reset_password", zuid: m.zuid, password: pw }, "Password changed"); }}>
                  <KeyRound className="w-4 h-4" />
                </Button>
                {m.role !== "super_admin" && (
                  <Button size="icon" variant="ghost" aria-label="Delete mailbox" title="Delete mailbox" disabled={!!busy}
                    onClick={() => { if (confirm(`Delete ${m.email}? Its mail is deleted in Zoho too.`)) act("del", { action: "delete_mailbox", zuid: m.zuid }, "Mailbox deleted"); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </li>
            ))}
            {!(s.mailboxes ?? []).length && <li className="px-3 py-2 text-sm text-muted-foreground">No mailboxes yet.</li>}
          </ul>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex items-center gap-1">
              <Input className="w-28" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="info" aria-label="Address" />
              <span className="text-sm text-muted-foreground">@{s.domain}</span>
            </div>
            <Input className="w-40" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" aria-label="Name" />
            <Input className="w-40" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+)" aria-label="Password" />
            <Button size="sm" disabled={!!busy || !local || password.length < 8}
              onClick={async () => {
                if (await act("new", { action: "create_mailbox", local, firstName: name || local, password }, `${local}@${s.domain} created`)) { setLocal(""); setName(""); setPassword(""); }
              }}>
              {busy === "new" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />} Create mailbox
            </Button>
          </div>
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
            <p className="text-sm font-medium">Step 3: switch your email to Zoho</p>
            <p className="text-xs text-muted-foreground">When your mailboxes are ready, point {s.domain}&apos;s mail at Zoho. From then on new email arrives in Zoho; anything still at your old provider stays there (Zoho has a free import tool to copy it across).</p>
            {autoDns ? (
              <Button size="sm" disabled={!!busy || !(s.mailboxes ?? []).length}
                onClick={() => { if (confirm(`Switch ${s.domain} email to Zoho now? Mail stops arriving at your current provider.`)) act("switch", { action: "switch_mail" }, "Email now goes to Zoho"); }}>
                {busy === "switch" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Switch email to Zoho
              </Button>
            ) : <p className="text-xs">Change the MX and SPF records at your registrar to the Zoho records listed above.</p>}
          </div>
          <p className="text-xs text-muted-foreground">People sign in at Zoho Mail (web or app) with the address and password. The free plan allows 5 mailboxes.</p>
        </div>
      )}
    </div>
  );
}
