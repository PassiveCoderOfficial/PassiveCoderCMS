import { createAdminClient } from "@/lib/supabase/server";

/**
 * Renders the tenant's stored business profile as brief text.
 *
 * The facts extractor in plan.ts reads a free-form brief and is explicitly
 * instructed never to invent anything the brief does not state. So the way to
 * get stored profile data into a generation run is to state it — prepended to
 * whatever the owner typed, where it carries the same weight as anything else
 * they wrote.
 *
 * Only fields that are actually set are emitted. An absent field must stay
 * absent: the numbers here become provenNumbers and end up on the site as
 * public claims, so a blank is correct and a guess is a defect.
 *
 * Returns "" when there is no profile, which leaves generation exactly as it
 * was before.
 */
export async function renderProfileBrief(tenantId: string): Promise<string> {
  const admin = await createAdminClient();
  const { data: p } = await admin
    .from("tenant_business_profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!p) return "";

  const lines: string[] = [];
  const services: string[] = Array.isArray(p.services) ? p.services : [];
  const areas: string[] = Array.isArray(p.service_areas) ? p.service_areas : [];

  if (p.business_name)   lines.push(`The business is called "${p.business_name}".`);
  if (p.primary_service) lines.push(`It mainly does: ${p.primary_service}.`);
  if (services.length)   lines.push(`Services offered: ${services.join("; ")}.`);
  if (p.owner_name)      lines.push(`The owner / main contact is ${p.owner_name}.`);
  if (areas.length)      lines.push(`It serves these areas: ${areas.join("; ")}.`);

  // Figures the owner supplied. Stated verbatim so the extractor files them as
  // provenNumbers rather than treating them as prose to paraphrase.
  if (p.years_operating != null)    lines.push(`It has been operating for ${p.years_operating} years.`);
  if (p.customers_served != null)   lines.push(`It has served ${p.customers_served} customers.`);
  if (p.projects_completed != null) lines.push(`It has completed ${p.projects_completed} projects.`);

  const contact: string[] = [];
  if (p.phone)          contact.push(`phone ${p.phone}`);
  if (p.whatsapp)       contact.push(`WhatsApp ${p.whatsapp}`);
  if (p.email)          contact.push(`email ${p.email}`);
  if (p.office_address) contact.push(`address ${p.office_address}`);
  if (contact.length) {
    lines.push(`Real contact details, to be used exactly as given: ${contact.join(", ")}.`);
  }

  if (p.about) lines.push(`In the owner's words: ${p.about}`);

  if (!lines.length) return "";

  return [
    "The following details were supplied by the business owner and are accurate.",
    "Treat them as stated facts.",
    "",
    ...lines,
  ].join("\n");
}

/**
 * Prepends the stored profile to an owner-written brief.
 *
 * The owner's own text comes last so that, where the two disagree, what they
 * typed for this specific run wins.
 */
export function mergeBrief(profileBrief: string, ownerBrief: string): string {
  const own = (ownerBrief ?? "").trim();
  if (!profileBrief) return own;
  if (!own) return profileBrief;
  return `${profileBrief}\n\n---\n\n${own}`;
}
