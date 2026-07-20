"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Search, Loader2, X, User, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface ProfileResult {
  id: string;
  full_name: string | null;
  email: string;
}

function Field({
  label, value, onChange, type = "text", placeholder, required, helper, disabled,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; helper?: string; disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

export default function NewAgentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"new" | "existing">("new");

  // Existing user search
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ProfileResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<ProfileResult | null>(null);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [commissionRate, setCommissionRate] = useState("10");
  const [commissionType, setCommissionType] = useState<"recurring" | "one_time">("one_time");
  const [isStaff, setIsStaff] = useState(false);
  const [oneTimePct, setOneTimePct] = useState("");
  const [staffRecurringPct, setStaffRecurringPct] = useState("");
  const [notes, setNotes] = useState("");

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    fetch(`/api/super-admin/search?q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(({ results: r }) => {
        const profiles = (r ?? [])
          .filter((x: { user_id: string | null }) => x.user_id)
          .map((x: { user_id: string; user_name: string | null; user_email: string }) => ({ id: x.user_id, full_name: x.user_name, email: x.user_email }));
        setSearchResults(profiles);
        setSearching(false);
      })
      .catch(() => setSearching(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  function selectUser(u: ProfileResult) {
    setSelectedUser(u);
    setFullName(u.full_name ?? "");
    setEmail(u.email);
    setQuery(u.full_name ?? u.email);
    setSearchResults([]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch("/api/super-admin/agents/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        email,
        password: mode === "new" ? password : undefined,
        company,
        website,
        bio,
        commission_rate: parseFloat(commissionRate) || 10,
        commission_type: commissionType,
        is_staff: isStaff,
        one_time_pct_override: oneTimePct ? parseFloat(oneTimePct) : undefined,
        staff_recurring_pct: staffRecurringPct ? parseFloat(staffRecurringPct) : undefined,
        notes,
        existing_user_id: mode === "existing" && selectedUser ? selectedUser.id : undefined,
      }),
    });

    const json = await res.json();
    setSaving(false);

    if (!res.ok) { setError(json.error ?? "Something went wrong"); return; }
    router.push("/super-admin/agents");
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/super-admin/agents"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" /> Add New Agent
        </h1>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 bg-muted rounded-xl p-1">
        <Button
          type="button"
          variant={mode === "new" ? "default" : "ghost"}
          className="flex-1"
          onClick={() => { setMode("new"); setSelectedUser(null); setQuery(""); }}
        >
          Create New Account
        </Button>
        <Button
          type="button"
          variant={mode === "existing" ? "default" : "ghost"}
          className="flex-1"
          onClick={() => setMode("existing")}
        >
          Link Existing User
        </Button>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {mode === "existing" && (
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h2 className="font-semibold text-sm">Find Existing User</h2>
              <p className="text-xs text-muted-foreground">Search for an existing registered user to promote to agent.</p>

              {selectedUser ? (
                <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{selectedUser.full_name ?? selectedUser.email}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{selectedUser.email}</p>
                  </div>
                  <button type="button" onClick={() => { setSelectedUser(null); setQuery(""); setFullName(""); setEmail(""); }}
                    className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </div>
                  <Input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="pl-9"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-popover border rounded-xl overflow-hidden shadow-2xl divide-y">
                      {searchResults.map(u => (
                        <button key={u.id} type="button" onClick={() => selectUser(u)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left">
                          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{u.full_name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Agent info */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-semibold text-sm">Agent Information</h2>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Full Name" value={fullName} onChange={setFullName} placeholder="John Smith" required
                disabled={mode === "existing" && !!selectedUser && !!selectedUser.full_name}
                helper={mode === "existing" && selectedUser ? (selectedUser.full_name ? "From linked account" : "Account has no name set — enter one") : undefined} />
              <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="john@agency.com" required
                disabled={mode === "existing" && !!selectedUser}
                helper={mode === "existing" && selectedUser ? "From linked account" : undefined} />
            </div>

            {mode === "new" && (
              <Field label="Password" value={password} onChange={setPassword} type="password"
                placeholder="Min 8 characters" required helper="Agent will use this to log in" />
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Company" value={company} onChange={setCompany} placeholder="Acme Agency" />
              <Field label="Website" value={website} onChange={setWebsite} placeholder="https://acme.com" />
            </div>

            <div className="space-y-1.5">
              <Label>Bio</Label>
              <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                placeholder="Short description of the agent or agency..." />
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-semibold text-sm">Commission & Staff</h2>

            {/* Is staff toggle */}
            <div className="flex items-center gap-3">
              <Switch checked={isStaff} onCheckedChange={setIsStaff} />
              <div>
                <p className="text-sm font-medium">Staff member</p>
                <p className="text-xs text-muted-foreground">Staff earns ongoing recurring commission on every renewal</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>One-time % (blank = platform default 10%)</Label>
                <Input
                  type="number" min="0" max="100" step="0.5" value={oneTimePct}
                  onChange={e => setOneTimePct(e.target.value)}
                  placeholder="10"
                />
                <p className="text-xs text-muted-foreground">% of first payment</p>
              </div>
              {isStaff && (
                <div className="space-y-1.5">
                  <Label>Recurring % (blank = platform default 10%)</Label>
                  <Input
                    type="number" min="0" max="100" step="0.5" value={staffRecurringPct}
                    onChange={e => setStaffRecurringPct(e.target.value)}
                    placeholder="10"
                  />
                  <p className="text-xs text-muted-foreground">% of each renewal while site is active</p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Internal Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Internal notes visible only to super admins..." />
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={saving || !fullName.trim() || !email.trim() || (mode === "new" && !password)}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {mode === "new" ? "Create Agent Account" : "Link as Agent"}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/super-admin/agents">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
