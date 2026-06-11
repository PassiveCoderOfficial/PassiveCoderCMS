"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Search, Loader2, X, User, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

interface ProfileResult {
  id: string;
  full_name: string | null;
  email: string;
}

function Field({
  label, value, onChange, type = "text", placeholder, required, helper,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; helper?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
      />
      {helper && <p className="text-xs text-gray-600 mt-1">{helper}</p>}
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
  const [commissionRate, setCommissionRate] = useState("20");
  const [commissionType, setCommissionType] = useState<"recurring" | "one_time">("recurring");
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
        commission_rate: parseFloat(commissionRate) || 20,
        commission_type: commissionType,
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
        <Link href="/super-admin/agents" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-800 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-400" /> Add New Agent
        </h1>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 bg-gray-900 border border-gray-800 rounded-xl p-1">
        <button
          type="button"
          onClick={() => { setMode("new"); setSelectedUser(null); setQuery(""); }}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${mode === "new" ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-300"}`}
        >
          Create New Account
        </button>
        <button
          type="button"
          onClick={() => setMode("existing")}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${mode === "existing" ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-300"}`}
        >
          Link Existing User
        </button>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {mode === "existing" && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
            <h2 className="font-semibold text-white text-sm">Find Existing User</h2>
            <p className="text-xs text-gray-500">Search for an existing registered user to promote to agent.</p>

            {selectedUser ? (
              <div className="flex items-center gap-3 bg-indigo-600/10 border border-indigo-500/20 rounded-lg px-3 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{selectedUser.full_name ?? selectedUser.email}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" />{selectedUser.email}</p>
                </div>
                <button type="button" onClick={() => { setSelectedUser(null); setQuery(""); setFullName(""); setEmail(""); }}
                  className="text-gray-500 hover:text-red-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </div>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-2xl divide-y divide-gray-700/50">
                    {searchResults.map(u => (
                      <button key={u.id} type="button" onClick={() => selectUser(u)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700/50 transition-colors text-left">
                        <div className="w-7 h-7 rounded-lg bg-gray-700 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{u.full_name ?? "—"}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Agent info */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-white text-sm">Agent Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" value={fullName} onChange={setFullName} placeholder="John Smith" required />
            <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="john@agency.com" required />
          </div>

          {mode === "new" && (
            <Field label="Password" value={password} onChange={setPassword} type="password"
              placeholder="Min 8 characters" required helper="Agent will use this to log in" />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Company" value={company} onChange={setCompany} placeholder="Acme Agency" />
            <Field label="Website" value={website} onChange={setWebsite} placeholder="https://acme.com" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
              placeholder="Short description of the agent or agency..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none" />
          </div>
        </div>

        {/* Settings */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-white text-sm">Commission & Notes</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Commission Rate (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={commissionRate}
                  onChange={e => setCommissionRate(e.target.value)}
                  className="w-28 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <span className="text-gray-500 text-sm">%</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Default 20%. Changeable later.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Commission Type</label>
              <div className="flex gap-2">
                {(["recurring", "one_time"] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCommissionType(type)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      commissionType === type
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    {type === "recurring" ? "Recurring" : "One-Time"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {commissionType === "recurring" ? "Paid every renewal cycle." : "Paid once on first payment only."}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Internal Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Internal notes visible only to super admins..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none" />
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || !fullName.trim() || !email.trim() || (mode === "new" && !password)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-2.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {mode === "new" ? "Create Agent Account" : "Link as Agent"}
          </button>
          <Link href="/super-admin/agents"
            className="flex items-center gap-2 border border-gray-700 text-gray-400 hover:text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
