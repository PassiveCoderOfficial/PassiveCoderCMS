import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/super-admin";

export async function GET(req: Request) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (!q.trim() || q.length < 2) return NextResponse.json({ results: [] });

  const supabase = await createAdminClient();
  const qLike = `%${q}%`;

  const [{ data: tenants }, { data: profiles }] = await Promise.all([
    supabase.from("tenants")
      .select("id,name,slug,custom_domain,phone")
      .or(`name.ilike.${qLike},slug.ilike.${qLike},custom_domain.ilike.${qLike},phone.ilike.${qLike}`)
      .limit(8),
    supabase.from("profiles")
      .select("id,full_name,email")
      .or(`full_name.ilike.${qLike},email.ilike.${qLike}`)
      .limit(8),
  ]);

  const results = [
    ...(tenants ?? []).map(t => ({
      key: `t:${t.id}`,
      tenant_id: t.id,
      tenant_name: t.name,
      tenant_slug: t.slug,
      tenant_domain: t.custom_domain ?? null,
      user_id: null,
      user_email: null,
      user_name: null,
      phone: t.phone ?? null,
    })),
    ...(profiles ?? []).map(p => ({
      key: `p:${p.id}`,
      tenant_id: null,
      tenant_name: null,
      tenant_slug: null,
      tenant_domain: null,
      user_id: p.id,
      user_email: p.email,
      user_name: p.full_name,
      phone: null,
    })),
  ];

  return NextResponse.json({ results });
}
