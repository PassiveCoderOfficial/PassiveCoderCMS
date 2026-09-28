import { Suspense } from "react";
import { headers } from "next/headers";
import { getMarketplaceChrome } from "@/lib/marketplace-ecom/chrome";
import { ChatInbox } from "@/components/marketplace-ecom/chat/chat-inbox";

export const metadata = { title: "Messages · Seller Centre" };

export default async function VendorMessagesPage() {
  const chrome = await getMarketplaceChrome((await headers()).get("x-tenant-id"));
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Customer messages</h1>
        <p className="text-sm text-muted-foreground">Fast replies win sales. Turn on notifications so you never miss a buyer.</p>
      </div>
      <Suspense>
        <ChatInbox as="vendor" siteName={chrome?.siteName ?? "our marketplace"} />
      </Suspense>
    </div>
  );
}
