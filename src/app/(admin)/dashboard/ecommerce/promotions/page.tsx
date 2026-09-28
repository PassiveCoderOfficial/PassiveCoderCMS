import { FlashSaleManager } from "@/components/marketplace-ecom/admin/flash-sale-manager";
import { VoucherManager } from "@/components/marketplace-ecom/admin/voucher-manager";

export const metadata = { title: "Promotions — Dashboard" };

export default function PromotionsPage() {
  return (
    <div className="space-y-10 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Promotions</h1>
        <p className="text-sm text-muted-foreground">Flash sales and platform vouchers for your marketplace.</p>
      </div>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Flash sales</h2>
        <FlashSaleManager />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Platform vouchers</h2>
        <VoucherManager endpoint="/api/marketplace-ecom/vouchers" />
      </section>
    </div>
  );
}
