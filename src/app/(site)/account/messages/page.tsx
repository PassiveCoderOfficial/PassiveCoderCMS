import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMarketplaceChrome } from "@/lib/marketplace-ecom/chrome";
import { ChatInbox } from "@/components/marketplace-ecom/chat/chat-inbox";
import { AccountNav } from "../account-nav";

export const metadata = { title: "Messages" };

export default async function AccountMessagesPage() {
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) redirect("/");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account/login?next=/account/messages");
  const chrome = await getMarketplaceChrome(tenantId);

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-3 sm:px-4">
      <AccountNav />
      <Suspense>
        <ChatInbox as="buyer" siteName={chrome?.siteName ?? "our store"} />
      </Suspense>
    </div>
  );
}
