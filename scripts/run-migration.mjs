/**
 * Runs the migration SQL via Supabase's pg_dump/rpc approach.
 * Uses the service role key to call a raw SQL exec via PostgREST rpc.
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = "https://mljchiaabgvdzdsfobxs.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samNoaWFhYmd2ZHpkc2ZvYnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA4NDY5MywiZXhwIjoyMDkyNjYwNjkzfQ.XRbc2vlAhbQWNRv4qIaU161_S7xBvEoVcnzripB92gI";

async function checkTable(table) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?limit=1`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  return res.ok;
}

async function insertRow(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(data),
  });
  return res.ok || res.status === 409; // 409 = conflict/already exists
}

async function main() {
  console.log("Checking Supabase connectivity...");

  const profilesExist = await checkTable("profiles");
  if (profilesExist) {
    console.log("✓ Database tables already exist.");
  } else {
    console.log("✗ profiles table not found.");
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("The Supabase Management API requires a personal access token");
    console.log("(not the service role key) to run raw SQL remotely.");
    console.log("\nYou need to run the migration manually. Here's the quickest way:\n");
    console.log("1. Open: https://supabase.com/dashboard/project/mljchiaabgvdzdsfobxs/sql/new");
    console.log("2. Paste the contents of: supabase/migrations/001_initial_schema.sql");
    console.log("3. Click Run");
    console.log("4. Then run this to make yourself admin:");
    console.log("   UPDATE public.profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL';");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return;
  }

  // Tables exist — seed payment gateways if missing
  console.log("\nSeeding payment gateways...");
  const gateways = [
    { name: "Manual Payment", slug: "manual", description: "Accept payments manually (bank transfer, cash, etc.)", supported_currencies: ["USD","EUR","GBP","BDT"] },
    { name: "Stripe", slug: "stripe", description: "Accept credit/debit card payments via Stripe", supported_currencies: ["USD","EUR","GBP","CAD","AUD"] },
    { name: "PayPal", slug: "paypal", description: "Accept payments via PayPal", supported_currencies: ["USD","EUR","GBP","CAD","AUD"] },
    { name: "SSLCommerz", slug: "sslcommerz", description: "Bangladesh payment gateway (SSL Wireless)", supported_currencies: ["BDT","USD"] },
    { name: "ShurjoPay", slug: "shurjopay", description: "Bangladesh payment gateway by ShurjoPay", supported_currencies: ["BDT"] },
    { name: "bKash", slug: "bkash", description: "Mobile banking payment gateway by bKash", supported_currencies: ["BDT"] },
    { name: "Nagad", slug: "nagad", description: "Mobile banking payment gateway by Nagad", supported_currencies: ["BDT"] },
  ];

  for (const gw of gateways) {
    const ok = await insertRow("payment_gateways", gw);
    console.log(ok ? `✓ ${gw.name}` : `⚠ ${gw.name} (may already exist)`);
  }

  console.log("\n✅ Done! The database is seeded.");
}

main().catch(console.error);
