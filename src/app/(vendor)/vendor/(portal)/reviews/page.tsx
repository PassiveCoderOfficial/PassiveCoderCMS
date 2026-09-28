import { ReviewsClient } from "./reviews-client";

export const metadata = { title: "Reviews · Seller Centre" };

export default function VendorReviewsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Customer reviews</h1>
        <p className="text-sm text-muted-foreground">
          Verified-purchase reviews of your products. A polite public reply builds trust with future buyers.
        </p>
      </div>
      <ReviewsClient />
    </div>
  );
}
