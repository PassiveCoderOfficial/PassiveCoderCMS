import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/super-admin";

function nameToCode(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "").slice(0, 20) || "agent";
}

async function uniqueCode(supabase: Awaited<ReturnType<typeof createAdminClient>>, base: string): Promise<string> {
  let code = base;
  let attempt = 0;
  while (true) {
    const { data } = await supabase.from("agents").select("id").eq("referral_code", code).maybeSingle();
    if (!data) return code;
    attempt++;
    code = `${base}${attempt}`;
  }
}

export async function POST(req: Request) {
  const caller = await requireSuperAdmin();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { full_name, email, password, company, website, bio, commission_rate, commission_type, notes, existing_user_id } = body as {
    full_name: string;
    email: string;
    password?: string;
    company?: string;
    website?: string;
    bio?: string;
    commission_rate?: number;
    commission_type?: "recurring" | "one_time";
    notes?: string;
    existing_user_id?: string;
  };

  if (!full_name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email required" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  let userId = existing_user_id ?? null;

  if (!userId) {
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name.trim() },
    });
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 });
    userId = authData.user.id;
  }

  const { data: existing } = await supabase.from("agents").select("id").eq("user_id", userId).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "This user is already an agent" }, { status: 409 });
  }

  // Generate name-based referral code, ensure unique
  const referral_code = await uniqueCode(supabase, nameToCode(full_name.trim()));

  const { data: agent, error: agentErr } = await supabase.from("agents").insert({
    user_id: userId,
    full_name: full_name.trim(),
    email: email.trim(),
    company: company?.trim() || null,
    website: website?.trim() || null,
    bio: bio?.trim() || null,
    commission_rate: commission_rate ?? 20,
    commission_type: commission_type ?? "recurring",
    notes: notes?.trim() || null,
    status: "active",
    referral_code,
  }).select("id").single();

  if (agentErr) return NextResponse.json({ error: agentErr.message }, { status: 400 });

  // Set profile role to 'agent' so they can access /dashboard
  await supabase.from("profiles").update({ role: "agent" }).eq("id", userId);

  return NextResponse.json({ ok: true, agent_id: agent.id });
}
