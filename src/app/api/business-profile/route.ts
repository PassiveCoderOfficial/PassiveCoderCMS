import { NextResponse } from "next/server";
import { businessProfileSchema } from "@/lib/business-profile/schema";
import { createAdminClient } from "@/lib/supabase/server";
import { getApiCaller, apiSupabase } from "@/lib/auth/api-caller";
import { canWriteSite } from "@/lib/auth/site-write";
import { seedBusinessProfileFromSite } from "@/modules/business-profile/seed-from-site";

/**
 * The tenant's business profile — the single record behind AiCoder generation,
 * and the site's contact/service blocks.
 *
 * Every field is optional: the wizard saves progress step by step, and a blank
 * field must stay blank rather than be filled with a plausible guess. The
 * track-record numbers in particular become public claims downstream.
 */
// Shared with the MCP update_business_profile tool.
const profileSchema = businessProfileSchema;

export async function GET() {
  const supabase = await apiSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = (await getApiCaller())?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const admin = await createAdminClient();
  const { data } = await admin
    .from("tenant_business_profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  // A new trial's row holds only the country from signup (create-tenant): the
  // owner has not started the wizard, so the prefill below still applies.
  const signupOnly = !!data && !data.completed_at && !data.business_name && !data.primary_service
    && !data.phone && !data.whatsapp && !data.email && !data.office_address && !data.about
    && !(Array.isArray(data.services) && data.services.length);
  if (data && !signupOnly) return NextResponse.json({ profile: data });

  // No profile saved yet — a tenant whose site was actually built (staff,
  // AiCoder, manual) already has real business name/services/contact data
  // sitting in their own pages. Seed the wizard from that instead of
  // opening it blank and asking them to retype what they already wrote.
  // Never persisted here — this is a prefill only, saved for real the first
  // time the tenant hits Continue/Save on the wizard itself.
  const seed = await seedBusinessProfileFromSite(admin, tenantId);
  const hasAnySeedData = Object.values(seed).some((v) => (Array.isArray(v) ? v.length > 0 : !!v));
  if (!hasAnySeedData) return NextResponse.json({ profile: data ?? null });

  return NextResponse.json({
    profile: {
      ...seed,
      owner_name: null,
      years_operating: null,
      customers_served: null,
      projects_completed: null,
      service_areas: null,
      country_code: data?.country_code ?? null,
      about: null,
      completed_at: null,
    },
    seeded: true,
  });
}

export async function PATCH(req: Request) {
  const supabase = await apiSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = (await getApiCaller())?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const parsed = profileSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const admin = await createAdminClient();

  // Writes go through the admin client, so re-check edit rights explicitly
  // rather than relying on RLS.
  // (Shared rule: owner/admin/editor, assigned staff, super admin.)
  if (!(await canWriteSite(tenantId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
