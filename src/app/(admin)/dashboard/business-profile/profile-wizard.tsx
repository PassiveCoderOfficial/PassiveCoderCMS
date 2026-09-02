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
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Plus, X } from "lucide-react";

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

const STEPS = ["Business", "Contact", "Track record"];

/** Comma/enter-separated list editor. Used for services and service areas. */
function ListField({
  label, hint, value, onChange, placeholder,
}: {
  label: string; hint?: string;
  value: string[]; onChange: (v: string[]) => void; placeholder: string;
}) {
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
                aria-label={`Remove ${v}`}
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

export function ProfileWizard({ initial }: { initial: BusinessProfile | null }) {
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
      if (!res.ok) throw new Error(data.error ?? "Could not save");
      if (!opts.silent) toast.success(opts.completed ? "Business profile complete" : "Saved");
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function next() {
    if (step === 0 && !businessName.trim()) {
      toast.error("Business name is required");
      return;
    }
    if (!await save({ silent: true })) return;
    setStep(s => s + 1);
  }

  async function finish() {
    if (await save({ completed: true })) router.refresh();
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
            <Label>Business name <span className="text-destructive">*</span></Label>
            <Input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Al Noor Trading LLC" className="h-10" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>What you mainly do</Label>
            <Input value={primaryService} onChange={e => setPrimaryService(e.target.value)} placeholder="Electrical and plumbing contracting" className="h-10" />
          </div>
          <ListField
            label="Services you offer"
            hint="Add each one separately. These become your services page."
            value={services}
            onChange={setServices}
            placeholder="Wiring installation"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Owner / contact person</Label>
              <Input value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Md. Rahman" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>Years in operation</Label>
              <Input value={yearsOperating} onChange={e => setYearsOperating(e.target.value)} placeholder="8" inputMode="numeric" className="h-10" />
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>WhatsApp number</Label>
            <PhoneInput value={whatsapp} onChange={setWhatsapp} inputClassName="h-10" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+880 1700 000000" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>Business email</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="info@yourbusiness.com" className="h-10" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Office address</Label>
            <Textarea value={officeAddress} onChange={e => setOfficeAddress(e.target.value)} placeholder="Shop 12, Building 4, Deira, Dubai" rows={2} />
          </div>
          <ListField
            label="Areas you serve"
            hint="Cities or neighbourhoods where you take work."
            value={serviceAreas}
            onChange={setServiceAreas}
            placeholder="Dubai"
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-xl bg-muted/40 border border-border p-3 text-xs text-muted-foreground">
            These are optional. We only put a number on your website if you give
            us a real one — leave a field blank rather than estimating.
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Customers served</Label>
              <Input value={customersServed} onChange={e => setCustomersServed(e.target.value)} placeholder="250" inputMode="numeric" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>Projects completed</Label>
              <Input value={projectsCompleted} onChange={e => setProjectsCompleted(e.target.value)} placeholder="180" inputMode="numeric" className="h-10" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>About your business</Label>
            <Textarea value={about} onChange={e => setAbout(e.target.value)} rows={5}
              placeholder="What you do, who you do it for, and what makes you different. A few sentences is enough." />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={saving}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button onClick={next} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
            Continue <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        ) : (
          <Button onClick={finish} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1.5" />}
            Save profile
          </Button>
        )}
        <Button variant="ghost" onClick={() => save()} disabled={saving} className="ml-auto text-muted-foreground">
          Save for later
        </Button>
      </div>
    </div>
  );
}
