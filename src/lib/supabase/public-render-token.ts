import { createHash } from "node:crypto";
import { appSecret } from "@/lib/app-secret";

/**
 * The proxy marks anonymous public page views with this header so their
 * Supabase reads are cached (lib/supabase/public-cache.ts). Its value is a
 * one-way token only the server knows: a visitor sending the header
 * themselves cannot switch caching on for their own request.
 */
export const PUBLIC_RENDER_HEADER = "x-public-render";
export const PUBLIC_RENDER_TOKEN = createHash("sha256")
  .update(`${appSecret()}|public-render`)
  .digest("hex")
  .slice(0, 32);
