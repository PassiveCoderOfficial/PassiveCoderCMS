/*
 * Passive Coder's licence PUBLIC key (Ed25519, raw 32 bytes, base64url).
 *
 * HOW TO SET IT (one time, by Passive Coder, not by a self-hoster):
 *   1. node scripts/licence/sign-licence.mjs keygen --out <folder OUTSIDE the repo>
 *      This writes licence-private.pem (keep it secret, never commit it) and
 *      licence-public.txt.
 *   2. Paste the one line from licence-public.txt below, replacing the empty
 *      string, and commit. Every build after that verifies licences against it.
 *
 * While this is empty (the placeholder), the key may come from the
 * PASSIVECODER_LICENCE_PUBLIC_KEY environment variable instead, so the
 * mechanism can be tested before the real key exists. Once a key is set here,
 * that environment variable is ignored: a site owner cannot swap in their own
 * key and sign their own licence.
 *
 * A public key is not a secret. The private key is.
 */
export const LICENCE_PUBLIC_KEY = "zEtgT8x1KmaqnghCy5AmFrIWHbq7kSRVC4OE4iu32dc";
