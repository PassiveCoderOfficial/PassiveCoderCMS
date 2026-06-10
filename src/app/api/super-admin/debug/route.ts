import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const cookieStore = await cookies();
  const all = cookieStore.getAll();
  const names = all.map((c) => c.name);
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return NextResponse.json({ cookieNames: names, userId: user?.id ?? null, email: user?.email ?? null, error: error?.message ?? null });
}
