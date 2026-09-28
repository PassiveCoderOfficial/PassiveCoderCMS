import { Star } from "lucide-react";

/** Read-only star row; supports halves by clipping a filled star. */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 text-[#E4E7EC] fill-[#E4E7EC]" style={{ width: size, height: size }} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="text-[#FFB400] fill-[#FFB400]" style={{ width: size, height: size }} />
            </span>
          </span>
        );
      })}
    </span>
  );
}
