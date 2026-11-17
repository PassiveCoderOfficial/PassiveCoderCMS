import { z } from "zod";

/**
 * Validation for the tenant's business profile, shared by the Business
 * Profile screen (/api/business-profile) and the MCP update_business_profile
 * tool, so both accept exactly the same values.
 *
 * Every field is optional: the wizard saves progress step by step, and a blank
 * field must stay blank rather than be filled with a plausible guess.
 */
export const businessProfileFields = {
  business_name: z.string().max(120).nullish(),
  primary_service: z.string().max(160).nullish(),
  services: z.array(z.string().min(1).max(80)).max(30).optional(),
  owner_name: z.string().max(120).nullish(),
  years_operating: z.number().int().min(0).max(200).nullish(),
  customers_served: z.number().int().min(0).nullish(),
  projects_completed: z.number().int().min(0).nullish(),
  service_areas: z.array(z.string().min(1).max(120)).max(30).optional(),
  phone: z.string().max(40).nullish(),
  whatsapp: z.string().max(40).nullish(),
  email: z.string().max(160).nullish(),
  office_address: z.string().max(300).nullish(),
  city: z.string().max(120).nullish(),
  country_code: z.string().max(8).nullish(),
  /** Free text, e.g. "Sat-Thu 9am-8pm, Friday closed". */
  opening_hours: z.string().max(300).nullish(),
  about: z.string().max(2000).nullish(),
};

export const businessProfileSchema = z.object({
  ...businessProfileFields,
  /** Set by the final wizard step. Marks the profile done. */
  completed: z.boolean().optional(),
});
