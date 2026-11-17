import { TrackClient } from "./track-client";

export const metadata = { title: "Track your order" };

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ order?: string; phone?: string; id?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-8 sm:py-12">
      <TrackClient initialOrder={sp.order ?? ""} initialPhone={sp.phone ?? ""} orderId={sp.id ?? null} />
    </div>
  );
}
