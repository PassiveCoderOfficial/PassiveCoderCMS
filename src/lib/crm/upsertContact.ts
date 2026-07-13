import { createAdminClient } from "@/lib/supabase/server";

export type ContactSource = "manual" | "form" | "booking" | "order" | "enm" | "import" | "api";

export interface UpsertContactInput {
  tenantId: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  name?: string | null;          // free-form; split into first/last
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  source: ContactSource;
  tags?: string[];
  custom?: Record<string, unknown>;
  consentEmail?: boolean;
  consentWhatsapp?: boolean;
  event?: {
    type: "note" | "form_submission" | "booking" | "order" | "invoice"
        | "email" | "whatsapp" | "call" | "stage_change" | "task" | "system";
    title: string;
    body?: string | null;
    meta?: Record<string, unknown>;
  };
}

/**
 * Normalize a phone number to E.164. Bare local numbers (01…) are assumed
 * Bangladeshi (+880) — matches the platform's primary market; numbers already
 * carrying a + or 00 prefix keep their country code.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let p = raw.replace(/[\s\-().]/g, "");
  if (!p) return null;
  if (p.startsWith("00")) p = "+" + p.slice(2);
  if (p.startsWith("+")) {
    const digits = p.slice(1).replace(/\D/g, "");
    return digits.length >= 8 ? "+" + digits : null;
  }
  const digits = p.replace(/\D/g, "");
  if (digits.length < 8) return null;
  if (digits.startsWith("880")) return "+" + digits;
  if (digits.startsWith("0")) return "+880" + digits.slice(1);
  return "+" + digits;
}

function splitName(name: string | null | undefined): { first: string | null; last: string | null } {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return { first: null, last: null };
  const idx = trimmed.indexOf(" ");
  if (idx === -1) return { first: trimmed, last: null };
  return { first: trimmed.slice(0, idx), last: trimmed.slice(idx + 1).trim() || null };
}

/**
 * Find-or-create a contact for a tenant and append a timeline event.
 * Match order: email (case-insensitive), then normalized phone.
 * Existing non-null fields are never blanked by incoming nulls.
 * Runs with the service role — the callers are public routes (form submits,
 * storefront checkout) where no user session exists.
 */
export async function upsertContact(input: UpsertContactInput): Promise<string | null> {
  const supabase = await createAdminClient();

  const email = input.email?.trim().toLowerCase() || null;
  const phone = normalizePhone(input.phone);
  const whatsapp = normalizePhone(input.whatsapp) ?? phone;
  const fromName = splitName(input.name);
  const firstName = input.firstName?.trim() || fromName.first;
  const lastName = input.lastName?.trim() || fromName.last;

  if (!email && !phone) return null; // nothing to key on

  let existing: { id: string; tags: string[] } | null = null;

  if (email) {
    const { data } = await supabase
      .from("contacts")
      .select("id, tags")
      .eq("tenant_id", input.tenantId)
      .ilike("email", email)
      .maybeSingle();
    existing = data ?? null;
  }
  if (!existing && phone) {
    const { data } = await supabase
      .from("contacts")
      .select("id, tags")
      .eq("tenant_id", input.tenantId)
      .eq("phone", phone)
      .maybeSingle();
    existing = data ?? null;
  }

  let contactId: string;

  if (existing) {
    contactId = existing.id;
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (email) patch.email = email;
    if (phone) patch.phone = phone;
    if (whatsapp) patch.whatsapp = whatsapp;
    if (firstName) patch.first_name = firstName;
    if (lastName) patch.last_name = lastName;
    if (input.company) patch.company = input.company;
    if (input.consentEmail) patch.consent_email = true;
    if (input.consentWhatsapp) patch.consent_whatsapp = true;
    if (input.tags?.length) {
      patch.tags = Array.from(new Set([...(existing.tags ?? []), ...input.tags]));
    }
    await supabase.from("contacts").update(patch).eq("id", contactId);
  } else {
    // First stage of the tenant's pipeline, if stages exist
    const { data: stage } = await supabase
      .from("crm_stages")
      .select("id")
      .eq("tenant_id", input.tenantId)
      .order("position")
      .limit(1)
      .maybeSingle();

    const { data: created, error } = await supabase
      .from("contacts")
      .insert({
        tenant_id: input.tenantId,
        email,
        phone,
        whatsapp,
        first_name: firstName,
        last_name: lastName,
        company: input.company ?? null,
        source: input.source,
        stage_id: stage?.id ?? null,
        tags: input.tags ?? [],
        custom: input.custom ?? {},
        consent_email: input.consentEmail ?? false,
        consent_whatsapp: input.consentWhatsapp ?? false,
      })
      .select("id")
      .single();
    if (error || !created) return null;
    contactId = created.id;
  }

  if (input.event) {
    await supabase.from("contact_events").insert({
      tenant_id: input.tenantId,
      contact_id: contactId,
      type: input.event.type,
      title: input.event.title,
      body: input.event.body ?? null,
      meta: input.event.meta ?? {},
    });
  }

  return contactId;
}

/** Pull likely email/phone/name out of a label-keyed form submission. */
export function extractIdentity(fields: Record<string, string>) {
  let email: string | null = null;
  let phone: string | null = null;
  let name: string | null = null;
  for (const [key, value] of Object.entries(fields)) {
    if (!value) continue;
    const k = key.toLowerCase();
    if (!email && (k.includes("email") || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value))) {
      if (value.includes("@")) email = value;
    }
    if (!phone && (k.includes("phone") || k.includes("mobile") || k.includes("whatsapp") || k.includes("number"))) {
      phone = value;
    }
    if (!name && (k === "name" || k.includes("full name") || k.includes("your name") || k.includes("first name"))) {
      name = value;
    }
  }
  return { email, phone, name };
}
