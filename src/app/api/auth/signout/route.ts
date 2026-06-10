import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/auth/signout — used by the super-admin sidebar + SA banner links.
// Clears the Supabase session cookies and returns to the login page.
export async function GET(req: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", req.url));
}
