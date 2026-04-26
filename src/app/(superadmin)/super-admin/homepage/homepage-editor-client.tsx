"use client";
import { useState } from "react";
import { Edit3, Save, Loader2, ExternalLink, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Settings {
  id: string;
  hero_headline: string;
  hero_subheadline: string;
  hero_cta_text: string;
  hero_cta_url: string;
  hero_secondary_cta: string;
  stat_sites: string;
  stat_businesses: string;
  stat_uptime: string;
  announcement_enabled: boolean;
  announcement_text: string;
  announcement_url: string;
  meta_title: string;
  meta_description: string;
}

function Field({ label, value, onChange, textarea = false, helper }: {
  label: string; value: string; onChange: (v: string) => void; textarea?: boolean; helper?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
      {textarea ? (
        <textarea rows={3} value={value} onChange={e => onChange(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none" />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
      )}
      {helper && <p className="text-xs text-gray-600 mt-1">{helper}</p>}
    </div>
  );
}

export default function HomepageEditorClient({ settings: initial }: { settings: Settings | null }) {
  const [s, setS] = useState<Settings>(initial ?? {
    id: "", hero_headline: "", hero_subheadline: "", hero_cta_text: "Start Free Trial",
    hero_cta_url: "/onboarding", hero_secondary_cta: "See Pricing",
    stat_sites: "500+", stat_businesses: "12", stat_uptime: "99.9%",
    announcement_enabled: false, announcement_text: "", announcement_url: "",
    meta_title: "", meta_description: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  function set(key: keyof Settings, value: string | boolean) {
    setS(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await fetch("/api/super-admin/homepage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Edit3 className="w-6 h-6 text-pink-400" /> Homepage Editor
        </h1>
        <div className="flex items-center gap-3">
          <a href="/" target="_blank" className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
            Preview <ExternalLink className="w-3 h-3" />
          </a>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Announcement Bar */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white text-sm">Announcement Bar</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={s.announcement_enabled} onChange={e => set("announcement_enabled", e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-xs text-gray-400">Enabled</span>
          </label>
        </div>
        <Field label="Message" value={s.announcement_text} onChange={v => set("announcement_text", v)} helper='Shown at the very top of the homepage' />
        <Field label="Link URL (optional)" value={s.announcement_url} onChange={v => set("announcement_url", v)} />
      </section>

      {/* Hero */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-white text-sm">Hero Section</h2>
        <Field label="Headline" value={s.hero_headline} onChange={v => set("hero_headline", v)} />
        <Field label="Subheadline" value={s.hero_subheadline} onChange={v => set("hero_subheadline", v)} textarea />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Primary CTA Text" value={s.hero_cta_text} onChange={v => set("hero_cta_text", v)} />
          <Field label="Primary CTA URL" value={s.hero_cta_url} onChange={v => set("hero_cta_url", v)} />
        </div>
        <Field label="Secondary CTA Text" value={s.hero_secondary_cta} onChange={v => set("hero_secondary_cta", v)} />
      </section>

      {/* Stats */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-white text-sm">Hero Stats</h2>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Sites Launched" value={s.stat_sites} onChange={v => set("stat_sites", v)} />
          <Field label="Business Types" value={s.stat_businesses} onChange={v => set("stat_businesses", v)} />
          <Field label="Uptime" value={s.stat_uptime} onChange={v => set("stat_uptime", v)} />
        </div>
      </section>

      {/* SEO */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-white text-sm">SEO</h2>
        <Field label="Page Title" value={s.meta_title} onChange={v => set("meta_title", v)} />
        <Field label="Meta Description" value={s.meta_description} onChange={v => set("meta_description", v)} textarea />
      </section>
    </div>
  );
}
