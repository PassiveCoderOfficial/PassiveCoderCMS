"use client";

import { useState } from "react";
import { Check, Ticket } from "lucide-react";

interface V {
  id: string;
  vendor_id: string | null;
  code: string;
  kind: string;
  value: number;
  min_spend: number;
  vendors?: { name: string } | null;
}

const tk = (n: number) => `৳${Number(n).toLocaleString()}`;

/** Shopee-style voucher strip on product pages: tap to copy the code; the
 *  checkout also lists the same vouchers with a one-tap "Use". */
export function VoucherChips({ vouchers }: { vouchers: V[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  return (
    <div className="flex gap-4 text-sm">
      <span className="w-20 shrink-0 text-[#667085] pt-1.5">Vouchers</span>
      <div className="flex flex-wrap gap-2">
        {vouchers.slice(0, 6).map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(v.code).catch(() => {});
              setCopied(v.id);
              setTimeout(() => setCopied(null), 1500);
            }}
            title={`Code ${v.code}${v.min_spend ? ` · min spend ${tk(v.min_spend)}` : ""}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF5A1F] bg-[#FFF1EB] border border-dashed border-[#FF5A1F]/50 rounded-md px-2 py-1"
          >
            {copied === v.id ? <Check className="w-3.5 h-3.5" /> : <Ticket className="w-3.5 h-3.5" />}
            {v.kind === "percent" ? `${Number(v.value)}% off` : v.kind === "fixed" ? `${tk(v.value)} off` : "Free delivery"}
            {v.min_spend > 0 && <span className="font-normal text-[#667085]">min {tk(v.min_spend)}</span>}
            {!v.vendor_id && <span className="text-[10px] bg-[#FF5A1F] text-white rounded px-1">ALL</span>}
            {copied === v.id && <span className="font-normal">copied</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
