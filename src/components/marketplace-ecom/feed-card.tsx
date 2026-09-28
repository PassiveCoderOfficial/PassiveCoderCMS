import Link from "next/link";
import { ImageOff, Star, Store } from "lucide-react";
import type { CardProduct } from "./product-card";

const tk = (n: number) => `৳${Number(n).toLocaleString()}`;
const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

/**
 * Dense discovery tile — the Shopee / Lazada / Daraz "Just for you" card.
 * No add-to-cart button: on marketplace feeds the tap goes to the product,
 * which keeps tiles short enough to fit two-and-a-bit rows per phone screen.
 */
export function FeedCard({ product: p }: { product: CardProduct }) {
  const img = Array.isArray(p.images) ? p.images[0] : undefined;
  const out = p.track_inventory && p.stock_quantity <= 0;
  const off =
    p.compare_price && p.compare_price > p.price
      ? Math.round(((p.compare_price - p.price) / p.compare_price) * 100)
      : 0;

  return (
    <Link
      href={`/products/${p.slug}`}
      className="group flex flex-col bg-white rounded-lg overflow-hidden border border-transparent hover:border-[#FF5A1F] hover:shadow-md transition-all"
    >
      <div className="relative aspect-square bg-[#F4F4F5] overflow-hidden">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={p.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="w-7 h-7 text-[#D0D5DD]" />
          </div>
        )}
        {off > 0 && (
          <span className="absolute top-0 right-0 bg-[#FFE9E0] text-[#FF5A1F] text-[11px] font-bold px-1.5 py-0.5 rounded-bl-md">
            -{off}%
          </span>
        )}
        {out && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-xs font-semibold text-white bg-black/60 px-3 py-1 rounded-full">
              Sold out
            </span>
          </div>
        )}
      </div>
      <div className="p-2 flex flex-col flex-1 gap-1">
        <p className="text-[13px] leading-snug text-[#1A1330] line-clamp-2 min-h-[2.4em]">
          {p.featured && (
            <span className="inline-block align-[1px] mr-1 text-[10px] font-bold text-white bg-[#FF5A1F] px-1 rounded-sm">
              Hot
            </span>
          )}
          {p.name}
        </p>
        <div className="mt-auto flex items-baseline gap-1.5 flex-wrap">
          <span className="text-base font-bold text-[#FF5A1F]">{tk(p.price)}</span>
          {off > 0 && (
            <span className="text-[11px] text-[#98A2B3] line-through">{tk(p.compare_price!)}</span>
          )}
        </div>
        {((p.rating_count ?? 0) > 0 || (p.sold_count ?? 0) > 0) && (
          <span className="text-[11px] text-[#667085] flex items-center gap-1">
            {(p.rating_count ?? 0) > 0 && (
              <>
                <Star className="w-3 h-3 text-[#FFB400] fill-[#FFB400]" />
                {Number(p.rating_avg).toFixed(1)}
              </>
            )}
            {(p.rating_count ?? 0) > 0 && (p.sold_count ?? 0) > 0 && <span className="text-[#D0D5DD]">|</span>}
            {(p.sold_count ?? 0) > 0 && <span>{compact(p.sold_count!)} sold</span>}
          </span>
        )}
        {p.vendors && (
          <span className="text-[11px] text-[#667085] flex items-center gap-1 truncate">
            <Store className="w-3 h-3 shrink-0" />
            <span className="truncate">{p.vendors.name}</span>
          </span>
        )}
      </div>
    </Link>
  );
}
