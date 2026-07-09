import { NextResponse, NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/agent";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    },
  );

  const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !session?.user) {
    return NextResponse.redirect(`${origin}/login?error=confirm_failed`);
  }

  const user = session.user;
  const admin = await createAdminClient();

  // Callback only fires for Supabase-issued confirmation/magic links, so a
  // successful code exchange implies the user proved control of the inbox.
  await admin.from("profiles").update({ email_verified_at: new Date().toISOString() })
    .eq("id", user.id).is("email_verified_at", null);
  await admin.from("profiles").update({ is_active: true })
    .eq("id", user.id).eq("is_active", false);

  // Auto-activate agent if pending and platform_settings.agent_auto_approve = true
  const { data: agent } = await admin
    .from("agents")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (agent?.status === "pending") {
    const { data: settings } = await admin
      .from("platform_settings")
      .select("agent_auto_approve")
      .eq("id", 1)
      .single();

    if (settings?.agent_auto_approve !== false) {
      await admin.from("agents").update({ status: "active" }).eq("id", agent.id);
      // Set profile role to agent
      await admin.from("profiles").update({ role: "agent" }).eq("id", user.id);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
