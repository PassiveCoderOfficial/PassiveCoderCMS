"use client";

import { useState } from "react";
import { KeyRound, Plus, Loader2, Copy, Ban, Check } from "lucide-react";

interface ApiKey {
  id: string; name: string; key_prefix: string; scopes: string[];
  last_used_at: string | null; revoked_at: string | null; created_at: string;
}

const inputCls = "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40";
const btnPrimary = "inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50";

export default function ApiKeysClient({ initialKeys }: { initialKeys: ApiKey[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    const res = await fetch("/api/crm/keys", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const d = await res.json();
    setCreating(false);
    if (!res.ok) { alert(d.error ?? "Failed"); return; }
    setFreshKey(d.key);
    setKeys(l => [{ ...d, key: undefined }, ...l]);
    setName("");
  }

  async function revoke(k: ApiKey) {
    if (!confirm(`Revoke "${k.name}"? Apps using it stop working immediately.`)) return;
    const res = await fetch(`/api/crm/keys?id=${k.id}`, { method: "DELETE" });
    if (res.ok) setKeys(l => l.map(x => x.id === k.id ? { ...x, revoked_at: new Date().toISOString() } : x));
  }

  function copy() {
    if (!freshKey) return;
    navigator.clipboard.writeText(freshKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <KeyRound className="w-6 h-6 text-indigo-400" /> API Keys
      </h1>
      <p className="text-sm text-gray-400">
        Keys authenticate external apps against your site&apos;s API — Expert Near Me lead dispatch,
        custom integrations, Zapier-style tools. Send requests with
        <code className="mx-1 px-1.5 py-0.5 bg-gray-800 rounded text-xs">Authorization: Bearer pc_…</code>
        to <code className="px-1.5 py-0.5 bg-gray-800 rounded text-xs">/api/v1/contacts</code>.
      </p>

      {freshKey && (
        <div className="bg-green-900/30 border border-green-700/50 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-green-300">Key created — copy it now, it will not be shown again.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs text-green-200 break-all">{freshKey}</code>
            <button onClick={copy} className={btnPrimary}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <input className={`${inputCls} flex-1`} placeholder="Key name (e.g. ENM integration)"
          value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()} />
        <button onClick={create} disabled={creating} className={btnPrimary}>
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create key
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
        {keys.length === 0 && (
          <div className="text-center py-10 text-gray-500 text-sm">No API keys yet.</div>
        )}
        {keys.map((k) => (
          <div key={k.id} className="flex items-center gap-4 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${k.revoked_at ? "text-gray-500 line-through" : "text-white"}`}>{k.name}</span>
                {k.revoked_at && <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-300 border border-red-700/50">revoked</span>}
              </div>
              <div className="text-xs text-gray-500">
                {k.key_prefix}… · {k.scopes.join(", ")} ·
                {k.last_used_at ? ` last used ${new Date(k.last_used_at).toLocaleDateString()}` : " never used"}
              </div>
            </div>
            {!k.revoked_at && (
              <button onClick={() => revoke(k)}
                className="inline-flex items-center gap-1.5 text-xs text-red-300 border border-red-700/50 hover:bg-red-900/30 px-2.5 py-1.5 rounded-lg transition-colors">
                <Ban className="w-3.5 h-3.5" /> Revoke
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
