import Link from "next/link";
import { Store, ImageOff } from "lucide-react";
import AddToCartButton from "./add-to-cart-button";

export interface CardProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price: number | null;
  images: string[];
  stock_quantity: number;
  track_inventory: boolean;
  featured?: boolean;
  vendors: { id?: string; name: string; slug: string | null } | null;
}

const tk = (n: number) => `৳${Number(n).toLocaleString()}`;

/** One product tile, shared by the home page and the catalog so a card never
 *  drifts between the two. */
export function ProductCard({ product: p }: { product: CardProduct }) {
  const img = Array.isArray(p.images) ? p.images[0] : undefined;
  const out = p.track_inventory && p.stock_quantity <= 0;
  const low = p.track_inventory && p.stock_quantity > 0 && p.stock_quantity <= 5;
  const off =
    p.compare_price && p.compare_price > p.price
      ? Math.round(((p.compare_price - p.price) / p.compare_price) * 100)
      : 0;

  return (
    <div className="group flex flex-col rounded-2xl border border-[#EAECF0] bg-white overflow-hidden hover:border-[#FF5A1F]/50 hover:shadow-xl transition-all duration-200">
      <Link href={`/products/${p.slug}`} className="relative block aspect-square bg-[#F9FAFB] overflow-hidden">
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
          <span className="absolute top-2.5 left-2.5 bg-[#FF5A1F] text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-sm">
            −{off}%
          </span>
        )}
        {out && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
            <span className="text-xs font-semibold text-[#1A1330] bg-white px-3 py-1.5 rounded-full border border-[#EAECF0]">
              Out of stock
            </span>
          </div>
        )}
        {!out && low && (
          <span className="absolute bottom-2.5 left-2.5 bg-[#1A1330]/85 text-white text-[11px] font-medium px-2 py-1 rounded-lg backdrop-blur">
            Only {p.stock_quantity} left
          </span>
        )}
      </Link>

      <div className="p-3.5 flex flex-col flex-1 gap-1">
        <Link
          href={`/products/${p.slug}`}
          className="font-medium text-sm text-[#1A1330] line-clamp-2 leading-snug hover:text-[#FF5A1F] transition-colors"
        >
          {p.name}
        </Link>

        {p.vendors && (
          <Link
            href={`/shop?vendor=${p.vendors.slug}`}
            className="text-xs text-[#667085] flex items-center gap-1 hover:text-[#FF5A1F] transition-colors w-fit"
          >
            <Store className="w-3 h-3 shrink-0" />
            <span className="truncate">{p.vendors.name}</span>
          </Link>
        )}

        <div className="mt-auto pt-2.5">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold text-[#1A1330]">{tk(p.price)}</span>
            {off > 0 && (
              <span className="text-xs text-[#98A2B3] line-through">{tk(p.compare_price!)}</span>
            )}
          </div>
          <AddToCartButton
            product={{
              id: p.id,
              product_id: p.id,
              name: p.name,
              slug: p.slug,
              price: Number(p.price),
              image: img,
            }}
            disabled={out}
          />
        </div>
      </div>
    </div>
  );
}
