import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Temporary diagnostic — remove after debugging SA auth issue
export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll().map(c => c.name);

  const supabase = await createClient();

  const sessionResult = await supabase.auth.getSession();
  const sessionUser = sessionResult.data.session?.user ?? null;

  const getUserResult = await supabase.auth.getUser();
  const getUser = getUserResult.data.user ?? null;
  const getUserErr = getUserResult.error?.message ?? null;

  let saRow: unknown = null;
  let saErr: unknown = null;
  if (sessionUser || getUser) {
    const uid = (sessionUser ?? getUser)!.id;
    const admin = await createAdminClient();
    const { data, error } = await admin.from("super_admins").select("user_id").eq("user_id", uid).maybeSingle();
    saRow = data;
    saErr = error?.message ?? null;
  }

  return NextResponse.json({
    cookieNames: allCookies,
    sessionUser: sessionUser ? { id: sessionUser.id, email: sessionUser.email } : null,
    getUser: getUser ? { id: getUser.id, email: getUser.email } : null,
    getUserErr,
    saRow,
    saErr,
  });
}
