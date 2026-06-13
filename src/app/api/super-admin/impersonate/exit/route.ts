import { NextResponse } from "next/server";
import { SA_VIEWING_COOKIE } from "@/lib/tenant/current";

function clearCookieOptions() {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "";
  const cookieDomain = rootDomain ? `.${rootDomain.replace(/:\d+$/, "")}` : undefined;
  return { maxAge: 0, path: "/", ...(cookieDomain ? { domain: cookieDomain } : {}) };
}

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SA_VIEWING_COOKIE, "", clearCookieOptions());
  return res;
}

export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/super-admin", req.url));
  res.cookies.set(SA_VIEWING_COOKIE, "", clearCookieOptions());
  return res;
}
