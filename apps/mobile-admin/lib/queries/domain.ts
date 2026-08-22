// Domain connect/disconnect touch Vercel's domain APIs server-side, so these
// go through the privileged Next.js backend routes rather than direct
// Supabase access. See lib/api.ts for the Bearer-auth fetch wrapper.

import { apiFetch } from "../api";

export type DomainDnsType = "nameserver" | "arecord";

export interface ConnectDomainInput {
  tenantId: string;
  domain: string;
  type: DomainDnsType;
}

export interface ConnectDomainResult {
  ok: boolean;
  error?: string;
  // DNS instructions to show the user on success — shape depends on `type`
  // (nameserver list vs A-record/CNAME values). Left loosely typed since
  // this app only ever displays it verbatim.
  instructions?: Record<string, unknown>;
}

export async function connectDomain(input: ConnectDomainInput): Promise<ConnectDomainResult> {
  const r = await apiFetch<ConnectDomainResult>("/api/domain/connect", {
    method: "POST",
    body: input,
  });
  if (!r.ok) return { ok: false, error: (r.data as { error?: string })?.error ?? "Failed to connect domain" };
  return { ...r.data, ok: true };
}

export async function disconnectDomain(input: { tenantId: string }): Promise<{ ok: boolean; error?: string }> {
  const r = await apiFetch<{ error?: string }>("/api/domain/disconnect", {
    method: "POST",
    body: input,
  });
  if (!r.ok) return { ok: false, error: r.data?.error ?? "Failed to disconnect domain" };
  return { ok: true };
}

// TODO (v1.5+, not core v1): purchaseDomain() — needs a contact-form/pricing
// flow that the approved plan explicitly defers. Left as a stub signature
// only so the domain screen's "buy a domain" affordance has something to
// wire up to later without re-deriving the shape.
// export async function purchaseDomain(input: { tenantId: string; domain: string }): Promise<{ ok: boolean }> { ... }
