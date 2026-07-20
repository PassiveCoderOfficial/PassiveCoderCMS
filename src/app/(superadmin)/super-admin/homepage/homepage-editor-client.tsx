"use client";
import { useState } from "react";
import { Edit3, Save, Loader2, ExternalLink, CheckCircle, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Testimonial { name: string; business: string; quote: string; rating: number; country: string; result: string; }
interface FaqItem { q: string; a: string; }

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
  cta_headline: string;
  cta_subheadline: string;
  features_headline: string;
  features_subheadline: string;
  hiw_headline: string;
  hiw_subheadline: string;
  testimonials_headline: string;
  agent_headline: string;
  agent_subheadline: string;
  testimonials: Testimonial[];
  faq: FaqItem[];
}

const DEFAULT: Settings = {
  id: "",
  hero_headline: "", hero_subheadline: "", hero_cta_text: "Start Free Trial",
  hero_cta_url: "/onboarding", hero_secondary_cta: "See Pricing",
  stat_sites: "17+", stat_businesses: "8", stat_uptime: "99.9%",
  announcement_enabled: false, announcement_text: "", announcement_url: "",
  meta_title: "", meta_description: "",
  cta_headline: "", cta_subheadline: "",
  features_headline: "", features_subheadline: "",
  hiw_headline: "", hiw_subheadline: "",
  testimonials_headline: "",
  agent_headline: "", agent_subheadline: "",
  testimonials: [], faq: [],
};

