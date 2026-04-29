export async function register() {
  // Only run in Node.js runtime (not Edge), only in production/server context
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, key);
    // Calls apply_migration_009() — idempotent, no-op after first run
    await supabase.rpc("apply_migration_009");
  } catch {
    // Non-fatal — migration may already be applied or RPC not yet deployed
  }
}
