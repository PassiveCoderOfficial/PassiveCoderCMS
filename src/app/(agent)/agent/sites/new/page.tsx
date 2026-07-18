"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { TemplateSelect, type TemplateSelectValue } from "@/components/admin/template-select";

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "") || "mysite";
}

export default function AgentNewSitePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [plan, setPlan] = useState("basic");
  const [isMySite, setIsMySite] = useState(false);
  const [template, setTemplate] = useState<TemplateSelectValue>({ templateId: "blank", templateMode: "full" });
  const [checking, setChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugMsg, setSlugMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleNameChange(v: string) {
    setName(v);
    if (!slugManual) { setSlug(slugify(v)); setSlugAvailable(null); }
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
    if (!name.trim() || !slug.trim() || slugAvailable === false) return;
    setSaving(true);
    setError("");

    const res = await fetch("/api/agent/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(), slug, plan,
        owner_email: isMySite ? "" : ownerEmail.trim(), is_my_site: isMySite,
        template_id: template.templateId, template_mode: template.templateMode,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create site");
      setSaving(false);
      return;
    }

    router.push("/agent/sites");
  }

  return (
    <div className="p-6 max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/agent/sites" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">New Site</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border bg-card p-5 space-y-4">
          {/* "This is my site" toggle */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isMySite}
              onChange={e => { setIsMySite(e.target.checked); if (e.target.checked) setOwnerEmail(""); }}
              className="mt-0.5 w-4 h-4 accent-primary"
            />
            <div>
              <p className="text-sm font-medium">This is my own site</p>
              <p className="text-xs text-muted-foreground">You will be set as owner. The site appears in your dashboard.</p>
            </div>
          </label>

          <div className="border-t pt-4 space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Site Name *</label>
              <input value={name} onChange={e => handleNameChange(e.target.value)} placeholder="Premier Clean Co." required
                className="w-full bg-muted border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Subdomain *</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    value={slug}
                    onChange={e => { setSlugManual(true); setSlug(e.target.value); setSlugAvailable(null); }}
                    onBlur={e => checkSlug(e.target.value)}
                    placeholder="premier-clean" required
                    className={`w-full bg-muted border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 ${
                      slugAvailable === true ? "border-green-500 focus:ring-green-500" :
                      slugAvailable === false ? "border-red-500 focus:ring-red-500" : "focus:ring-primary"}`}
                  />
                  {checking && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
                <span className="text-muted-foreground text-sm whitespace-nowrap">.{process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com"}</span>
              </div>
              {slugAvailable === true && <p className="text-green-600 text-xs mt-1">Available</p>}
              {slugAvailable === false && <p className="text-red-500 text-xs mt-1">{slugMsg || "Not available"}</p>}
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Plan</label>
              <select value={plan} onChange={e => setPlan(e.target.value)}
                className="w-full bg-muted border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {!isMySite && (
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Client Email <span className="text-muted-foreground/60">(optional)</span></label>
                <input value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} placeholder="client@example.com" type="email"
                  className="w-full bg-muted border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                <p className="text-xs text-muted-foreground mt-1">If user exists, they become site owner. Otherwise site is unowned until they sign up.</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-3">
          <label className="block text-sm text-muted-foreground">Starting Template</label>
          <TemplateSelect value={template} onChange={setTemplate} />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving || !name.trim() || !slug.trim() || slugAvailable === false}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Create Site
          </button>
          <Link href="/agent/sites" className="px-6 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground border hover:border-foreground/20 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
