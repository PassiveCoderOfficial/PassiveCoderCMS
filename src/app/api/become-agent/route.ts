import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

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
  const { full_name, email, password, company, website, bio } = await req.json() as {
    full_name: string; email: string; password: string;
    company?: string; website?: string; bio?: string;
  };

  if (!full_name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email required" }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  // Read platform defaults
  const { data: settings } = await supabase
    .from("platform_settings")
    .select("default_commission_rate, default_commission_type, agent_signup_enabled, agent_auto_approve")
    .eq("id", 1)
    .single();

  if (settings?.agent_signup_enabled === false) {
    return NextResponse.json({ error: "Agent signup is currently closed" }, { status: 403 });
  }

  const commissionRate = settings?.default_commission_rate ?? 20;
  const commissionType = settings?.default_commission_type ?? "recurring";
  const autoApprove = settings?.agent_auto_approve !== false;
  const status = autoApprove ? "active" : "pending";

  // Check if email already registered as agent
  const { data: existingAgent } = await supabase
    .from("agents").select("id").eq("email", email.trim()).maybeSingle();
  if (existingAgent) {
    return NextResponse.json({ error: "This email is already registered as an agent" }, { status: 409 });
  }

  // Check if auth user exists already
  const { data: existingProfile } = await supabase
    .from("profiles").select("id").eq("email", email.trim()).maybeSingle();

  let userId: string;

  if (existingProfile) {
    // User exists — just add agent role
    userId = existingProfile.id;
    await supabase.from("profiles").update({ role: "agent" }).eq("id", userId);
  } else {
    // Create new auth user with real password
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: false, // send confirmation email
      user_metadata: { full_name: full_name.trim() },
    });
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 });
    userId = authData.user.id;
  }

  // Generate name-based referral code
  const referral_code = await uniqueCode(supabase, nameToCode(full_name.trim()));

  const { error: agentErr } = await supabase.from("agents").insert({
    user_id: userId,
    full_name: full_name.trim(),
    email: email.trim(),
    company: company?.trim() || null,
    website: website?.trim() || null,
    bio: bio?.trim() || null,
    commission_rate: commissionRate,
    commission_type: commissionType,
    referral_code,
    status,
  });

  if (agentErr) return NextResponse.json({ error: agentErr.message }, { status: 400 });

  return NextResponse.json({ ok: true, status, referral_code });
}
