import { NextResponse } from "next/server";
import { STAFF_VIEWING_COOKIE } from "@/lib/tenant/current";

export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/staff/sites", req.url));
  res.cookies.set(STAFF_VIEWING_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
