import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/super-admin";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: tenantId } = await params;
  const admin = await createAdminClient();

  const { data: tenant } = await admin.from("tenants").select("owner_id").eq("id", tenantId).maybeSingle();

  let ownerEmail: string | null = null;
  let ownerName: string | null = null;
  if (tenant?.owner_id) {
    const { data: profile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", tenant.owner_id)
      .maybeSingle();
    ownerEmail = profile?.email ?? null;
    ownerName = profile?.full_name ?? null;
  }

  // Fall back to any tenant_members owner if tenants.owner_id is unset.
  if (!ownerEmail) {
    const { data: member } = await admin
      .from("tenant_members")
      .select("profiles(email, full_name)")
      .eq("tenant_id", tenantId)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle();
    const profile = (Array.isArray(member?.profiles) ? member?.profiles[0] : member?.profiles) as
      { email: string; full_name: string | null } | null;
    ownerEmail = profile?.email ?? null;
    ownerName = profile?.full_name ?? null;
  }

  const { data: contact } = await admin
    .from("contact_details")
    .select("phone, whatsapp, email")
    .eq("tenant_id", tenantId)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    owner_name: ownerName,
    owner_email: ownerEmail,
    site_phone: contact?.phone ?? null,
    site_whatsapp: contact?.whatsapp ?? null,
    site_email: contact?.email ?? null,
  });
}
