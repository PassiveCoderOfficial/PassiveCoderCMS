import { NextResponse } from "next/server";
import { teamAccess, type TeamAccess } from "@/lib/team/access";
import { ROOT_DOMAIN } from "@/lib/flags";

const ROLES = ["admin", "editor", "viewer"] as const;

/** The site's team with names and emails. */
export async function GET() {
  const a = await teamAccess();
  if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: rows } = await a.admin.from("tenant_members").select("user_id, role, joined_at")
    .eq("tenant_id", a.tenantId).order("joined_at");
  const ids = (rows ?? []).map((r) => r.user_id);
  const { data: profiles } = ids.length
    ? await a.admin.from("profiles").select("id, email, full_name, avatar_url").in("id", ids)
    : { data: [] };
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  const members = (rows ?? []).map((r) => {
    const p = byId.get(r.user_id);
    return { ...r, profiles: p ? { email: p.email, full_name: p.full_name, avatar_url: p.avatar_url } : null };
  });
  // Where this site's team signs in, for the "login details" handed over
  // after creating a user: the live custom domain when there is one, not
  // the platform subdomain the dashboard happens to be open on.
  const { data: t } = await a.admin.from("tenants").select("slug, custom_domain, domain_status").eq("id", a.tenantId).maybeSingle();
  const proto = ROOT_DOMAIN.includes("localhost") ? "http" : "https";
  const siteUrl = t?.custom_domain && t.domain_status === "active"
    ? `https://${t.custom_domain}`
    : t?.slug ? `${proto}://${t.slug}.${ROOT_DOMAIN}` : null;
  return NextResponse.json({ members, canManage: a.manage, me: a.userId, siteUrl });
}

async function target(a: TeamAccess, userId: string) {
  const { data } = await a.admin.from("tenant_members").select("role").eq("tenant_id", a.tenantId).eq("user_id", userId).maybeSingle();
  return data?.role as string | undefined;
}

/** Change a member's role. The owner's role only changes through a site transfer. */
export async function PATCH(req: Request) {
  const a = await teamAccess();
  if (!a?.manage) return NextResponse.json({ error: "Only the site owner or an admin can change roles." }, { status: 403 });
  const { userId, role } = await req.json().catch(() => ({})) as { userId?: string; role?: string };
  if (!userId || !ROLES.includes(role as typeof ROLES[number])) return NextResponse.json({ error: "Choose admin, editor or view only." }, { status: 400 });
  const current = await target(a, userId);
  if (!current) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  if (current === "owner") return NextResponse.json({ error: "The owner's role can't be changed. Use Transfer site to hand over ownership." }, { status: 400 });
  const { error } = await a.admin.from("tenant_members").update({ role }).eq("tenant_id", a.tenantId).eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

/** Remove a member. The owner can't be removed; anyone may leave a site themselves. */
export async function DELETE(req: Request) {
  const a = await teamAccess();
  if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = new URL(req.url).searchParams.get("userId") ?? "";
  if (!a.manage && userId !== a.userId) return NextResponse.json({ error: "Only the site owner or an admin can remove members." }, { status: 403 });
  const current = await target(a, userId);
  if (!current) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  if (current === "owner") return NextResponse.json({ error: "The owner can't be removed. Use Transfer site to hand over ownership first." }, { status: 400 });
  const { error } = await a.admin.from("tenant_members").delete().eq("tenant_id", a.tenantId).eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  // Their AI Connect tokens for this site stop working too.
  await a.admin.from("mcp_tokens").update({ revoked_at: new Date().toISOString() })
    .eq("tenant_id", a.tenantId).eq("user_id", userId).is("revoked_at", null);
  return NextResponse.json({ ok: true });
}
