/**
 * The secret that signs app tokens (act-as, preview links, public-render
 * marker, write-actor, OAuth state, unsubscribe links).
 *
 * APP_SECRET when set. Otherwise the Supabase service-role key, which is what
 * every one of these used before APP_SECRET existed, so tokens issued by the
 * hosted platform stay valid until APP_SECRET is configured there. Self-hosted
 * installs should set APP_SECRET (a long random string) so rotating the
 * Supabase key does not silently invalidate their links.
 */
export function appSecret(): string {
  return process.env.APP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}
