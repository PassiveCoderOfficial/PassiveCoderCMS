"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, AlertCircle } from "lucide-react";

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "") || "mysite";
}

export default function NewSitePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [plan, setPlan] = useState("basic");
  const [checking, setChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugMsg, setSlugMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleNameChange(v: string) {
    setName(v);
    if (!slugManual) {
      const auto = slugify(v);
      setSlug(auto);
      setSlugAvailable(null);
    }
  }

  async function checkSlug(s: string) {
    if (!s || s.length < 3) { setSlugAvailable(null); return; }
    setChecking(true);
    const res = await fetch(`/api/onboarding/check-subdomain?slug=${encodeURIComponent(s)}`);
    const data = await res.json();
    setChecking(false);
    setSlugAvailable(data.available);
    setSlugMsg(data.reason ?? "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    if (slugAvailable === false) return;
    setSaving(true);
    setError("");

    // Resolve owner user_id from email if provided
    let userId: string | null = null;
    if (ownerEmail.trim()) {
      const res = await fetch(`/api/super-admin/users/lookup?email=${encodeURIComponent(ownerEmail.trim())}`);
      if (res.ok) {
        const data = await res.json();
        userId = data.user_id ?? null;
      }
    }

    const res = await fetch("/api/super-admin/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), slug, plan, owner_user_id: userId }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create site");
      setSaving(false);
      return;
    }

    const data = await res.json();
    router.push(`/super-admin/sites/${data.id}`);
  }

  return (
    <div className="p-6 max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/super-admin/sites" className="text-gray-500 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white">New Site</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Site Name *</label>
            <input
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="Premier Clean Co."
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Subdomain *</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  value={slug}
                  onChange={e => {
                    setSlugManual(true);
                    setSlug(e.target.value);
                    setSlugAvailable(null);
                  }}
                  onBlur={e => checkSlug(e.target.value)}
                  placeholder="premier-clean"
                  required
                  className={`w-full bg-gray-800 border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none ${
                    slugAvailable === true ? "border-green-500" : slugAvailable === false ? "border-red-500" : "border-gray-700 focus:border-indigo-500"
                  }`}
                />
                {checking && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-500" />}
              </div>
              <span className="text-gray-500 text-sm whitespace-nowrap">.passivecoder.com</span>
            </div>
            {slugAvailable === true && <p className="text-green-400 text-xs mt-1">Available</p>}
            {slugAvailable === false && <p className="text-red-400 text-xs mt-1">{slugMsg || "Not available"}</p>}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Plan</label>
            <select
              value={plan}
              onChange={e => setPlan(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="agency">Agency</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Owner Email <span className="text-gray-600">(optional)</span></label>
            <input
              value={ownerEmail}
              onChange={e => setOwnerEmail(e.target.value)}
              placeholder="client@example.com"
              type="email"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
            />
            <p className="text-xs text-gray-600 mt-1">Must be an existing user in the system. Leave blank to create unowned.</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-950/40 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || !name.trim() || !slug.trim() || slugAvailable === false}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Create Site
          </button>
          <Link href="/super-admin/sites" className="px-6 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
