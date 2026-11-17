import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import InvoicesClient from "./invoices-client";

export const metadata = { title: "Invoices — Dashboard" };

export default async function InvoicesPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();

  const [{ data: invoices }, { data: settings }] = await Promise.all([
    supabase.from("invoices").select("*")
      .eq("tenant_id", tid).order("created_at", { ascending: false }).limit(200),
    supabase.from("site_settings").select("currency")
      .eq("tenant_id", tid).maybeSingle(),
  ]);

  const baseCurrency = settings?.currency || "USD";

  return <InvoicesClient initialInvoices={invoices ?? []} baseCurrency={baseCurrency || "USD"} />;
}
