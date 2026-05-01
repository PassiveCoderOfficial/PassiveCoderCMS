import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/super-admin";

export async function POST(req: Request) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await isSuperAdmin(user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email, password, full_name } = await req.json() as {
    email: string; password: string; full_name?: string;
  };

  if (!email?.trim()) return NextResponse.json({ error: "Email required" }, { status: 400 });
  if (!password || password.length < 8) return NextResponse.json({ error: "Password min 8 chars" }, { status: 400 });

  const admin = await createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: full_name ? { full_name } : undefined,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, userId: data.user.id });
}
