/**
 * Who may author templates.
 *
 * Per the Ticket 5 spec: super admins, plus "Staff Admins" — which in this
 * codebase means an active agent row with `is_staff = true` (the same flag
 * the recurring-commission logic in `lib/commissions.ts` keys off). Regular
 * tenant owners/editors cannot create templates.
 */
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/super-admin";
import type { User } from "@supabase/supabase-js";

export type TemplateAuthor = {
  user: User;
  isSuperAdmin: boolean;
};

/**
 * Returns the caller if they may author templates, else null.
 * Super admins can edit every template; staff can only edit their own
 * (enforced by RLS via `templates.owner_id`, this just gates the entry point).
 */
export async function requireTemplateAuthor(): Promise<TemplateAuthor | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  if (await isSuperAdmin(user.id)) {
    return { user, isSuperAdmin: true };
  }

  const admin = await createAdminClient();
  const { data: agent } = await admin
    .from("agents")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_staff", true)
    .eq("status", "active")
    .maybeSingle();

  return agent ? { user, isSuperAdmin: false } : null;
}

// Re-exported for the server routes that already import it from here; the
// implementation lives in `slug.ts` so client components can use it without
// pulling this module's server-only Supabase imports into their bundle.
export { slugifyTemplateName } from "./slug";
