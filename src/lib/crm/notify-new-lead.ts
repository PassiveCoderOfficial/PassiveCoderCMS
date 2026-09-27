import { createAdminClient } from "@/lib/supabase/server";
import { sendExpoPush } from "@/lib/donors/push";

/**
 * Push-notify everyone who can act on a tenant's leads (owner, tenant_members,
 * plus any super admin who has the mobile-admin app installed — best-effort,
 * small platform) when a brand-new CRM contact lands. Deep-links into the
 * mobile app's lead detail screen via the `pcadmin://` scheme.
 */
export async function notifyTenantNewLead(input: {
  tenantId: string;
  contactId: string;
  name: string;
  source: string;
}): Promise<void> {
  const admin = await createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("name, owner_id, demo_expires_at")
    .eq("id", input.tenantId)
    .maybeSingle();
  // Demo sites are owned by the staff member who built them; leads there are
  // stored for the prospect but must not ping staff phones.
  if (!tenant || tenant.demo_expires_at) return;

  const recipientIds = new Set<string>();
  if (tenant.owner_id) recipientIds.add(tenant.owner_id);

  const { data: members } = await admin
    .from("tenant_members")
    .select("user_id, role")
    .eq("tenant_id", input.tenantId)
    .neq("role", "viewer"); // viewers can't act on leads, don't wake them for one
  for (const m of members ?? []) recipientIds.add(m.user_id);

  if (!recipientIds.size) return;

  const { data: devices } = await admin
    .from("admin_app_devices")
    .select("expo_token")
    .in("user_id", Array.from(recipientIds));
  if (!devices?.length) return;

  await sendExpoPush(
    devices.map((d) => ({
      to: d.expo_token,
      title: `New lead — ${tenant.name}`,
      body: input.name,
      data: {
        type: "lead",
        tenantId: input.tenantId,
        contactId: input.contactId,
        deeplink: `pcadmin://sites/${input.tenantId}/leads/${input.contactId}`,
      },
    })),
  );
}
