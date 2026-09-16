import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { callModel, AiCoderError } from "@/lib/aicoder/generate";
import { reserveGeneration, refundGeneration, AiCoderQuotaError } from "@/lib/aicoder/quota";

/**
 * Generates the "About your business" paragraph from the profile fields the
 * tenant has already filled in — business name, services, service areas,
 * years operating, track record. Requested live: a tenant with a fully
 * built site still had to hand-write this one field from scratch, when
 * everything it needs to say was already sitting in the profile above it.
 * One-time use per profile in practice (there's one About field), so this
 * still goes through the normal AiCoder quota rather than being free —
 * consistent with every other AI generation on the platform.
 */
const aboutSchema = z.object({ about: z.string().min(40).max(600) });

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const admin = await createAdminClient();
  const { data: profile } = await admin
    .from("tenant_business_profiles")
    .select("business_name, primary_service, services, service_areas, years_operating, customers_served, projects_completed")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!profile?.business_name) {
    return NextResponse.json(
      { error: "Fill in the business name and services first — there's nothing to write from yet." },
      { status: 400 },
    );
  }

  let source: "quota" | "purchased";
  try {
    source = await reserveGeneration(tenantId, "business_profile_about", user.id);
  } catch (err) {
    if (err instanceof AiCoderQuotaError) return NextResponse.json({ error: err.message }, { status: 402 });
    throw err;
  }

  try {
    const facts = [
      `Business name: ${profile.business_name}`,
      profile.primary_service ? `Primary service: ${profile.primary_service}` : null,
      Array.isArray(profile.services) && profile.services.length
        ? `Services offered: ${profile.services.join(", ")}`
        : null,
      Array.isArray(profile.service_areas) && profile.service_areas.length
        ? `Service areas: ${profile.service_areas.join(", ")}`
        : null,
      profile.years_operating ? `Years in operation: ${profile.years_operating}` : null,
      profile.customers_served ? `Customers served: ${profile.customers_served}` : null,
      profile.projects_completed ? `Projects completed: ${profile.projects_completed}` : null,
    ].filter(Boolean).join("\n");

    const result = await callModel(
      aboutSchema,
      [
        "You write a short 'About us' paragraph for a small business's website, from facts the owner supplied.",
        "Use ONLY the facts given — never invent a claim, a number, a certification, or a founding story detail that wasn't provided.",
        "Write in first person plural (\"we\") or third person about the business — never invent an owner's name if one wasn't given.",
        "2-4 sentences. Confident and specific, not generic filler like 'we are the best' or 'customer satisfaction is our priority'.",
        "Output MUST be valid JSON matching the schema exactly.",
      ].join(" "),
      `Business facts:\n${facts}`,
      500,
    );
    return NextResponse.json({ about: result.about });
  } catch (err) {
    await refundGeneration(tenantId, source);
    if (err instanceof AiCoderError) return NextResponse.json({ error: err.message }, { status: 502 });
    return NextResponse.json({ error: "Could not generate — try again." }, { status: 500 });
  }
}
