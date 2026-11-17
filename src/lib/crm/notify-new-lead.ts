import { notifyTenantEvent } from "@/lib/push/notify";

/** Contact sources whose own route already sends a richer notification
 *  (form submission, booking, order), so a new CRM contact from them must
 *  not ping a second time. */
const NOTIFIED_ELSEWHERE = new Set(["form", "booking", "order"]);

/** New CRM contact -> "new lead" notification (app push + inbox + web bell). */
export async function notifyTenantNewLead(input: {
  tenantId: string;
  contactId: string;
  name: string;
  source: string;
}): Promise<void> {
  if (NOTIFIED_ELSEWHERE.has(input.source)) return;
  await notifyTenantEvent({
    tenantId: input.tenantId,
    type: "lead",
    id: input.contactId,
    title: "New lead",
    body: input.name,
    dedupeKey: `lead:${input.contactId}`,
    webUrl: "/dashboard/crm",
  });
}
