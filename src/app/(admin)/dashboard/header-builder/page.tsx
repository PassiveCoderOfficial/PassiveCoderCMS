import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { toBlocks } from "@/lib/site/global-blocks";
import { safeReturnTo } from "@/lib/site/return-to";
import HeaderBuilderClient, { type HeaderTarget } from "./header-builder-client";

export default async function HeaderBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ target?: string; returnTo?: string }>;
}) {
  const { target: rawTarget, returnTo: rawReturnTo } = await searchParams;
  const target: HeaderTarget = rawTarget === "footer" ? "footer" : "header";
  // Untrusted — comes straight from the URL. See safeReturnTo.
  const returnTo = safeReturnTo(rawReturnTo);

  const tenantId = await getCurrentTenantId();
  if (!tenantId) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">No site selected.</p>
      </div>
    );
  }

  const admin = await createAdminClient();
  const { data } = await admin
    .from("site_identity")
    .select("global_header, global_footer")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const initialBlocks = toBlocks(
    target === "header" ? data?.global_header : data?.global_footer,
  );

  return (
    <HeaderBuilderClient
      target={target}
      initialBlocks={initialBlocks}
      tenantId={tenantId}
      returnTo={returnTo}
    />
  );
}
