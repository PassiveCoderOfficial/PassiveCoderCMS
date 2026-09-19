"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/phone-input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Plus, X, Sparkles, ExternalLink } from "lucide-react";
import { useT } from "@/lib/i18n/language-provider";

export interface BusinessProfile {
  business_name: string | null;
  primary_service: string | null;
  services: string[] | null;
  owner_name: string | null;
  years_operating: number | null;
  customers_served: number | null;
  projects_completed: number | null;
  service_areas: string[] | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  office_address: string | null;
  country_code: string | null;
  about: string | null;
  completed_at: string | null;
}

/** Comma/enter-separated list editor. Used for services and service areas. */
function ListField({
  label, hint, value, onChange, placeholder,
}: {
  label: string; hint?: string;
  value: string[]; onChange: (v: string[]) => void; placeholder: string;
}) {
  const t = useT();
  const [draft, setDraft] = useState("");

  function add() {
    const parts = draft.split(",").map(s => s.trim()).filter(Boolean);
    if (!parts.length) return;
    onChange([...value, ...parts.filter(p => !value.includes(p))]);
    setDraft("");
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="h-10"
        />
        <Button type="button" variant="outline" size="sm" onClick={add} className="shrink-0">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {value.map(v => (
            <span key={v} className="inline-flex items-center gap-1 bg-muted rounded-full pl-3 pr-1.5 py-1 text-xs">
              {v}
              <button
                type="button"
                onClick={() => onChange(value.filter(x => x !== v))}
                className="rounded-full hover:bg-background p-0.5"
                aria-label={t("bizProfile.remove", { value: v })}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProfileWizard({ initial, initialEnmProfileLink }: { initial: BusinessProfile | null; initialEnmProfileLink?: string | null }) {
  const t = useT();
  const STEPS = [t("bizProfile.stepBusiness"), t("bizProfile.stepContact"), t("bizProfile.stepTrackRecord")];
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [businessName, setBusinessName] = useState(initial?.business_name ?? "");
  const [primaryService, setPrimaryService] = useState(initial?.primary_service ?? "");
  const [services, setServices] = useState<string[]>(initial?.services ?? []);
  const [ownerName, setOwnerName] = useState(initial?.owner_name ?? "");
  const [yearsOperating, setYearsOperating] = useState(initial?.years_operating?.toString() ?? "");

  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [officeAddress, setOfficeAddress] = useState(initial?.office_address ?? "");
  const [serviceAreas, setServiceAreas] = useState<string[]>(initial?.service_areas ?? []);

  const [customersServed, setCustomersServed] = useState(initial?.customers_served?.toString() ?? "");
  const [projectsCompleted, setProjectsCompleted] = useState(initial?.projects_completed?.toString() ?? "");
  const [about, setAbout] = useState(initial?.about ?? "");
  const [generatingAbout, setGeneratingAbout] = useState(false);
  const [enmProfileLink, setEnmProfileLink] = useState<string | null>(initialEnmProfileLink ?? null);

  // A blank numeric field must stay null, never become 0 — these figures are
  // published as claims, and "0 customers served" is a worse claim than none.
  const num = (s: string): number | null => {
    const t = s.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
  };

  async function save(opts: { completed?: boolean; silent?: boolean } = {}) {
    setSaving(true);
    try {
      const res = await fetch("/api/business-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName.trim() || null,
          primary_service: primaryService.trim() || null,
          services,
          owner_name: ownerName.trim() || null,
          years_operating: num(yearsOperating),
          phone: phone.trim() || null,
          whatsapp: whatsapp.trim() || null,
          email: email.trim() || null,
          office_address: officeAddress.trim() || null,
          service_areas: serviceAreas,
          customers_served: num(customersServed),
          projects_completed: num(projectsCompleted),
          about: about.trim() || null,
          ...(opts.completed !== undefined ? { completed: opts.completed } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("bizProfile.couldNotSave"));
      if (data.enmProfileLink) setEnmProfileLink(data.enmProfileLink);
      if (!opts.silent) toast.success(opts.completed ? t("bizProfile.profileComplete") : t("bizProfile.saved"));
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("bizProfile.couldNotSave"));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function next() {
    if (step === 0 && !businessName.trim()) {
      toast.error(t("bizProfile.businessNameRequired"));
      return;
    }
    if (!await save({ silent: true })) return;
    setStep(s => s + 1);
  }

  async function finish() {
    if (await save({ completed: true })) router.refresh();
  }

  async function generateAbout() {
    if (!businessName.trim()) {
      toast.error(t("bizProfile.fillBusinessNameFirst"));
      return;
    }
    // Uses whatever's currently on the form, not just what's saved — write it
    // through first so the generator sees the same facts the tenant is
    // looking at (services/track-record edited but not yet saved otherwise).
    if (!await save({ silent: true })) return;
    setGeneratingAbout(true);
    try {
      const res = await fetch("/api/business-profile/generate-about", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("bizProfile.couldNotGenerate"));
      setAbout(data.about);
      toast.success(t("bizProfile.generatedReview"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("bizProfile.couldNotGenerate"));
    } finally {
      setGeneratingAbout(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      {/* Step bar */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={cn(
              "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 shrink-0",
              step > i ? "bg-primary border-primary text-primary-foreground"
                : step === i ? "border-primary text-primary"
                : "border-muted-foreground/30 text-muted-foreground",
            )}>
              {step > i ? <CheckCircle className="h-3 w-3" /> : i + 1}
            </div>
            <span className={cn("text-xs font-medium", step === i ? "text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("bizProfile.businessName")} <span className="text-destructive">*</span></Label>
            <Input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder={t("bizProfile.businessNamePlaceholder")} className="h-10" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>{t("bizProfile.whatYouDo")}</Label>
            <Input value={primaryService} onChange={e => setPrimaryService(e.target.value)} placeholder={t("bizProfile.whatYouDoPlaceholder")} className="h-10" />
          </div>
          <ListField
            label={t("bizProfile.servicesOffered")}
            hint={t("bizProfile.servicesOfferedHint")}
            value={services}
            onChange={setServices}
            placeholder={t("bizProfile.servicePlaceholder")}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("bizProfile.ownerContact")}</Label>
              <Input value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder={t("bizProfile.ownerContactPlaceholder")} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("bizProfile.yearsOperating")}</Label>
              <Input value={yearsOperating} onChange={e => setYearsOperating(e.target.value)} placeholder="8" inputMode="numeric" className="h-10" />
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("bizProfile.whatsappNumber")}</Label>
            <PhoneInput value={whatsapp} onChange={setWhatsapp} inputClassName="h-10" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("bizProfile.phone")}</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+880 1700 000000" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("bizProfile.businessEmail")}</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder={t("bizProfile.emailPlaceholder")} className="h-10" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("bizProfile.officeAddress")}</Label>
            <Textarea value={officeAddress} onChange={e => setOfficeAddress(e.target.value)} placeholder={t("bizProfile.officeAddressPlaceholder")} rows={2} />
          </div>
          <ListField
            label={t("bizProfile.areasServed")}
            hint={t("bizProfile.areasServedHint")}
            value={serviceAreas}
            onChange={setServiceAreas}
            placeholder={t("bizProfile.areaPlaceholder")}
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-xl bg-muted/40 border border-border p-3 text-xs text-muted-foreground">
            {t("bizProfile.trackRecordHint")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("bizProfile.customersServed")}</Label>
              <Input value={customersServed} onChange={e => setCustomersServed(e.target.value)} placeholder="250" inputMode="numeric" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("bizProfile.projectsCompleted")}</Label>
              <Input value={projectsCompleted} onChange={e => setProjectsCompleted(e.target.value)} placeholder="180" inputMode="numeric" className="h-10" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>{t("bizProfile.aboutBusiness")}</Label>
              <Button
                type="button" variant="outline" size="sm"
                onClick={generateAbout} disabled={generatingAbout || saving}
                className="h-7 text-xs gap-1.5"
              >
                {generatingAbout ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {about.trim() ? t("bizProfile.regenerate") : t("bizProfile.writeForMe")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("bizProfile.aboutHint")}
            </p>
            <Textarea value={about} onChange={e => setAbout(e.target.value)} rows={5}
              placeholder={t("bizProfile.aboutPlaceholder")} />
          </div>

          {enmProfileLink && (
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{t("bizProfile.enmListingLive")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("bizProfile.enmListingHint")}</p>
              </div>
              <Button variant="outline" size="sm" asChild className="shrink-0">
                <a href={enmProfileLink} target="_blank" rel="noopener noreferrer">
                  {t("bizProfile.previewListing")} <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </a>
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={saving}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> {t("bizProfile.back")}
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button onClick={next} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
            {t("bizProfile.continue")} <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        ) : (
          <Button onClick={finish} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1.5" />}
            {t("bizProfile.saveProfile")}
          </Button>
        )}
        <Button variant="ghost" onClick={() => save()} disabled={saving} className="ml-auto text-muted-foreground">
          {t("bizProfile.saveForLater")}
        </Button>
      </div>
    </div>
  );
}
