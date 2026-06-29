"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, CheckCircle, Clock, XCircle, RefreshCw, Copy, Loader2 } from "lucide-react";

interface Tenant {
  id: string;
  slug: string;
  custom_domain: string | null;
  domain_status: string;
}

export default function DomainSettingsClient({ tenant }: { tenant: Tenant | null }) {
  const [domain, setDomain] = useState(tenant?.custom_domain ?? "");
  const [dnsType, setDnsType] = useState<"nameserver" | "arecord">("arecord");
  const [connecting, setConnecting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [instructions, setInstructions] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState(tenant?.domain_status ?? "none");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [copied, setCopied] = useState("");

  if (!tenant) return null;

  const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

  async function connectDomain() {
    setConnecting(true);
    setError("");
    setWarning("");
    try {
      const res = await fetch("/api/domain/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant!.id, domain, type: dnsType }),
      });
      const data = await res.json() as { ok?: boolean; instructions?: Record<string, unknown>; error?: string; warning?: string };
      if (!data.ok) throw new Error(data.error ?? "Failed");
      setInstructions(data.instructions ?? null);
      if (data.warning) setWarning(data.warning);
      setStatus("pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setConnecting(false);
    }
  }

  async function checkVerification() {
    setVerifying(true);
    try {
      const res = await fetch(`/api/domain/verify?tenantId=${tenant!.id}`);
      const data = await res.json() as { verified: boolean };
      if (data.verified) setStatus("active");
    } finally {
      setVerifying(false);
    }
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  }

  function StatusBadge() {
    if (status === "active") return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
    if (status === "pending") return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending DNS</Badge>;
    return <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" />Not configured</Badge>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="w-6 h-6" /> Domain Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your site is available at <strong>{tenant.slug}.{ROOT_DOMAIN}</strong> by default.
          Connect a custom domain to use your own address.
        </p>
      </div>

      {/* Current domain */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Custom Domain</CardTitle>
            <StatusBadge />
          </div>
          <CardDescription>
            {tenant.custom_domain
              ? `Currently pointed to: ${tenant.custom_domain}`
              : "No custom domain configured yet."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Domain name</Label>
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="yourdomain.com"
              disabled={status === "active"}
            />
          </div>

          {status !== "active" && (
            <>
              <div className="space-y-2">
                <Label>DNS method</Label>
                <div className="flex gap-3">
                  {(["arecord", "nameserver"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setDnsType(t)}
                      className={`flex-1 rounded-lg border p-3 text-sm text-left transition-colors ${
                        dnsType === t ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="font-medium">
                        {t === "arecord" ? "A Record (Recommended)" : "Nameservers"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {t === "arecord"
                          ? "Add DNS records at your registrar"
                          : "Point nameservers to us — we manage DNS"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              {warning && (
                <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">{warning}</p>
              )}

              <Button onClick={connectDomain} disabled={!domain || connecting} className="w-full">
                {connecting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connecting…</> : "Connect Domain"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* DNS Instructions */}
      {instructions && status === "pending" && (
        <Card>
          <CardHeader>
            <CardTitle>DNS Configuration</CardTitle>
            <CardDescription>
              Add these records at your domain registrar, then click "Check Verification".
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dnsType === "arecord" && (
              <>
                <DnsRecord
                  type="A"
                  host="@"
                  value="76.76.21.21"
                  onCopy={copyText}
                  copied={copied}
                />
                <DnsRecord
                  type="CNAME"
                  host="www"
                  value="cname.vercel-dns.com"
                  onCopy={copyText}
                  copied={copied}
                />
              </>
            )}
            {dnsType === "nameserver" && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Replace your nameservers with:</p>
                {((instructions?.nameservers as string[] | undefined) ?? ["ns1.passivecoder.com", "ns2.passivecoder.com"]).map((ns) => (
                  <div key={ns} className="flex items-center justify-between rounded border bg-muted/40 px-3 py-2">
                    <code className="text-sm">{ns}</code>
                    <button
                      onClick={() => copyText(ns, ns)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {copied === ns ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-1">
                  Nameserver method is best for domains registered through us. For domains bought elsewhere, the A Record method is recommended.
                </p>
              </div>
            )}
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 px-3 py-2 text-sm text-amber-800 dark:text-amber-400">
              DNS changes can take up to 48 hours to propagate worldwide.
            </div>
            <Button variant="outline" onClick={checkVerification} disabled={verifying} className="w-full">
              {verifying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Checking…</> : <><RefreshCw className="w-4 h-4 mr-2" />Check Verification</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {status === "active" && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Domain is active and verified!</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Your site is now live at <a href={`https://${tenant.custom_domain}`} className="underline" target="_blank" rel="noopener noreferrer">https://{tenant.custom_domain}</a>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DnsRecord({
  type,
  host,
  value,
  onCopy,
  copied,
}: {
  type: string;
  host: string;
  value: string;
  onCopy: (text: string, key: string) => void;
  copied: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="font-mono">{type}</Badge>
        <span className="text-sm text-muted-foreground">record</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Host / Name</p>
          <div className="flex items-center justify-between rounded border bg-background px-2 py-1.5">
            <code>{host}</code>
            <button onClick={() => onCopy(host, `host-${type}`)}>
              {copied === `host-${type}` ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
            </button>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Value / Points to</p>
          <div className="flex items-center justify-between rounded border bg-background px-2 py-1.5">
            <code className="truncate text-xs mr-1">{value}</code>
            <button onClick={() => onCopy(value, `val-${type}`)}>
              {copied === `val-${type}` ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
