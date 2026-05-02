import { createBrowserClient } from "@supabase/ssr";

function getCookieDomain(): string | undefined {
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
  if (root.includes("localhost") || root.includes("127.0.0.1")) return undefined;
  const noPort = root.replace(/:\d+$/, "");
  return `.${noPort}`;
}

export function createClient() {
  const domain = getCookieDomain();
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: domain ? { domain, path: "/", sameSite: "lax" } : undefined,
    },
  );
}
