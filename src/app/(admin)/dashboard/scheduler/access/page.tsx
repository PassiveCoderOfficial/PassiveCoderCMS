import { getCurrentTenantId } from "@/lib/tenant/current";
import { createAdminClient } from "@/lib/supabase/server";
import AccessClient from "./access-client";

export const metadata = { title: "Access — Content Scheduler" };

export default async function AccessPage() {
  const tid = await getCurrentTenantId();
  const admin = await createAdminClient();

  // Current grant holders, plus the owners/admins who have implicit access —
  // the list has to show why someone can see the scheduler, not just the
  // explicit rows, or an owner looks absent from their own module.
  const [{ data: grants }, { data: members }] = await Promise.all([
    admin
      .from("content_module_grants")
      .select("user_id, access_level, created_at")
      .eq("tenant_id", tid),
    admin
      .from("tenant_members")
      .select("user_id, role")
      .eq("tenant_id", tid)
      .in("role", ["owner", "admin"]),
  ]);

  const userIds = [
    ...new Set([
      ...(grants ?? []).map((g) => g.user_id as string),
      ...(members ?? []).map((m) => m.user_id as string),
    ]),
  ];

  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, full_name, email").in("id", userIds)
    : { data: [] };

  const profileById = new Map(
    (profiles ?? []).map((p) => [p.id as string, p as { id: string; full_name: string | null; email: string }]),
  );
  const implicitRole = new Map((members ?? []).map((m) => [m.user_id as string, m.role as string]));

  const rows = userIds.map((id) => {
    const grant = (grants ?? []).find((g) => g.user_id === id);
    const p = profileById.get(id);
    return {
      user_id: id,
      full_name: p?.full_name ?? null,
      email: p?.email ?? "",
      access_level: grant?.access_level as string | undefined,
      implicit: implicitRole.get(id),
    };
  });

  return <AccessClient rows={rows} />;
}
