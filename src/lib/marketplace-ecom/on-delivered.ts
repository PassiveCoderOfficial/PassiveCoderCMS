import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { pushToUser } from "@/lib/push/web-push";
import { getMarketplaceChrome } from "./chrome";

type Admin = Awaited<ReturnType<typeof createAdminClient>>;

/**
 * Side effects of a parcel reaching the buyer, beyond money (the ledger is
 * posted separately by postSaleOnDelivery):
 *  - bump each product's sold_count (shown on cards and product pages)
 *  - ask the buyer to review, by push and email — the main source of real
 *    reviews on a young marketplace.
 * Never throws; delivery must succeed even if these fail.
 */
export async function afterDelivered(
  admin: Admin,
  sub: { id: string; tenant_id: string; order_id: string; items: unknown },
  origin: string,
) {
  try {
    const items = (sub.items ?? []) as { product_id: string; quantity: number; name?: string }[];
    for (const it of items) {
      const { data: p } = await admin.from("products").select("sold_count").eq("id", it.product_id).maybeSingle();
      if (p) {
        await admin
          .from("products")
          .update({ sold_count: (p.sold_count ?? 0) + (it.quantity ?? 1) })
          .eq("id", it.product_id);
      }
    }

    const { data: order } = await admin
      .from("orders").select("customer_id, customer_email").eq("id", sub.order_id).maybeSingle();
    if (!items.length || !order) return;

    const { data: first } = await admin
      .from("products").select("slug, name").eq("id", items[0].product_id).maybeSingle();
    if (!first) return;
    const chrome = await getMarketplaceChrome(sub.tenant_id);
    const siteName = chrome?.siteName ?? "our marketplace";
    const url = `${origin}/products/${first.slug}?review=1#reviews`;

    if (order.customer_id) {
      await pushToUser(sub.tenant_id, order.customer_id, {
        title: "Your parcel was delivered",
        body: `How was ${first.name}? Tap to leave a review.`,
        url: `/products/${first.slug}?review=1#reviews`,
        tag: `delivered-${sub.id}`,
      });
    }

    const email = order.customer_email as string | null;
    // Guest orders can't review (no account), so only email signed-in buyers.
    if (order.customer_id && email && !email.endsWith("@nomail.local")) {
      const list = items.map((i) => `<li>${(i.name ?? "Item").replace(/[<>&]/g, "")}</li>`).join("");
      await sendEmail({
        to: email,
        from: `${siteName.replace(/[<>"]/g, "")} <contact@noreply.passivecoder.com>`,
        subject: `Delivered! How was your order from ${siteName}?`,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#1A1330">
  <h2 style="margin:0 0 12px">Your parcel has been delivered</h2>
  <ul style="padding-left:18px;color:#344054">${list}</ul>
  <p>Your review helps other shoppers and helps good sellers grow.</p>
  <a href="${url}" style="display:inline-block;margin-top:12px;background:#FF5A1F;color:#fff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:999px">Rate your purchase</a>
</div>`,
        text: `Your parcel from ${siteName} was delivered. Rate your purchase: ${url}`,
      });
    }
  } catch (e) {
    console.error("[marketplace] afterDelivered failed", e);
  }
}
