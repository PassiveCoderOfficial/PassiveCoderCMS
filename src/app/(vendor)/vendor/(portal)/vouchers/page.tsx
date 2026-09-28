import { VoucherManager } from "@/components/marketplace-ecom/admin/voucher-manager";

export const metadata = { title: "Vouchers · Seller Centre" };

export default function VendorVouchersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Shop vouchers</h1>
        <p className="text-sm text-muted-foreground">Give buyers a reason to order today. Vouchers show on your product pages and at checkout.</p>
      </div>
      <VoucherManager endpoint="/api/vendor/vouchers" seller />
    </div>
  );
}
