import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { seedBusinessProfileFromSite } from "@/modules/business-profile/seed-from-site";

/**
 * The tenant's business profile — the single record behind AiCoder generation,
 * the site's contact/service blocks, and the ExpertNear.Me listing.
 *
 * Every field is optional: the wizard saves progress step by step, and a blank
 * field must stay blank rather than be filled with a plausible guess. The
 * track-record numbers in particular become public claims downstream.
 */
const profileSchema = z.object({
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
  country_code: z.string().max(8).nullish(),
  about: z.string().max(2000).nullish(),
  /** Set by the final wizard step. Gates ENM provisioning. */
  completed: z.boolean().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const admin = await createAdminClient();
  const { data } = await admin
    .from("tenant_business_profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (data) return NextResponse.json({ profile: data });

  // No profile saved yet — a tenant whose site was actually built (staff,
  // AiCoder, manual) already has real business name/services/contact data
  // sitting in their own pages. Seed the wizard from that instead of
  // opening it blank and asking them to retype what they already wrote.
  // Never persisted here — this is a prefill only, saved for real the first
  // time the tenant hits Continue/Save on the wizard itself.
  const seed = await seedBusinessProfileFromSite(admin, tenantId);
  const hasAnySeedData = Object.values(seed).some((v) => (Array.isArray(v) ? v.length > 0 : !!v));
  if (!hasAnySeedData) return NextResponse.json({ profile: null });

  return NextResponse.json({
    profile: {
      ...seed,
      owner_name: null,
      years_operating: null,
      customers_served: null,
      projects_completed: null,
      service_areas: null,
      country_code: null,
      about: null,
      completed_at: null,
    },
    seeded: true,
  });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const parsed = profileSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const admin = await createAdminClient();

  // Writes go through the admin client, so re-check edit rights explicitly
  // rather than relying on RLS.
  const { data: member } = await admin
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();
  const { data: sa } = await admin
    .from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  const canEdit = !!sa || ["owner", "admin", "editor"].includes(member?.role ?? "");
  if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { completed, ...fields } = parsed.data;
  const row: Record<string, unknown> = { tenant_id: tenantId, ...fields };
  if (completed === true) row.completed_at = new Date().toISOString();
  if (completed === false) row.completed_at = null;

  const { data, error } = await admin
    .from("tenant_business_profiles")
    .upsert(row, { onConflict: "tenant_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
