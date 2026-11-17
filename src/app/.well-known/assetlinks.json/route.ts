import { NextResponse } from "next/server";
import { ANDROID_APP_PACKAGE } from "@/types/api";

/**
 * Android App Links: lets https://passivecoder.com/... (and site
 * subdomains) open the Passive Coder admin app directly.
 *
 * The signing certificate fingerprint comes from EAS after the first build:
 * set ANDROID_APP_SHA256 (comma-separated, "AB:CD:..." form) in Vercel. Until
 * then this answers an empty list, which Android treats as "not verified".
 */
export function GET() {
  const fingerprints = (process.env.ANDROID_APP_SHA256 ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(s));

  const body = fingerprints.length
    ? [{
        relation: ["delegate_permission/common.handle_all_urls"],
        target: { namespace: "android_app", package_name: ANDROID_APP_PACKAGE, sha256_cert_fingerprints: fingerprints },
      }]
    : [];

  return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=3600" } });
}
