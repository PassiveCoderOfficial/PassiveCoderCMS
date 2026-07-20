"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, ArrowRight, ArrowLeft, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaPickerInput } from "@/components/admin/media-picker-input";

interface SetupWizardProps {
  initialSiteName: string;
  initialSiteDescription: string;
  initialLogoUrl: string;
  initialFaviconUrl: string;
}

const STEPS = ["Welcome", "Logo", "Favicon", "Details"] as const;

export function SetupWizard({ initialSiteName, initialSiteDescription, initialLogoUrl, initialFaviconUrl }: SetupWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [faviconUrl, setFaviconUrl] = useState(initialFaviconUrl);
  const [siteName, setSiteName] = useState(initialSiteName);
  const [siteDescription, setSiteDescription] = useState(initialSiteDescription);
  const [dismissed, setDismissed] = useState(false);

  async function finish(skip: boolean) {
    setSaving(true);
    try {
      if (!skip) {
        await fetch("/api/tenant/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            logo_url: logoUrl,
            favicon_url: faviconUrl,
            site_name: siteName,
            site_description: siteDescription,
          }),
        });
      }
      await fetch("/api/tenant/setup-wizard", { method: "POST" });
      setDismissed(true);
      router.refresh();
    } catch {
      toast.error("Failed to save — try again");
    } finally {
      setSaving(false);
    }
  }

  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background border rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold text-sm">Let&apos;s set up your site</span>
          </div>
          <button
            onClick={() => finish(true)}
            disabled={saving}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Skip setup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1.5 px-6 pt-4">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        <div className="p-6 min-h-[240px]">
          {step === 0 && (
            <div className="space-y-3 py-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Welcome to your dashboard</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Quick 3-step setup — logo, favicon, and a few site details. Takes under a minute, and you can always change these later in Settings.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <Label>Site Logo</Label>
              <p className="text-xs text-muted-foreground">Shown in your site header and the dashboard sidebar.</p>
              <MediaPickerInput value={logoUrl} onChange={setLogoUrl} placeholder="https://…" />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <Label>Favicon</Label>
              <p className="text-xs text-muted-foreground">The small icon shown in browser tabs. Square images work best.</p>
              <MediaPickerInput value={faviconUrl} onChange={setFaviconUrl} placeholder="https://…" />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Site Name</Label>
                <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="My Business" />
              </div>
              <div className="space-y-1.5">
                <Label>Site Description</Label>
                <Textarea
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  rows={3}
                  placeholder="A short description of your business — used for SEO and social sharing."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || saving}
            className="gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => finish(true)} disabled={saving}>
              Skip for now
            </Button>
            {step < STEPS.length - 1 ? (
              <Button size="sm" onClick={() => setStep((s) => s + 1)} className="gap-1.5">
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => finish(false)} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Finish Setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
