/**
 * Which social sign-in providers are switched on for the auth project, read
 * from Supabase's public settings endpoint (cached 5 minutes). Storefronts
 * show a provider's button only once it is enabled, so turning Google on in
 * Supabase is all it takes for the button to appear.
 */
export async function enabledSocialProviders(): Promise<{ google: boolean; facebook: boolean }> {
  try {
    const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "" },
      next: { revalidate: 300 },
    });
    const j = (await r.json()) as { external?: Record<string, boolean> };
    return { google: !!j.external?.google, facebook: !!j.external?.facebook };
  } catch {
    return { google: false, facebook: false };
  }
}
