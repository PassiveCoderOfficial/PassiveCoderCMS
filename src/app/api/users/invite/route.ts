import { NextResponse } from "next/server";
import { likeExact } from "@/lib/security/like";
import { teamAccess, type TeamAccess } from "@/lib/team/access";

const ROLES = ["admin", "editor", "viewer"];

/**
 * Add someone to the site's team. Existing accounts are added straight away;
 * new people get an invite email, or, when a password is supplied, an account
 * that is active immediately (email pre-confirmed, no mail sent) so staff and
 * site admins can hand over login details themselves.
 *
 * A password never touches an EXISTING account: letting a site admin set the
 * password of any address they type would be an account takeover. Those
 * people are added to the team with their current password.
 *
 * Owner is never assignable here, and an existing member's role is never
 * silently changed by re-inviting them.
 *
 * tenant_members.created_by_site (migration 250) records that THIS site made
 * the account. Only those accounts can later have their password set by the
 * site's own admins (api/users/password); an existing account added by email
 * stays false, so adding someone to a team never makes them resettable.
 */
async function addCreatedMember(a: TeamAccess, userId: string, role: string) {
  const row = { tenant_id: a.tenantId, user_id: userId, role, joined_at: new Date().toISOString() };
  const first = await a.admin.from("tenant_members").insert({ ...row, created_by_site: true });
  // Column not there yet (code deployed before migration 250): add the member
  // unmarked, which only means the site's admins can't set their password.
  if (first.error && /created_by_site/.test(first.error.message)) return a.admin.from("tenant_members").insert(row);
  return first;
}

/**
 * Add someone to the site's team: see the notes above.
 */
export async function POST(req: Request) {
  const a = await teamAccess();
  if (!a?.manage) return NextResponse.json({ error: "Only the site owner or an admin can invite people." }, { status: 403 });

  const body = await req.json().catch(() => ({})) as { email?: string; role?: string; password?: string; fullName?: string };
  const email = String(body.email ?? "").trim().toLowerCase();
  const role = String(body.role ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (!ROLES.includes(role)) return NextResponse.json({ error: "Choose admin, editor or view only." }, { status: 400 });
  const password = typeof body.password === "string" ? body.password : "";
  if (password && (password.length < 8 || password.length > 72)) {
    return NextResponse.json({ error: "Password must be 8 to 72 characters." }, { status: 400 });
  }
  const fullName = String(body.fullName ?? "").trim().slice(0, 120);

  // profiles mirrors auth.users and is indexed by email; listUsers() only
  // returned the first page, so existing accounts past it were "not found".
  const { data: existing } = await a.admin.from("profiles").select("id").ilike("email", likeExact(email)).maybeSingle();

  if (existing) {
    const { data: member } = await a.admin.from("tenant_members").select("role")
      .eq("tenant_id", a.tenantId).eq("user_id", existing.id).maybeSingle();
    if (member) return NextResponse.json({ error: `${email} is already on this site's team (${member.role}). Change their role in the list instead.` }, { status: 409 });
    const { error } = await a.admin.from("tenant_members").insert({ tenant_id: a.tenantId, user_id: existing.id, role, joined_at: new Date().toISOString() });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, existing: true, passwordSet: false });
  }

  if (password) {
    const { data: created, error: createError } = await a.admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: fullName ? { full_name: fullName } : {},
    });
    if (createError || !created.user) {
      return NextResponse.json({ error: createError?.message ?? "Could not create the account." }, { status: 500 });
    }
    if (fullName) await a.admin.from("profiles").update({ full_name: fullName }).eq("id", created.user.id);
    const { error } = await addCreatedMember(a, created.user.id, role);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, created: true, passwordSet: true });
  }

  const { data: invited, error: inviteError } = await a.admin.auth.admin.inviteUserByEmail(email, {
    data: { tenant_id: a.tenantId, invited_role: role },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
  });
  if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 500 });

  // Pre-create membership so they have access on first login.
  await addCreatedMember(a, invited.user.id, role);
  return NextResponse.json({ ok: true });
}
