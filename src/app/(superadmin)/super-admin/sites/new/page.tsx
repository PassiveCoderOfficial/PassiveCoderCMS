"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, AlertCircle, Zap } from "lucide-react";
import { TemplateSelect, type TemplateSelectValue } from "@/components/admin/template-select";
import { createSiteSlug as slugify } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewSitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = searchParams.get("agentId");
  const agentName = searchParams.get("agentName");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [plan, setPlan] = useState("basic");
  const [template, setTemplate] = useState<TemplateSelectValue>({ templateId: "blank", templateMode: "full" });
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
      body: JSON.stringify({
        name: name.trim(), slug, plan, owner_user_id: userId,
        template_id: template.templateId, template_mode: template.templateMode,
        assigned_agent_id: agentId ?? undefined,
      }),
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
        <Link href="/super-admin/sites" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">New Site</h1>
      </div>

      {agentId && (
        <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg px-4 py-2.5 text-sm text-indigo-600 dark:text-indigo-300">
          <Zap className="w-4 h-4 shrink-0 text-yellow-500" />
          Will be assigned to agent <strong>{agentName ?? agentId}</strong>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-1.5">
              <Label>Site Name *</Label>
              <Input
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Premier Clean Co."
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Subdomain *</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    value={slug}
                    onChange={e => {
                      setSlugManual(true);
                      setSlug(e.target.value);
                      setSlugAvailable(null);
                    }}
                    onBlur={e => checkSlug(e.target.value)}
                    placeholder="premier-clean"
                    required
                    className={
                      slugAvailable === true ? "border-green-500" : slugAvailable === false ? "border-red-500" : ""
                    }
                  />
                  {checking && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
                <span className="text-muted-foreground text-sm whitespace-nowrap">.passivecoder.com</span>
              </div>
              {slugAvailable === true && <p className="text-green-500 text-xs">Available</p>}
              {slugAvailable === false && <p className="text-red-500 text-xs">{slugMsg || "Not available"}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="agency">Agency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Owner Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                value={ownerEmail}
                onChange={e => setOwnerEmail(e.target.value)}
                placeholder="client@example.com"
                type="email"
              />
              <p className="text-xs text-muted-foreground">Must be an existing user in the system. Leave blank to create unowned.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label>Starting Template</Label>
            <TemplateSelect value={template} onChange={setTemplate} dark />
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving || !name.trim() || !slug.trim() || slugAvailable === false}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Create Site
          </Button>
          <Button variant="outline" asChild>
            <Link href="/super-admin/sites">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
