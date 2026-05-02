/**
 * Returns the cookie domain to use so auth cookies are shared across
 * the root domain and all tenant subdomains.
 *
 * - localhost (any port): undefined → host-only cookie (browsers don't
 *   support domain attribute for localhost subdomains anyway)
 * - production: "." + root → e.g. ".passivecoder.com" so cookies set on
 *   www.passivecoder.com are also sent to demo1.passivecoder.com
 */
export function getCookieDomain(): string | undefined {
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
  if (root.includes("localhost") || root.includes("127.0.0.1")) return undefined;
  // Strip port if any
  const noPort = root.replace(/:\d+$/, "");
  return `.${noPort}`;
}
