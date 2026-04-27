import { NextResponse } from "next/server";
import { SA_VIEWING_COOKIE } from "@/lib/tenant/current";

export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/super-admin/sites", req.url));
  res.cookies.set(SA_VIEWING_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
