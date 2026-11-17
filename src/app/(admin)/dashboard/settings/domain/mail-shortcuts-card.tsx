"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";
import { mailShortcutLinks, type MailShortcutFields } from "@/lib/tenant/mail-shortcuts";

const HOSTS = [
  { value: "cpanel", label: "cPanel (our email hosting)" },
  { value: "google", label: "Google Workspace" },
  { value: "microsoft", label: "Microsoft 365" },
];

/** Dashboard > Settings > Domain: keep yourdomain.com/webmail and /cpanel working. */
export default function MailShortcutsCard({ tenantId, fields }: { tenantId: string; fields: MailShortcutFields }) {
  const [enabled, setEnabled] = useState(!!fields.mail_shortcuts_enabled);
  const [hostType, setHostType] = useState<string>(fields.mail_host_type ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(next: { enabled: boolean; hostType: string }) {
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/domain/mail-shortcuts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, enabled: next.enabled, hostType: next.hostType || null }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Failed");
      setEnabled(next.enabled); setHostType(next.hostType);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  }

  const domain = fields.custom_domain;
  const links = mailShortcutLinks({ ...fields, mail_host_type: hostType || null });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2"><Mail className="w-5 h-5" /><CardTitle>Email shortcuts</CardTitle></div>
        <CardDescription>
          Keep the old {domain ? <strong>{domain}/webmail</strong> : "yourdomain.com/webmail"} and /cpanel links working after your website moved here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="mail-host">Where your email is hosted</Label>
          <select id="mail-host" className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={hostType} disabled={saving}
            onChange={(e) => save({ enabled: enabled && !!e.target.value, hostType: e.target.value })}>
            <option value="">Not set</option>
            {HOSTS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
          </select>
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="mail-on">Answer /webmail, /mail{hostType === "cpanel" ? " and /cpanel" : ""} on your domain</Label>
          <Switch id="mail-on" checked={enabled} disabled={saving || !hostType || !domain}
            onCheckedChange={(v) => save({ enabled: v, hostType })} />
        </div>
        {!domain && <p className="text-sm text-muted-foreground">Connect a custom domain first.</p>}
        {enabled && domain && Object.keys(links).length > 0 && (
          <ul className="text-sm space-y-1">
            {Object.entries(links).map(([path, to]) => (
              <li key={path} className="break-all"><span className="font-mono">{domain}/{path}</span> → <a className="underline" href={to} target="_blank" rel="noreferrer">{to}</a></li>
            ))}
          </ul>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
