// New-tenant signup — mirrors cms/src/app/(saas)/onboarding/onboarding-client.tsx's
// Step0..Step6 data needs. Plans, subdomain check, and templates are public
// reads (no auth), so those hit the existing web routes/RLS directly, same
// as web. Tenant creation and completion are privileged writes — both now
// Bearer-capable (see cms/src/app/api/onboarding/create-tenant and
// /complete, fixed this session to actually verify the caller instead of
// trusting a client-supplied userId).

import { apiFetch } from "../api";
import { supabase } from "../supabase";

export interface Plan {
  id: string;
  name: string;
  price_yearly: number;
  price_monthly: number;
  price_yearly_bdt: number | null;
  price_monthly_bdt: number | null;
  pages_limit: number;
  features: string[];
}

export async function getPlans(): Promise<Plan[]> {
  const res = await apiFetch<{ plans: Plan[] }>("/api/plans");
  if (!res.ok) throw new Error("Failed to load plans");
  return res.data.plans ?? [];
}

export interface SubdomainCheck { available: boolean; slug: string; reason?: string }

export async function checkSubdomain(slug: string): Promise<SubdomainCheck> {
  const res = await apiFetch<SubdomainCheck>(`/api/onboarding/check-subdomain?slug=${encodeURIComponent(slug)}`);
  if (!res.ok) return { available: false, slug, reason: "Couldn't check availability" };
  return res.data;
}

export interface OnboardingTemplate {
  id: string;
  name: string;
  slug: string;
  thumbnail_url: string | null;
  page_count: number;
}

/** Same RLS-backed public read as the web's fetchPublishedTemplates
 *  (templates_public_read policy: status='published' AND active=true, or
 *  owned, or SA) — direct Supabase read, no API route needed. Page counts
 *  aren't tallied here (that's a showcase-page nicety on web); the picker
 *  filters by the plan's pages_limit using each template's own
 *  pages_limit-relevant field if present, otherwise shows all. */
export async function getTemplates(): Promise<OnboardingTemplate[]> {
  const { data, error } = await supabase
    .from("templates")
    .select("id, name, slug, thumbnail_url")
    .eq("status", "published")
    .eq("active", true)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((t) => ({ ...t, page_count: 0 }));
}

export interface CreateTenantInput {
  siteName: string;
  slug: string;
  userId: string;
  planId: string;
  billingCycle: "monthly" | "yearly";
  payMethod: "dodo" | "shurjopay" | "manual";
  templateId?: string;
  templateMode?: "theme" | "full";
  referralCode?: string;
}

export async function createTenant(input: CreateTenantInput): Promise<{ tenantId: string; slug: string } | { error: string }> {
  const res = await apiFetch<{ tenantId: string; slug: string; error?: string }>(
    "/api/onboarding/create-tenant",
    { method: "POST", body: input },
  );
  if (!res.ok) return { error: res.data.error ?? `Signup failed (${res.status})` };
  return { tenantId: res.data.tenantId, slug: res.data.slug };
}

export async function completeOnboarding(tenantId: string): Promise<boolean> {
  const res = await apiFetch("/api/onboarding/complete", { method: "POST", body: { tenantId }, tenantId });
  return res.ok;
}
