// Supabase Edge Function — runs every 10 minutes
// Schedule: "*/10 * * * *"
// Checks pending custom domains and marks them active when DNS resolves

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VERCEL_TOKEN = Deno.env.get("VERCEL_API_TOKEN")!;
const VERCEL_PROJECT_ID = Deno.env.get("VERCEL_PROJECT_ID")!;
const VERCEL_IP = Deno.env.get("VERCEL_IP") ?? "76.76.21.21";
const INTERNAL_CRON_SECRET = Deno.env.get("INTERNAL_CRON_SECRET")!;

Deno.serve(async (req) => {
  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${INTERNAL_CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Find tenants with pending custom domains
  const { data: pendingTenants } = await supabase
    .from("tenants")
    .select("id, custom_domain")
    .eq("domain_status", "pending")
    .not("custom_domain", "is", null);

  const verified: string[] = [];

  for (const tenant of pendingTenants ?? []) {
    const domain = tenant.custom_domain as string;

    // Check DNS via Google
    const dnsRes = await fetch(`https://dns.google/resolve?name=${domain}&type=A`).catch(() => null);
    const dnsData = dnsRes ? await dnsRes.json() : null;
    const dnsOk = (dnsData?.Answer ?? []).some((a: { data: string }) => a.data === VERCEL_IP);

    // Check Vercel verification
    const vercelRes = await fetch(
      `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`,
      { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } },
    ).catch(() => null);
    const vercelData = vercelRes ? await vercelRes.json() : null;
    const vercelOk = vercelData?.verified === true;

    if (dnsOk && vercelOk) {
      await supabase
        .from("tenants")
        .update({ domain_status: "active" })
        .eq("id", tenant.id);

      await supabase
        .from("domain_orders")
        .update({ status: "active" })
        .eq("tenant_id", tenant.id)
        .eq("domain", domain);

      verified.push(domain);
    }
  }

  return new Response(
    JSON.stringify({ checked: pendingTenants?.length ?? 0, verified }),
    { headers: { "Content-Type": "application/json" } },
  );
});
