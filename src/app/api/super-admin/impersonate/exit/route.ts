import { NextResponse } from "next/server";
import { SA_VIEWING_COOKIE } from "@/lib/tenant/current";
import { getCookieDomain } from "@/lib/cookie-domain";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SA_VIEWING_COOKIE, "", { maxAge: 0, path: "/", domain: getCookieDomain() });
  return res;
}

export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/dashboard", req.url));
  res.cookies.set(SA_VIEWING_COOKIE, "", { maxAge: 0, path: "/", domain: getCookieDomain() });
  return res;
}
