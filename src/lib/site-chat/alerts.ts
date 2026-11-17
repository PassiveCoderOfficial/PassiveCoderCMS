import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { notifyTenantEvent, notifyUsers } from "@/lib/push/notify";
import { ROOT_TENANT_SLUG } from "@/lib/flags";
import { rootTenantId } from "@/lib/site/root-builder";

/** Is this the platform's own site (whose chat staff and super admins also answer)? */
export async function isRootTenant(tenantId: string): Promise<boolean> {
  if ((await rootTenantId()) === tenantId) return true;
  const admin = await createAdminClient();
  const { data } = await admin.from("tenants").select("slug").eq("id", tenantId).maybeSingle();
  return data?.slug === ROOT_TENANT_SLUG;
}

/**
 * A visitor asked for a person: the site's own team hears it, and on the root
 * site so do active staff and super admins (Staff portal / Super Admin > Site
 * Chat), so a human can step in when the owner is away. One alert per chat.
 */
export async function alertHumanWanted(tenantId: string, conversationId: string, message: string): Promise<void> {
  const ev = { tenantId, type: "chat_human" as const, id: conversationId, path: `chat/${conversationId}`, title: "A visitor wants to talk to a person", body: message.slice(0, 140), dedupeKey: `chat-human-${conversationId}` };
  const jobs: Promise<unknown>[] = [notifyTenantEvent({ ...ev, webUrl: "/dashboard/chat" })];
  if (await isRootTenant(tenantId).catch(() => false)) {
    const admin = await createAdminClient();
    const [{ data: staff }, { data: sas }] = await Promise.all([
      admin.from("pc_staff").select("user_id").eq("status", "active"),
      admin.from("super_admins").select("user_id"),
    ]);
    const onDuty = (staff ?? []).map((r) => r.user_id as string).filter(Boolean);
    const users = [...onDuty, ...(sas ?? []).map((r) => r.user_id as string)];
    jobs.push(notifyUsers(users, { ...ev, onDuty }));
  }
  await Promise.all(jobs);
}
