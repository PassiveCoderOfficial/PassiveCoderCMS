"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "bn", label: "বাংলা (Bangla)" },
  { value: "ar", label: "العربية (Arabic)" },
];

export function SetupForm({ needsToken = false }: { needsToken?: boolean }) {
  const [siteName, setSiteName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState("en");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("The password needs at least 8 characters.");
    setBusy(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteName, email, password, language, timezone, ...(needsToken ? { token } : {}) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) return window.location.assign("/login");
        throw new Error(body.error ?? "Setup failed. Please try again.");
      }
      const { error: signInError } = await createClient().auth.signInWithPassword({ email, password });
      window.location.assign(signInError ? "/login" : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="siteName">Site name</Label>
            <Input id="siteName" required maxLength={80} value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Your Business" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="language">Site language</Label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Admin email</Label>
            <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Admin password</Label>
            <Input id="password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          </div>
          {needsToken && (
            <div className="space-y-1.5">
              <Label htmlFor="token">Setup code</Label>
              <Input id="token" type="password" required autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} />
              <p className="text-xs text-muted-foreground">The SETUP_TOKEN value from this install&apos;s environment settings.</p>
            </div>
          )}
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Setting up…</> : "Create my site"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