function Field({ label, value, onChange, textarea = false, helper, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  textarea?: boolean; helper?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {textarea ? (
        <Textarea rows={3} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      )}
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

function SectionCard({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <CardTitle className="text-sm">{title}</CardTitle>
        {note && <Badge variant="secondary" className="text-[10px]">{note}</Badge>}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}

export default function HomepageEditorClient({ settings: initial }: { settings: Settings | null }) {
  const [s, setS] = useState<Settings>({ ...DEFAULT, ...(initial ?? {}) });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"hero" | "sections" | "testimonials" | "faq" | "seo">("hero");
  const router = useRouter();

  function set(key: keyof Settings, value: unknown) {
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

  function addTestimonial() {
    set("testimonials", [...s.testimonials, { name: "", business: "", quote: "", rating: 5, country: "🌐", result: "" }]);
  }
  function updateTestimonial(i: number, field: keyof Testimonial, val: string | number) {
    const arr = [...s.testimonials];
    arr[i] = { ...arr[i], [field]: val };
    set("testimonials", arr);
  }
  function removeTestimonial(i: number) {
    set("testimonials", s.testimonials.filter((_, idx) => idx !== i));
  }

  function addFaq() {
    set("faq", [...s.faq, { q: "", a: "" }]);
  }
  function updateFaq(i: number, field: "q" | "a", val: string) {
    const arr = [...s.faq];
    arr[i] = { ...arr[i], [field]: val };
    set("faq", arr);
  }
  function removeFaq(i: number) {
    set("faq", s.faq.filter((_, idx) => idx !== i));
  }

  const TABS = [
    { id: "hero" as const, label: "Hero & Stats" },
    { id: "sections" as const, label: "Sections" },
    { id: "testimonials" as const, label: "Testimonials" },
    { id: "faq" as const, label: "FAQ" },
    { id: "seo" as const, label: "SEO" },
  ];

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Edit3 className="w-6 h-6 text-pink-500" /> Homepage Editor
        </h1>
        <div className="flex items-center gap-3">
          <a href="/" target="_blank" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            Preview <ExternalLink className="w-3 h-3" />
          </a>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? "Saved!" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {TABS.map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            className="flex-1"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "hero" && (
        <>
          <SectionCard title="Announcement Bar">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Show announcement bar at top of page</span>
              <div className="flex items-center gap-2">
                <Switch checked={s.announcement_enabled} onCheckedChange={v => set("announcement_enabled", v)} />
                <span className="text-xs text-muted-foreground">Enabled</span>
              </div>
            </div>
            <Field label="Message" value={s.announcement_text} onChange={v => set("announcement_text", v)} placeholder="🎉 Special offer — sign up today and get..." />
            <Field label="Link URL (optional)" value={s.announcement_url} onChange={v => set("announcement_url", v)} placeholder="/pricing" />
          </SectionCard>

          <SectionCard title="Hero Section" note="Dark full-width hero">
            <Field label="Headline" value={s.hero_headline} onChange={v => set("hero_headline", v)}
              placeholder="Stop Losing Customers to Competitors with Better Websites" />
            <Field label="Subheadline" value={s.hero_subheadline} onChange={v => set("hero_subheadline", v)} textarea
              placeholder="Passive Coder builds professional websites..." />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Primary CTA Text" value={s.hero_cta_text} onChange={v => set("hero_cta_text", v)} />
              <Field label="Primary CTA URL" value={s.hero_cta_url} onChange={v => set("hero_cta_url", v)} />
            </div>
            <Field label="Secondary CTA Text" value={s.hero_secondary_cta} onChange={v => set("hero_secondary_cta", v)} />
          </SectionCard>

          <SectionCard title="Hero Stats">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Sites Launched" value={s.stat_sites} onChange={v => set("stat_sites", v)} placeholder="17+" />
              <Field label="Countries" value={s.stat_businesses} onChange={v => set("stat_businesses", v)} placeholder="8" />
              <Field label="Uptime" value={s.stat_uptime} onChange={v => set("stat_uptime", v)} placeholder="99.9%" />
            </div>
          </SectionCard>
        </>
      )}

      {activeTab === "sections" && (
        <>
          <SectionCard title="Features Section" note="Grid of 12 features">
            <Field label="Section Headline" value={s.features_headline} onChange={v => set("features_headline", v)}
              placeholder="One platform. Every tool your business needs." />
            <Field label="Section Subheadline" value={s.features_subheadline} onChange={v => set("features_subheadline", v)} textarea
              placeholder="Most website builders charge extra..." />
            <p className="text-xs text-muted-foreground">Feature cards are hardcoded in the component. Use Root Pages builder for full custom layouts.</p>
          </SectionCard>

          <SectionCard title="How It Works Section" note="3-step process">
            <Field label="Section Headline" value={s.hiw_headline} onChange={v => set("hiw_headline", v)}
              placeholder="Up and running faster than you think" />
            <Field label="Section Subheadline" value={s.hiw_subheadline} onChange={v => set("hiw_subheadline", v)} textarea
              placeholder="We built this for business owners, not developers." />
          </SectionCard>

          <SectionCard title="CTA Section" note="Bottom call-to-action">
            <Field label="Headline" value={s.cta_headline} onChange={v => set("cta_headline", v)}
              placeholder="Your business deserves a website that actually works" />
            <Field label="Subheadline" value={s.cta_subheadline} onChange={v => set("cta_subheadline", v)} textarea
              placeholder="Don't let another week go by with customers landing on your competitor's site..." />
            <p className="text-xs text-muted-foreground">CTA buttons use the Hero CTA settings from the Hero & Stats tab.</p>
          </SectionCard>

          <SectionCard title="Agent / Partner CTA Section">
            <Field label="Section Headline" value={s.agent_headline} onChange={v => set("agent_headline", v)}
              placeholder="Are you a web developer, designer, or digital agency?" />
            <Field label="Section Subheadline" value={s.agent_subheadline} onChange={v => set("agent_subheadline", v)} textarea
              placeholder="Become a Passive Coder Agent. Refer clients, earn 20% recurring commission..." />
          </SectionCard>

          <SectionCard title="Testimonials Section">
            <Field label="Section Headline" value={s.testimonials_headline} onChange={v => set("testimonials_headline", v)}
              placeholder="Real businesses, real results" />
            <p className="text-xs text-muted-foreground">Testimonial cards are managed in the Testimonials tab.</p>
          </SectionCard>
        </>
      )}

      {activeTab === "testimonials" && (
        <SectionCard title="Testimonials" note={`${s.testimonials.length} custom · 6 defaults if empty`}>
          <p className="text-xs text-muted-foreground">Leave empty to use built-in defaults. Add items here to override.</p>

          <div className="space-y-4">
            {s.testimonials.map((t, i) => (
              <Card key={i} className="bg-muted/40">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Testimonial {i + 1}</span>
                    <button onClick={() => removeTestimonial(i)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Name" value={t.name} onChange={v => updateTestimonial(i, "name", v)} placeholder="Sarah M." />
                    <Field label="Business" value={t.business} onChange={v => updateTestimonial(i, "business", v)} placeholder="Metro Plumbing Co." />
                  </div>
                  <Field label="Quote" value={t.quote} onChange={v => updateTestimonial(i, "quote", v)} textarea
                    placeholder="Got our site up in a day..." />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Country Flag" value={t.country} onChange={v => updateTestimonial(i, "country", v)} placeholder="🇦🇪" />
                    <Field label="Result Badge" value={t.result} onChange={v => updateTestimonial(i, "result", v)} placeholder="3 new clients/week" />
                    <div className="space-y-1.5">
                      <Label>Rating</Label>
                      <Select value={String(t.rating)} onValueChange={v => updateTestimonial(i, "rating", Number(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[5, 4, 3].map(r => <SelectItem key={r} value={String(r)}>{r} stars</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <button onClick={addTestimonial}
            className="flex items-center gap-2 text-primary hover:underline text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add Testimonial
          </button>
        </SectionCard>
      )}

      {activeTab === "faq" && (
        <SectionCard title="FAQ" note={`${s.faq.length} custom · 10 defaults if empty`}>
          <p className="text-xs text-muted-foreground">Leave empty to use built-in defaults. Add items here to override.</p>

          <div className="space-y-4">
            {s.faq.map((item, i) => (
              <Card key={i} className="bg-muted/40">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Question {i + 1}</span>
                    <button onClick={() => removeFaq(i)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Field label="Question" value={item.q} onChange={v => updateFaq(i, "q", v)} placeholder="Do I need technical skills?" />
                  <Field label="Answer" value={item.a} onChange={v => updateFaq(i, "a", v)} textarea
                    placeholder="None at all. Our visual editor..." />
                </CardContent>
              </Card>
            ))}
          </div>

          <button onClick={addFaq}
            className="flex items-center gap-2 text-primary hover:underline text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add FAQ Item
          </button>
        </SectionCard>
      )}

      {activeTab === "seo" && (
        <SectionCard title="SEO">
          <Field label="Page Title" value={s.meta_title} onChange={v => set("meta_title", v)}
            placeholder="Passive Coder — Website Builder for Local Businesses" />
          <Field label="Meta Description" value={s.meta_description} onChange={v => set("meta_description", v)} textarea
            placeholder="Professional websites for local service businesses. Easy to use, affordable, and powerful." />
          <p className="text-xs text-muted-foreground">Overrides default homepage metadata.</p>
        </SectionCard>
      )}
    </div>
  );
}
