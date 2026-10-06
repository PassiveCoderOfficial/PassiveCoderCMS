import { NextResponse } from "next/server";
import { teamAccess } from "@/lib/team/access";

/**
 * Set a new password for a member of this site's team (active immediately).
 *
 * Accounts are platform-wide: one login can belong to several sites, to
 * platform staff, or to a super admin. So outside of super admins, a site's
 * managers may only reset people who belong to THIS site alone — never the
 * owner, never staff/super admins, never anyone with access elsewhere —
 * otherwise a site admin could take over an account that opens other
 * businesses' sites. Your own password is changed from your account page.
 */
export async function POST(req: Request) {
  const a = await teamAccess();
  if (!a?.manage) return NextResponse.json({ error: "Only the site owner or an admin can change passwords." }, { status: 403 });

  const body = await req.json().catch(() => ({})) as { userId?: string; password?: string };
  const userId = String(body.userId ?? "");
  const password = typeof body.password === "string" ? body.password : "";
  if (!userId) return NextResponse.json({ error: "Missing user." }, { status: 400 });
  if (password.length < 8 || password.length > 72) return NextResponse.json({ error: "Password must be 8 to 72 characters." }, { status: 400 });
  if (userId === a.userId) return NextResponse.json({ error: "Change your own password from your account settings." }, { status: 400 });

  const { data: member } = await a.admin.from("tenant_members").select("role")
    .eq("tenant_id", a.tenantId).eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "That person is not on this site's team." }, { status: 404 });

  if (!a.superAdmin) {
    if (member.role === "owner") {
      return NextResponse.json({ error: "The site owner's password can only be changed by the owner or Passive Coder support." }, { status: 403 });
    }
    const [{ data: sa }, { data: staff }, { count: otherSites }] = await Promise.all([
      a.admin.from("super_admins").select("user_id").eq("user_id", userId).maybeSingle(),
      a.admin.from("pc_staff").select("id").eq("user_id", userId).maybeSingle(),
      a.admin.from("tenant_members").select("tenant_id", { count: "exact", head: true })
        .eq("user_id", userId).neq("tenant_id", a.tenantId),
    ]);
    if (sa || staff) return NextResponse.json({ error: "This is a Passive Coder team account; its password can't be changed here." }, { status: 403 });
    if ((otherSites ?? 0) > 0) {
      return NextResponse.json({ error: "This person also has access to other sites, so only they (or Passive Coder support) can change their password." }, { status: 403 });
    }
  }

  const { error } = await a.admin.auth.admin.updateUserById(userId, { password });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
